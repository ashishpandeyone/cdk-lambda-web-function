import * as path from 'node:path';
import { App, Fn, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebFunction, WebFunctionAuthType, WebFunctionEndpointType, type WebFunctionProps } from '../src';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };

function make(props: (stack: Stack) => Partial<WebFunctionProps>) {
  const app = new App();
  const stack = new Stack(app, 'Stack', { env });
  const fn = new WebFunction(stack, 'Api', {
    runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, webFunctionName: 'api', ...props(stack),
  });
  return { app, stack, fn, template: () => Template.fromStack(stack) };
}

const revisions = 'arn:aws:lambda:ap-south-1:111111111111:web-function/api/revision/*';
const lambdaStatement = {
  Effect: 'Allow',
  Principal: { Service: 'lambda.amazonaws.com' },
  Action: 'kms:Decrypt',
  Resource: '*',
  Condition: {
    StringLike: {
      'aws:SourceArn': { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, revisions.replace(/^arn:aws/, '')]] },
      'kms:EncryptionContext:aws:lambda:WebFunctionRevisionArn': { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, revisions.replace(/^arn:aws/, '')]] },
    },
  },
};

describe('encryptionKey', () => {
  test('encrypts the revision with the key; a key in the app lets Lambda decrypt for this function\'s revisions', () => {
    const { fn, template } = make((stack) => ({ encryptionKey: new kms.Key(stack, 'Key') }));
    const t = template();
    t.hasResourceProperties('AWS::Lambda::WebFunctionRevision', { KmsKeyArn: { 'Fn::GetAtt': [Match.stringLikeRegexp('^Key'), 'Arn'] } });
    t.hasResourceProperties('AWS::KMS::Key', { KeyPolicy: { Statement: Match.arrayWith([lambdaStatement]) } });
    expect(fn.encryptionKey).toBeDefined();
  });

  test('none by default: an AWS owned key', () => {
    const { template } = make(() => ({}));
    template().hasResourceProperties('AWS::Lambda::WebFunctionRevision', { KmsKeyArn: Match.absent() });
  });

  test('an imported key is used as is (its policy is managed elsewhere)', () => {
    const arn = 'arn:aws:kms:ap-south-1:111111111111:key/1234abcd-12ab-34cd-56ef-1234567890ab';
    const { template } = make((stack) => ({ encryptionKey: kms.Key.fromKeyArn(stack, 'Key', arn) }));
    template().hasResourceProperties('AWS::Lambda::WebFunctionRevision', { KmsKeyArn: arn });
  });

  test('a single-Region key is fine for a HOME_REGION endpoint', () => {
    const { app } = make((stack) => ({ encryptionKey: new kms.Key(stack, 'Key') }));
    expect(() => app.synth()).not.toThrow();
  });

  test.each([
    ['PER_REGION', { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] }],
    ['MULTI_REGION', { endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1'] }],
  ])('a %s endpoint needs a multi-Region key', (_, endpoint) => {
    const single = make((stack) => ({ encryptionKey: new kms.Key(stack, 'Key'), endpoint }));
    expect(() => single.app.synth()).toThrow(/encryptionKey must be a multi-Region key .* for Endpoint \((PER|MULTI)_REGION\)/);
    const multi = make((stack) => ({ encryptionKey: new kms.Key(stack, 'Key', { multiRegion: true }), endpoint }));
    expect(() => multi.app.synth()).not.toThrow();
  });

  test('also for an endpoint added later', () => {
    const { app, fn } = make((stack) => ({ encryptionKey: new kms.Key(stack, 'Key') }));
    fn.addEndpoint('Global', { authType: WebFunctionAuthType.AWS_IAM, endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1'] });
    expect(() => app.synth()).toThrow(/for Global \(MULTI_REGION\)/);
  });

  test('an imported key: multi-Region when its key ID is mrk-; unknown for a token', () => {
    const endpoint = { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] };
    const mrk = make((stack) => ({ encryptionKey: kms.Key.fromKeyArn(stack, 'Key', 'arn:aws:kms:ap-south-1:111111111111:key/mrk-1234abcd12ab34cd56ef1234567890ab'), endpoint }));
    expect(() => mrk.app.synth()).not.toThrow();
    const single = make((stack) => ({ encryptionKey: kms.Key.fromKeyArn(stack, 'Key', 'arn:aws:kms:ap-south-1:111111111111:key/1234abcd-12ab-34cd-56ef-1234567890ab'), endpoint }));
    expect(() => single.app.synth()).toThrow(/must be a multi-Region key/);
    const token = make((stack) => ({ encryptionKey: kms.Key.fromKeyArn(stack, 'Key', Fn.importValue('KeyArn')), endpoint }));
    expect(() => token.app.synth()).not.toThrow();
  });

  test('encryptionKeyPolicyStatement() can go into a replica\'s policy in another stack without a cross-stack reference', () => {
    const { app, fn } = make((stack) => ({ encryptionKey: new kms.Key(stack, 'Key', { multiRegion: true }) }));
    const replicaStack = new Stack(app, 'Replica', { env: { account: '111111111111', region: 'us-east-1' } });
    new kms.CfnReplicaKey(replicaStack, 'Replica', {
      primaryKeyArn: 'arn:aws:kms:ap-south-1:111111111111:key/mrk-1234abcd12ab34cd56ef1234567890ab',
      keyPolicy: new iam.PolicyDocument({ statements: [fn.encryptionKeyPolicyStatement()] }),
    });
    const assembly = app.synth();
    expect(assembly.getStackByName('Replica').dependencies.filter((d) => !d.id.endsWith('.assets'))).toEqual([]);
    Template.fromStack(replicaStack).hasResourceProperties('AWS::KMS::ReplicaKey', { KeyPolicy: { Statement: [lambdaStatement] } });
  });
});

test('functions sharing a key each add their own statement, without Sids that would clash', () => {
  const app = new App();
  const stack = new Stack(app, 'Stack', { env });
  const key = new kms.Key(stack, 'Key');
  for (const name of ['a', 'b']) {
    new WebFunction(stack, name, {
      runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, webFunctionName: name, encryptionKey: key,
    });
  }
  const statements = Object.values(Template.fromStack(stack).findResources('AWS::KMS::Key'))[0].Properties.KeyPolicy.Statement;
  const lambdas = statements.filter((s: { Principal: { Service?: string } }) => s.Principal.Service === 'lambda.amazonaws.com');
  expect(lambdas.map((s: { Sid?: string }) => s.Sid)).toEqual([undefined, undefined]);
  expect(JSON.stringify(lambdas)).toMatch(/web-function\/a\/revision.*web-function\/b\/revision/);
});

describe('logEncryptionKey', () => {
  const mrkIn = (region: string) => `arn:aws:kms:${region}:111111111111:key/mrk-1234abcd12ab34cd56ef1234567890ab`;
  const perRegion = { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] };
  const groupKeys = (t: Template) => Object.fromEntries(Object.values(t.findResources('Custom::LambdaWebLogGroup'))
    .map((r) => [`${r.Properties.Region}:${r.Properties.LogGroupName}`, r.Properties.KmsKeyId]));
  const logsStatement = (region: string) => ({
    Effect: 'Allow',
    Principal: { Service: `logs.${region}.amazonaws.com` },
    Action: ['kms:Encrypt*', 'kms:Decrypt*', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:Describe*'],
    Resource: '*',
    Condition: {
      ArnLike: {
        'kms:EncryptionContext:aws:logs:arn': { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, `:logs:${region}:111111111111:log-group:/aws/lambda/web/api*`]] },
      },
    },
  });

  test('encrypts every log group; a key in the app lets CloudWatch Logs in its region use it for this function\'s groups', () => {
    const { template } = make((stack) => ({ logEncryptionKey: new kms.Key(stack, 'Key') }));
    const t = template();
    const keyArn = { 'Fn::GetAtt': [Match.stringLikeRegexp('^Key'), 'Arn'] };
    for (const name of ['/aws/lambda/web/api', '/aws/lambda/web/api.local']) {
      t.hasResourceProperties('Custom::LambdaWebLogGroup', { Region: 'ap-south-1', LogGroupName: name, KmsKeyId: keyArn });
    }
    t.hasResourceProperties('AWS::KMS::Key', { KeyPolicy: { Statement: Match.arrayWith([logsStatement('ap-south-1')]) } });
    // The revision keeps the AWS owned key: the two keys are separate.
    t.hasResourceProperties('AWS::Lambda::WebFunctionRevision', { KmsKeyArn: Match.absent() });
  });

  test('none by default', () => {
    const { template } = make(() => ({}));
    expect(Object.values(groupKeys(template()))).toEqual([undefined, undefined]);
  });

  test('an environment-agnostic stack: the home groups use the key in the same stack as is', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');
    const key = new kms.Key(stack, 'Key');
    new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, logEncryptionKey: key });
    expect(Object.values(groupKeys(Template.fromStack(stack)))).toEqual([stack.resolve(key.keyArn), stack.resolve(key.keyArn)]);
  });

  test('other regions use the multi-Region key\'s replica there; the provider may describe each (CreateLogGroup checks)', () => {
    const { template } = make((stack) => ({ logEncryptionKey: kms.Key.fromKeyArn(stack, 'Key', mrkIn('ap-south-1')), endpoint: perRegion }));
    const statements = Object.values(template().findResources('AWS::IAM::Role')).flatMap((r) => r.Properties.Policies ?? []).flatMap((p) => p.PolicyDocument.Statement);
    expect(statements.filter((st) => st.Action === 'kms:DescribeKey').map((st) => st.Resource)).toEqual([mrkIn('ap-south-1'), mrkIn('us-east-1')]);
    expect(groupKeys(template())).toEqual({
      'ap-south-1:/aws/lambda/web/api': mrkIn('ap-south-1'),
      'ap-south-1:/aws/lambda/web/api.local': mrkIn('ap-south-1'),
      'us-east-1:/aws/lambda/web/api.local': mrkIn('us-east-1'),
    });
  });

  test('a multi-Region key in the app: the replica ARN is derived from the key\'s', () => {
    const { template } = make((stack) => ({ logEncryptionKey: new kms.Key(stack, 'Key', { multiRegion: true }), endpoint: perRegion }));
    const remote = groupKeys(template())['us-east-1:/aws/lambda/web/api.local'];
    expect(remote).toEqual({ 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':kms:us-east-1:111111111111:key/', { Ref: expect.stringMatching(/^Key/) }]] });
  });

  test('a single-Region key can\'t serve other regions', () => {
    const single = make((stack) => ({ logEncryptionKey: new kms.Key(stack, 'Key'), endpoint: perRegion }));
    expect(() => single.app.synth()).toThrow(/logEncryptionKey must be a multi-Region key .* for the log groups in us-east-1:/);

    const later = make((stack) => ({ logEncryptionKey: new kms.Key(stack, 'Key') }));
    later.fn.addEndpoint('Global', { authType: WebFunctionAuthType.AWS_IAM, endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['eu-west-1'] });
    expect(() => later.app.synth()).toThrow(/for the log groups in eu-west-1:/);

    const elsewhere = make((stack) => ({ logEncryptionKey: kms.Key.fromKeyArn(stack, 'Key', 'arn:aws:kms:eu-west-1:111111111111:key/1234abcd-12ab-34cd-56ef-1234567890ab') }));
    expect(() => elsewhere.app.synth()).toThrow(/for the log groups in ap-south-1:/);
  });

  test('logEncryptionKeyPolicyStatement() can go into a replica\'s policy in another stack without a cross-stack reference', () => {
    const { app, fn } = make((stack) => ({ logEncryptionKey: new kms.Key(stack, 'Key', { multiRegion: true }), endpoint: perRegion }));
    const replicaStack = new Stack(app, 'Replica', { env: { account: '111111111111', region: 'us-east-1' } });
    new kms.CfnReplicaKey(replicaStack, 'Replica', {
      primaryKeyArn: mrkIn('ap-south-1'),
      keyPolicy: new iam.PolicyDocument({ statements: [fn.logEncryptionKeyPolicyStatement('us-east-1')] }),
    });
    const assembly = app.synth();
    expect(assembly.getStackByName('Replica').dependencies.filter((d) => !d.id.endsWith('.assets'))).toEqual([]);
    Template.fromStack(replicaStack).hasResourceProperties('AWS::KMS::ReplicaKey', { KeyPolicy: { Statement: [logsStatement('us-east-1')] } });
  });
});
