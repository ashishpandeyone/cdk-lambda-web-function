import * as path from 'node:path';
import { App, Duration, Stack, Validations, type StackProps } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { AwsSolutionsChecks } from 'cdk-nag';
import { NodejsWebFunction, WebFunction, WebFunctionAuthType, WebFunctionDeployment, WebFunctionEndpointType, WebFunctionOrigin } from '../src';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };

/** Everything this library can create: endpoints of every type, a deployment, lookups, policies, keys for revisions and logs, an origin, an import. */
function app(stackProps: StackProps = { env }) {
  // Regional endpoints need a stack with an explicit region.
  const regions = stackProps.env?.region !== undefined;
  const a = new App();
  const stack = new Stack(a, 'Fn', stackProps);
  const fn = new WebFunction(stack, 'Api', {
    runtime: lambda.Runtime.NODEJS_24_X,
    code: code(),
    authType: WebFunctionAuthType.AWS_IAM,
    endpoint: {
      ...(regions ? { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] } : {}),
      deployment: WebFunctionDeployment.canary({ percent: 10, bake: Duration.minutes(10), rollbackOn: { serverErrorRate: 5 } }),
    },
  });
  if (regions) {
    fn.addEndpoint('Global', { authType: WebFunctionAuthType.AWS_IAM, endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['eu-west-1'] });
    fn.endpoint.regionalUrl('us-east-1');
  }
  fn.addPermission('Partner', { principal: new iam.AccountPrincipal('222222222222') });
  const key = new kms.Key(stack, 'Key', { enableKeyRotation: true });
  new NodejsWebFunction(stack, 'Node', {
    entry: path.join(__dirname, 'fixtures', 'nodejs', 'server.ts'),
    authType: WebFunctionAuthType.NONE,
    encryptionKey: key,
    logEncryptionKey: key,
  });

  const cdnStack = new Stack(a, 'Cdn', stackProps);
  const cdn = new cloudfront.Distribution(cdnStack, 'Cdn', { defaultBehavior: { origin: WebFunctionOrigin.withOriginAccessControl(fn.endpoint) } });
  // The distribution's own settings are the user's to decide.
  for (const id of ['CFR1', 'CFR2', 'CFR3', 'CFR4']) {
    Validations.of(cdn.node.defaultChild!).acknowledge({ id: `AwsSolutions::AwsSolutions-${id}`, reason: 'test distribution' });
  }
  WebFunction.fromWebFunctionArn(cdnStack, 'Imported', 'arn:aws:lambda:ap-south-1:111111111111:web-function/x')
    .grantInvoke(new iam.AccountPrincipal('333333333333'));

  Validations.of(a).addPlugins(new AwsSolutionsChecks(a));
  return { app: a, stack, fn };
}

const synthErrors = (a: App) => {
  try {
    a.synth();
    return '';
  } catch (e) {
    return (e as Error).message;
  }
};

describe('cdk-nag (AwsSolutions)', () => {
  test('no findings on what the library creates', () => {
    expect(synthErrors(app().app)).toBe('');
  });

  test('no findings in an environment-agnostic stack either (home-region endpoints)', () => {
    expect(synthErrors(app({}).app)).toBe('');
  });

  test('the user\'s own statements on the execution role are still checked', () => {
    const { app: a, fn } = app();
    fn.addToRolePolicy(new iam.PolicyStatement({ actions: ['s3:*'], resources: ['*'] }));
    const errors = synthErrors(a);
    expect(errors).toMatch(/Fn\/Api\/ServiceRole\/DefaultPolicy\/Resource[\s\S]*AwsSolutions-IAM5\[Action::s3:\*\]/);
    expect(errors).toContain('AwsSolutions-IAM5[Resource::*]');
  });

  test('cdk-nag 2 metadata on the same resources', () => {
    const a = new App();
    const stack = new Stack(a, 'Fn', { env });
    new WebFunction(stack, 'Api', {
      runtime: lambda.Runtime.NODEJS_24_X,
      code: code(),
      authType: WebFunctionAuthType.AWS_IAM,
      endpoint: { deployment: WebFunctionDeployment.canary({ percent: 10, bake: Duration.minutes(5) }) },
    });
    const resources = Template.fromStack(stack).toJSON().Resources as Record<string, any>;
    const suppressed = (match: RegExp) => Object.entries(resources).filter(([id]) => match.test(id))
      .map(([, r]) => (r.Metadata?.cdk_nag?.rules_to_suppress ?? []).map((s: any) => s.id));
    expect(suppressed(/^LambdaWebFunctionCodeBucket[0-9A-F]{8}$/)).toEqual([['AwsSolutions-S1']]);
    expect(suppressed(/^ApiServiceRole[0-9A-F]{8}$/)).toEqual([['AwsSolutions-IAM5']]);
    expect(suppressed(/^LambdaWebDeploymentProviderRoleDefaultPolicy[0-9A-F]{8}$/)).toEqual([['AwsSolutions-IAM5']]);
    expect(suppressed(/^LambdaWebDeploymentProviderwaiterstatemachine[0-9A-F]{8}$/)).toEqual([['AwsSolutions-SF1', 'AwsSolutions-SF2']]);
    expect(suppressed(/^LambdaWebDeploymentProviderframeworkonEventServiceRole[0-9A-F]{8}$/)).toEqual([['AwsSolutions-IAM5', 'AwsSolutions-IAM4']]);
  });
});

describe('default execution role', () => {
  test('writes only to the function\'s own log groups, with no AWS managed policy', () => {
    const stack = new Stack(new App(), 'Fn', { env });
    const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM });
    const roles = Template.fromStack(stack).findResources('AWS::IAM::Role');
    const role = Object.entries(roles).find(([id]) => id.startsWith('ApiServiceRole'))![1] as any;
    expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    const arn = (region: string, suffix: string) => ({
      'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, `:logs:${region}:111111111111:log-group:/aws/lambda/web/${fn.webFunctionName}${suffix}:*`]],
    });
    expect(role.Properties.Policies).toEqual([{
      PolicyName: 'Logs',
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [{ Effect: 'Allow', Action: ['logs:CreateLogStream', 'logs:PutLogEvents'], Resource: [arn('ap-south-1', ''), arn('*', '.local')] }],
      },
    }]);
  });

  test('the deployment handlers write only to their own log group', () => {
    const stack = new Stack(new App(), 'Fn', { env });
    new WebFunction(stack, 'Api', {
      runtime: lambda.Runtime.NODEJS_24_X,
      code: code(),
      authType: WebFunctionAuthType.AWS_IAM,
      endpoint: { deployment: WebFunctionDeployment.canary({ percent: 10, bake: Duration.minutes(5) }) },
    });
    const t = Template.fromStack(stack);
    const [role] = Object.entries(t.findResources('AWS::IAM::Role')).filter(([id]) => /^LambdaWebDeploymentProviderRole[0-9A-F]{8}$/.test(id)).map(([, r]) => r) as any[];
    expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    const [policy] = Object.entries(t.findResources('AWS::IAM::Policy')).filter(([id]) => id.startsWith('LambdaWebDeploymentProviderRoleDefaultPolicy')).map(([, r]) => r) as any[];
    expect(policy.Properties.PolicyDocument.Statement[0]).toEqual({
      Effect: 'Allow',
      Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
      Resource: { 'Fn::GetAtt': [expect.stringMatching(/^LambdaWebDeploymentProviderLogs/), 'Arn'] },
    });
  });
});
