import * as path from 'node:path';
import { App, Duration, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebFunction, WebFunctionAuthType, WebFunctionDeployment, WebFunctionEndpointType, WebFunctionRevision, type WebFunctionProps } from '../src';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };
const SHIFT = 'Custom::LambdaWebTrafficShift';

function make(props: Partial<WebFunctionProps> = {}) {
  const stack = new Stack(new App(), 'Stack', { env });
  const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, ...props });
  return { stack, fn, template: () => Template.fromStack(stack) };
}

function alarm(stack: Stack, id = 'Errors') {
  return new cloudwatch.Alarm(stack, id, {
    metric: new cloudwatch.Metric({ namespace: 'App', metricName: 'Errors' }), threshold: 1, evaluationPeriods: 1,
  });
}

const currentRevision = { 'Fn::GetAtt': [Match.stringLikeRegexp('^ApiRevision'), 'RevisionId'] };
const shifts = (t: Template) => t.findResources(SHIFT);
const providerPolicy = (t: Template) => {
  const policies = t.findResources('AWS::IAM::Policy');
  const [, policy] = Object.entries(policies).find(([k]) => k.startsWith('LambdaWebDeploymentProviderRoleDefaultPolicy'))! as [string, any];
  return policy.Properties.PolicyDocument.Statement;
};

describe('deployment', () => {
  test('all at once by default: no deployment step, CloudFormation switches the endpoint', () => {
    for (const deployment of [undefined, WebFunctionDeployment.allAtOnce()]) {
      const t = make({ endpoint: { deployment } }).template();
      expect(shifts(t)).toEqual({});
      t.resourceCountIs('AWS::StepFunctions::StateMachine', 0);
    }
  });
});

describe('canary and linear deployments', () => {
  function canaryFunction() {
    const stack = new Stack(new App(), 'Stack', { env });
    const errors = alarm(stack);
    const fn = new WebFunction(stack, 'Api', {
      runtime: lambda.Runtime.NODEJS_24_X,
      code: code(),
      authType: WebFunctionAuthType.AWS_IAM,
      endpoint: { deployment: WebFunctionDeployment.canary({ percent: 10, bake: Duration.minutes(5), alarms: [errors] }) },
    });
    return { stack, fn, t: Template.fromStack(stack) };
  }

  test('canary: the shift runs before CloudFormation writes the endpoint, for the current revision', () => {
    const { fn, t } = canaryFunction();

    t.hasResourceProperties(SHIFT, {
      FunctionArn: { 'Fn::GetAtt': [Match.stringLikeRegexp('^Api'), 'FunctionArn'] },
      EndpointName: fn.endpoint.endpointName,
      RevisionId: currentRevision,
      Steps: '10,100',
      WaitSeconds: '300',
      AlarmArns: [{ 'Fn::GetAtt': [Match.stringLikeRegexp('^Errors'), 'Arn'] }],
      EndpointConfig: Match.stringLikeRegexp('^[0-9a-f]{16}$'),
      ServiceTimeout: '3600',
    });
    const [shiftId] = Object.keys(shifts(t));
    expect(shiftId).toMatch(/^ApiEndpointDeployment/);
    // Only one writer at a time: the endpoint waits for the shift, and keeps declaring the current revision at 100%.
    t.hasResource('AWS::Lambda::WebFunctionEndpoint', {
      DependsOn: Match.arrayWith([shiftId]),
      Properties: { RevisionWeights: [{ RevisionId: currentRevision, Weight: 100 }] },
    });
  });

  test('linear on an added endpoint; several endpoints with different strategies share one provider', () => {
    const { fn, template } = make();
    fn.addEndpoint('Public', {
      authType: WebFunctionAuthType.NONE,
      deployment: WebFunctionDeployment.linear({ percent: 20, interval: Duration.minutes(2) }),
    });
    fn.addEndpoint('Global', {
      authType: WebFunctionAuthType.AWS_IAM,
      endpointType: WebFunctionEndpointType.MULTI_REGION,
      regions: ['us-east-1'],
      deployment: WebFunctionDeployment.canary({ percent: 5, bake: Duration.minutes(10) }),
    });
    const t = template();

    t.hasResourceProperties(SHIFT, { Steps: '20,40,60,80,100', WaitSeconds: '120', AlarmArns: Match.absent() });
    t.hasResourceProperties(SHIFT, { Steps: '5,100', WaitSeconds: '600' });
    expect(Object.keys(shifts(t))).toHaveLength(2);
    t.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    // The default endpoint deploys all at once.
    t.hasResource('AWS::Lambda::WebFunctionEndpoint', { DependsOn: Match.absent(), Properties: { EndpointName: fn.endpoint.endpointName } });
  });

  test('the provider waits up to 55 minutes, checking every 15 seconds, with arm64 Node.js handlers', () => {
    const { t } = canaryFunction();
    const handlers = Object.values(t.findResources('AWS::Lambda::Function')).map((f: any) => f.Properties)
      .filter((p) => /^index\.(onEvent|isComplete)$/.test(p.Handler));
    expect(handlers.map((p) => p.Handler).sort()).toEqual(['index.isComplete', 'index.onEvent']);
    for (const p of handlers) {
      expect(p).toMatchObject({ Runtime: 'nodejs24.x', Architectures: ['arm64'], Timeout: 420 });
    }
    const [machine] = Object.values(t.findResources('AWS::StepFunctions::StateMachine')) as any[];
    const definition = JSON.stringify(machine.Properties.DefinitionString);
    expect(definition).toContain('\\"IntervalSeconds\\":15');
    expect(definition).toContain('\\"MaxAttempts\\":220'); // 55 minutes
    t.hasResourceProperties('AWS::Logs::LogGroup', { RetentionInDays: 30 });
  });

  test('the provider may read and update only this function\'s endpoints, read alarms and its own stack', () => {
    const t = make({ webFunctionName: 'orders', endpoint: { deployment: WebFunctionDeployment.canary({ percent: 10, bake: Duration.minutes(1) }) } }).template();
    const fnArn = (suffix: string) => ({ 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, `:lambda:ap-south-1:111111111111:web-function/orders${suffix}`]] });
    expect(providerPolicy(t)).toEqual(expect.arrayContaining([
      { Effect: 'Allow', Action: 'cloudformation:DescribeStacks', Resource: { Ref: 'AWS::StackId' } },
      { Effect: 'Allow', Action: 'cloudwatch:DescribeAlarms', Resource: '*' },
      {
        Effect: 'Allow',
        Action: ['lambda:GetWebFunctionEndpoint', 'lambda:UpdateWebFunctionEndpoint'],
        Resource: [fnArn(''), fnArn('/endpoint/*'), fnArn('/revision/*')],
      },
    ]));
  });

  test('provider grants stay the same when an endpoint is renamed (IAM must not change under a running deployment)', () => {
    const policyFor = (regions: string[]) => providerPolicy(make({
      webFunctionName: 'orders',
      endpoint: {
        endpointType: WebFunctionEndpointType.PER_REGION,
        regions,
        deployment: WebFunctionDeployment.canary({ percent: 10, bake: Duration.minutes(1) }),
      },
    }).template());
    expect(policyFor(['us-east-1'])).toEqual(policyFor(['us-east-1', 'eu-west-1']));
  });

  test('any endpoint change re-runs the shift, which re-checks the live traffic before CloudFormation writes it', () => {
    const configOf = (rateLimit?: number) => {
      const t = make({ endpoint: { rateLimit, deployment: WebFunctionDeployment.canary({ percent: 10, bake: Duration.minutes(1) }) } }).template();
      return (Object.values(shifts(t))[0] as any).Properties.EndpointConfig;
    };
    expect(configOf(100)).not.toEqual(configOf(200));
    expect(configOf(100)).toEqual(configOf(100));
  });

  test('a deployment in steps always moves to the current revision: no pinning, splits or routeTraffic', () => {
    const { fn } = make({ endpoint: { deployment: WebFunctionDeployment.canary({ percent: 10, bake: Duration.minutes(1) }) } });
    const previous = WebFunctionRevision.fromRevisionAttributes(fn, 'Previous', { webFunction: fn, revisionId: 'rev-prev1' });
    const deployment = WebFunctionDeployment.linear({ percent: 10, interval: Duration.minutes(1) });

    expect(() => fn.endpoint.routeTraffic(previous)).toThrow(/routeTraffic\(\) can't be used with it/);
    expect(() => fn.addEndpoint('Pinned', { authType: WebFunctionAuthType.NONE, deployment, revision: previous }))
      .toThrow(/a linear deployment always moves to the current revision; it can't also set revision or additionalRevisions/);
    expect(() => fn.addEndpoint('Split', { authType: WebFunctionAuthType.NONE, deployment, additionalRevisions: [{ revision: previous, weight: 0.1 }] }))
      .toThrow(/can't also set revision or additionalRevisions/);
    // All at once is the default behaviour, so it combines with routing.
    expect(() => fn.addEndpoint('Ok', { authType: WebFunctionAuthType.NONE, deployment: WebFunctionDeployment.allAtOnce(), revision: previous })).not.toThrow();
  });

  test('validation', () => {
    const minutes = Duration.minutes;
    for (const percent of [0, 100, 2.5]) {
      expect(() => WebFunctionDeployment.canary({ percent, bake: minutes(5) })).toThrow(/canary: percent must be a whole number from 1 to 99/);
    }
    for (const bake of [Duration.seconds(59), minutes(46)]) {
      expect(() => WebFunctionDeployment.canary({ percent: 10, bake })).toThrow(/canary: bake must be from 1 to 45 minutes/);
    }
    for (const percent of [4, 51, 12.5]) {
      expect(() => WebFunctionDeployment.linear({ percent, interval: minutes(1) })).toThrow(/linear: percent must be a whole number from 5 to 50/);
    }
    expect(() => WebFunctionDeployment.linear({ percent: 10, interval: Duration.seconds(30) })).toThrow(/interval must be from 1 to 45 minutes/);
    expect(() => WebFunctionDeployment.linear({ percent: 10, interval: minutes(6) })).toThrow(/9 intervals of 6 minutes take 54 minutes; at most 45 are allowed/);
    expect(() => WebFunctionDeployment.linear({ percent: 10, interval: minutes(5) })).not.toThrow();
    expect(WebFunctionDeployment.linear({ percent: 30, interval: minutes(1) })._steps).toEqual([30, 60, 90, 100]);
    expect(WebFunctionDeployment.canary({ percent: 1, bake: minutes(45) })._steps).toEqual([1, 100]);
  });
});
