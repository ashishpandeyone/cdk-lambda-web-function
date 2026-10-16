import * as path from 'node:path';
import { App, Duration, Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebFunction, WebFunctionAuthType, WebFunctionDeployment, WebFunctionEndpointType, type WebFunctionProps } from '../src';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };
const SHIFT = 'Custom::LambdaWebTrafficShift';
const REMOTE_ALARM = 'Custom::LambdaWebAlarm';

function make(props: Partial<WebFunctionProps> = {}) {
  const stack = new Stack(new App(), 'Stack', { env });
  const fn = new WebFunction(stack, 'Api', {
    runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, webFunctionName: 'orders', ...props,
  });
  return { stack, fn, template: () => Template.fromStack(stack) };
}

const canary = (rollbackOn: object, bake = Duration.minutes(10)) => WebFunctionDeployment.canary({ percent: 10, bake, rollbackOn });

describe('endpoint metrics', () => {
  test('per-endpoint metrics in AWS/Lambda/Web, sum over a minute, in the home region by default', () => {
    const { fn, stack } = make({ endpoint: { endpointName: 'live' } });
    const dims = { FunctionName: 'orders', EndpointName: 'live' };
    for (const [m, name] of [
      [fn.endpoint.metricRequests(), 'ExecutedRequests'],
      [fn.endpoint.metricClientErrors(), 'HTTPResponseStatusClass4XX'],
      [fn.endpoint.metricServerErrors(), 'HTTPResponseStatusClass5XX'],
    ] as const) {
      const actual = {
        namespace: m.namespace, metricName: m.metricName, dims: m.dimensions, statistic: m.statistic, period: m.period.toSeconds(), region: m.region,
      };
      expect(actual)
        .toEqual({ namespace: 'AWS/Lambda/Web', metricName: name, dims, statistic: 'Sum', period: 60, region: undefined });
    }
    const custom = fn.endpoint.metric('ExecutedRequests', { statistic: 'Average', period: Duration.minutes(5), region: 'us-east-1' });
    expect([custom.statistic, custom.period.toSeconds(), custom.region]).toEqual(['Average', 300, 'us-east-1']);
    expect(stack.resolve(custom.dimensions)).toEqual(dims);
  });

  test('usage metrics carry ExecutionRegion, which follows region', () => {
    const { fn } = make({ endpoint: { endpointName: 'live' } });
    const active = fn.endpoint.metricActiveEnvironments();
    expect([active.namespace, active.metricName, active.statistic]).toEqual(['AWS/Lambda/Web/Usage', 'EndpointActiveEnvironments', 'Maximum']);
    expect(active.dimensions).toEqual({ FunctionName: 'orders', EndpointName: 'live', ExecutionRegion: 'ap-south-1' });
    const remote = fn.endpoint.metricRequestThrottles({ region: 'eu-west-1' });
    expect([remote.metricName, remote.statistic, remote.region]).toEqual(['EndpointRequestThrottles', 'Sum', 'eu-west-1']);
    expect(remote.dimensions).toMatchObject({ ExecutionRegion: 'eu-west-1' });
    expect(fn.endpoint.metricEnvironmentThrottles().metricName).toBe('EndpointActiveEnvironmentThrottles');
  });

  test('error rates are math expressions that count missing error data as 0', () => {
    const { fn } = make();
    const rate = fn.endpoint.metricServerErrorRate({ region: 'us-east-1', period: Duration.minutes(5) });
    expect(rate.expression).toBe('100 * FILL(errors, 0) / requests');
    expect(rate.period.toSeconds()).toBe(300);
    expect(rate.label).toBe('Server error rate (%)');
    const used = rate.usingMetrics as Record<string, cloudwatch.Metric>;
    expect([used.requests.metricName, used.errors.metricName, used.errors.region]).toEqual(['ExecutedRequests', 'HTTPResponseStatusClass5XX', 'us-east-1']);
    expect((fn.endpoint.metricClientErrorRate().usingMetrics as Record<string, cloudwatch.Metric>).errors.metricName).toBe('HTTPResponseStatusClass4XX');
  });

  test('a home-region alarm on a metric synthesizes', () => {
    const { fn, stack, template } = make();
    fn.endpoint.metricServerErrorRate().createAlarm(stack, 'Rate', { threshold: 1, evaluationPeriods: 3 });
    template().hasResourceProperties('AWS::CloudWatch::Alarm', {
      Metrics: Match.arrayWith([Match.objectLike({ Id: 'expr_1', Expression: '100 * FILL(errors, 0) / requests' })]),
    });
  });
});

describe('function metrics', () => {
  test('per-function metrics in AWS/Lambda/Web', () => {
    const { fn } = make();
    const expected: [cloudwatch.Metric, string, string][] = [
      [fn.metricActiveTime(), 'EnvironmentActiveTime', 'Sum'],
      [fn.metricCpuTime(), 'EnvironmentCPUTime', 'Sum'],
      [fn.metricConcurrentRequests(), 'EnvironmentConcurrentRequests', 'Maximum'],
      [fn.metricMaxMemoryUsage(), 'EnvironmentMaxMemoryUsage', 'Maximum'],
      [fn.metricResponseBytes(), 'ResponseBytes', 'Sum'],
    ];
    for (const [m, name, statistic] of expected) {
      expect([m.namespace, m.metricName, m.statistic, m.dimensions]).toEqual(['AWS/Lambda/Web', name, statistic, { FunctionName: 'orders' }]);
    }
    expect(fn.metricConcurrentRequests({ statistic: 'p99' }).statistic).toBe('p99');
  });
});

describe('rollbackOn', () => {
  test('a home-region endpoint gets one alarm per threshold, watched by its deployment', () => {
    const { fn, template } = make({ endpoint: { endpointName: 'live', deployment: canary({ serverErrorRate: 2, clientErrorRate: 20 }) } });
    const t = template();

    t.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    t.resourceCountIs(REMOTE_ALARM, 0);
    t.hasResourceProperties('AWS::CloudWatch::Alarm', {
      Threshold: 2,
      EvaluationPeriods: 2,
      ComparisonOperator: 'GreaterThanThreshold',
      TreatMissingData: 'notBreaching',
      AlarmDescription: Match.stringLikeRegexp('endpoint live of orders when more than 2% of its requests in ap-south-1 get a 5XX'),
      Metrics: [
        Match.objectLike({ Id: 'expr_1', Expression: 'IF(requests >= 10, 100 * FILL(errors, 0) / requests, 0)', Label: '5XX rate (%)' }),
        Match.objectLike({ Id: 'requests', ReturnData: false, MetricStat: Match.objectLike({ Metric: Match.objectLike({ MetricName: 'ExecutedRequests' }), Period: 60, Stat: 'Sum' }) }),
        Match.objectLike({ Id: 'errors', ReturnData: false, MetricStat: Match.objectLike({ Metric: Match.objectLike({ MetricName: 'HTTPResponseStatusClass5XX' }) }) }),
      ],
    });
    t.hasResourceProperties('AWS::CloudWatch::Alarm', { Threshold: 20, AlarmDescription: Match.stringLikeRegexp('4XX') });
    t.hasResourceProperties(SHIFT, {
      AlarmArns: [
        { 'Fn::GetAtt': [Match.stringLikeRegexp('^ApiEndpointRollbackServerErrors'), 'Arn'] },
        { 'Fn::GetAtt': [Match.stringLikeRegexp('^ApiEndpointRollbackClientErrors'), 'Arn'] },
      ],
    });
    expect(fn.endpoint.rollbackAlarms).toHaveLength(2);
  });

  test('a multi-region endpoint gets an alarm in every region it serves from', () => {
    const { fn, template } = make({
      endpoint: {
        endpointName: 'live',
        endpointType: WebFunctionEndpointType.MULTI_REGION,
        regions: ['us-east-1', 'eu-west-1'],
        deployment: canary({ serverErrorRate: 1, minimumRequests: 50, period: Duration.minutes(2), evaluationPeriods: 3 }),
      },
    });
    const t = template();

    t.resourceCountIs('AWS::CloudWatch::Alarm', 1);
    t.resourceCountIs(REMOTE_ALARM, 2);
    const remote = Object.values(t.findResources(REMOTE_ALARM)).map((r: any) => r.Properties);
    expect(remote.map((p) => p.Region).sort()).toEqual(['eu-west-1', 'us-east-1']);
    const east = remote.find((p) => p.Region === 'us-east-1');
    expect(east).toMatchObject({
      AlarmName: 'LambdaWeb-orders-live-5xx-rate',
      Threshold: '1',
      EvaluationPeriods: '3',
      ComparisonOperator: 'GreaterThanThreshold',
      TreatMissingData: 'notBreaching',
      AlarmDescription: expect.stringContaining('in us-east-1'),
    });
    expect(JSON.parse(east.Metrics)).toEqual([
      {
        Id: 'requests',
        ReturnData: false,
        MetricStat: { Metric: { Namespace: 'AWS/Lambda/Web', MetricName: 'ExecutedRequests', Dimensions: [{ Name: 'FunctionName', Value: 'orders' }, { Name: 'EndpointName', Value: 'live' }] }, Period: 120, Stat: 'Sum' },
      },
      {
        Id: 'errors',
        ReturnData: false,
        MetricStat: { Metric: { Namespace: 'AWS/Lambda/Web', MetricName: 'HTTPResponseStatusClass5XX', Dimensions: [{ Name: 'FunctionName', Value: 'orders' }, { Name: 'EndpointName', Value: 'live' }] }, Period: 120, Stat: 'Sum' },
      },
      { Id: 'rate', Expression: 'IF(requests >= 50, 100 * FILL(errors, 0) / requests, 0)', Label: 'HTTPResponseStatusClass5XX rate (%)', ReturnData: true },
    ]);

    // The deployment watches all three, and waits for the remote ones to exist.
    const [shiftId, shift] = Object.entries(t.findResources(SHIFT))[0] as [string, any];
    expect(shift.Properties.AlarmArns).toHaveLength(3);
    expect(JSON.stringify(shift.Properties.AlarmArns)).toContain('alarm:LambdaWeb-orders-live-5xx-rate');
    const remoteIds = Object.keys(t.findResources(REMOTE_ALARM));
    expect(shift.DependsOn).toEqual(expect.arrayContaining(remoteIds));
    expect(shiftId).toMatch(/Deployment/);
    expect(fn.endpoint.rollbackAlarms).toHaveLength(3);
  });

  test('the provider may only manage this library\'s alarms, granted even before a stack has any (stable grant)', () => {
    // Without rollbackOn: adding or removing the grant along with the alarms would fail on IAM propagation.
    const t = make().template();
    const roles = t.findResources('AWS::IAM::Role');
    const provider = Object.entries(roles).find(([k]) => k.startsWith('CustomLambdaWebFunctionProvider'))![1] as any;
    expect(provider.Properties.Policies[0].PolicyDocument.Statement).toContainEqual({
      Effect: 'Allow',
      Action: ['cloudwatch:PutMetricAlarm', 'cloudwatch:DeleteAlarms'],
      Resource: { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':cloudwatch:*:111111111111:alarm:LambdaWeb-*']] },
    });
  });

  test('works with linear deployments and with the deployment\'s own alarms', () => {
    const { stack, fn, template } = make();
    const own = new cloudwatch.Alarm(stack, 'Own', { metric: new cloudwatch.Metric({ namespace: 'App', metricName: 'E' }), threshold: 1, evaluationPeriods: 1 });
    fn.addEndpoint('Public', {
      authType: WebFunctionAuthType.NONE,
      deployment: WebFunctionDeployment.linear({ percent: 50, interval: Duration.minutes(5), alarms: [own], rollbackOn: { serverErrorRate: 5 } }),
    });
    const shift = Object.values(template().findResources(SHIFT))[0] as any;
    expect(shift.Properties.AlarmArns).toEqual([
      { 'Fn::GetAtt': [expect.stringMatching(/^Own/), 'Arn'] },
      { 'Fn::GetAtt': [expect.stringMatching(/^ApiPublicRollbackServerErrors/), 'Arn'] },
    ]);
  });

  test('warns when a step is shorter than the alarm needs to fire', () => {
    const { stack } = make({ endpoint: { deployment: canary({ serverErrorRate: 1 }, Duration.minutes(3)) } });
    Annotations.fromStack(stack).hasWarning('/Stack/Api/Endpoint', Match.stringLikeRegexp('rollbackOn needs 2 period\\(s\\) of 1 minute'));
    const ok = make({ endpoint: { deployment: canary({ serverErrorRate: 1 }, Duration.minutes(4)) } });
    Annotations.fromStack(ok.stack).hasNoWarning('/Stack/Api/Endpoint', Match.stringLikeRegexp('rollbackOn'));
  });

  test('validation', () => {
    const bad = (o: object) => () => canary(o);
    expect(bad({})).toThrow(/rollbackOn.serverErrorRate or rollbackOn.clientErrorRate is required/);
    expect(bad({ serverErrorRate: 100 })).toThrow(/serverErrorRate must be a percentage from 0 to below 100/);
    expect(bad({ clientErrorRate: -1 })).toThrow(/clientErrorRate must be a percentage/);
    expect(bad({ serverErrorRate: 1, minimumRequests: 0 })).toThrow(/minimumRequests must be a whole number from 1/);
    expect(bad({ serverErrorRate: 1, period: Duration.seconds(30) })).toThrow(/period must be whole minutes/);
    expect(bad({ serverErrorRate: 1, period: Duration.seconds(90) })).toThrow(/period must be whole minutes/);
    expect(bad({ serverErrorRate: 1, evaluationPeriods: 0 })).toThrow(/evaluationPeriods must be a whole number from 1/);
    expect(bad({ serverErrorRate: 0, minimumRequests: 1 })).not.toThrow();
    // minimumRequests 1 drops the guard.
    const t = make({ endpoint: { deployment: canary({ serverErrorRate: 0, minimumRequests: 1 }) } }).template();
    t.hasResourceProperties('AWS::CloudWatch::Alarm', { Metrics: Match.arrayWith([Match.objectLike({ Expression: '100 * FILL(errors, 0) / requests' })]) });
  });

  test('no alarms without rollbackOn', () => {
    const { fn, template } = make({ endpoint: { deployment: WebFunctionDeployment.canary({ percent: 10, bake: Duration.minutes(5) }) } });
    template().resourceCountIs('AWS::CloudWatch::Alarm', 0);
    expect(fn.endpoint.rollbackAlarms).toEqual([]);
  });
});
