import * as path from 'node:path';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsWebFunction, WebFunction, WebFunctionAuthType, WebFunctionRevision } from '../src';

const env = { account: '111111111111', region: 'ap-south-1' };
const newStack = () => new Stack(new App(), 'Stack', { env });
const ARN = 'arn:aws:lambda:us-east-1:222222222222:web-function/orders';

function policyResources(stack: Stack): unknown[] {
  const [policy] = Object.values(Template.fromStack(stack).findResources('AWS::IAM::Policy')) as any[];
  return policy.Properties.PolicyDocument.Statement.map((s: any) => [s.Action, s.Resource]);
}

describe('imports', () => {
  test('fromWebFunctionArn: name, ARN, account and region come from the ARN', () => {
    const stack = newStack();
    const fn = WebFunction.fromWebFunctionArn(stack, 'Orders', ARN);
    expect(fn.webFunctionArn).toBe(ARN);
    expect(fn.webFunctionName).toBe('orders');
    expect(fn.webFunctionRef).toEqual({ functionArn: ARN });
    expect([fn.env.account, fn.env.region]).toEqual(['222222222222', 'us-east-1']);
  });

  test('fromWebFunctionName: an ARN in this stack\'s account and region', () => {
    const stack = newStack();
    const fn = WebFunction.fromWebFunctionName(stack, 'Orders', 'orders');
    expect(stack.resolve(fn.webFunctionArn)).toEqual({ 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':lambda:ap-south-1:111111111111:web-function/orders']] });
    expect(fn.webFunctionName).toBe('orders');
  });

  test('grantInvoke: every endpoint by default, or the one named', () => {
    const all = newStack();
    WebFunction.fromWebFunctionArn(all, 'Orders', ARN).grantInvoke(new iam.Role(all, 'R', { assumedBy: new iam.AccountRootPrincipal() }));
    expect(policyResources(all)).toEqual([['lambda:InvokeWebFunctionEndpoint', `${ARN}/endpoint/*`]]);

    const one = newStack();
    WebFunction.fromWebFunctionAttributes(one, 'Orders', { webFunctionArn: ARN, endpointName: 'live' })
      .grantInvoke(new iam.Role(one, 'R', { assumedBy: new iam.AccountRootPrincipal() }));
    expect(policyResources(one)).toEqual([['lambda:InvokeWebFunctionEndpoint', `${ARN}/endpoint/live`]]);
  });

  test('metrics: in the function\'s region when it differs from the stack\'s', () => {
    const stack = newStack();
    const remote = WebFunction.fromWebFunctionArn(stack, 'Remote', ARN).metricConcurrentRequests();
    expect([remote.metricName, remote.statistic, remote.region, remote.dimensions]).toEqual(['EnvironmentConcurrentRequests', 'Maximum', 'us-east-1', { FunctionName: 'orders' }]);
    const local = WebFunction.fromWebFunctionName(stack, 'Local', 'orders').metricResponseBytes();
    expect(local.region).toBeUndefined();
    const owned = new WebFunction(stack, 'Owned', {
      runtime: lambda.Runtime.NODEJS_24_X, code: lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello')), authType: WebFunctionAuthType.AWS_IAM,
    });
    expect(owned.metricCpuTime().region).toBeUndefined();
  });

  test('an imported function\'s revisions can be referenced', () => {
    const stack = newStack();
    const fn = WebFunction.fromWebFunctionArn(stack, 'Orders', ARN);
    const rev = WebFunctionRevision.fromRevisionAttributes(stack, 'Rev', { webFunction: fn, revisionId: 'rev-a1b2c' });
    expect(rev.revisionArn).toBe(`${ARN}/revision/rev-a1b2c`);
  });

  test('NodejsWebFunction has the same import methods', () => {
    const fn = NodejsWebFunction.fromWebFunctionName(newStack(), 'Orders', 'orders');
    expect(fn.webFunctionName).toBe('orders');
  });

  test('validation', () => {
    const stack = newStack();
    expect(() => WebFunction.fromWebFunctionAttributes(stack, 'A', {})).toThrow(/give either webFunctionArn or webFunctionName/);
    expect(() => WebFunction.fromWebFunctionAttributes(stack, 'B', { webFunctionArn: ARN, webFunctionName: 'orders' })).toThrow(/give either/);
    expect(() => WebFunction.fromWebFunctionArn(stack, 'C', 'arn:aws:lambda:us-east-1:222222222222:function:orders')).toThrow(/is not a Web Function ARN/);
    expect(() => WebFunction.fromWebFunctionName(stack, 'D', 'bad name')).toThrow(/webFunctionName 'bad name' must be 1-64/);
    expect(() => WebFunction.fromWebFunctionAttributes(stack, 'E', { webFunctionArn: ARN, endpointName: '-x' })).toThrow(/endpointName '-x'/);
  });
});
