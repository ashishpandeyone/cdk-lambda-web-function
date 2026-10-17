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
  Sid: 'LambdaWebFunctionDecrypt',
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
