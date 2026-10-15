import * as path from 'node:path';
import { App, Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebFunction, WebFunctionAuthType, WebFunctionEndpointType, WebFunctionRevision, type WebFunctionProps } from '../src';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };

function make(props: Partial<WebFunctionProps> = {}) {
  const stack = new Stack(new App(), 'Stack', { env });
  const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, ...props });
  return { stack, fn, template: () => Template.fromStack(stack) };
}

const endpoints = (t: Template) => Object.values(t.findResources('AWS::Lambda::WebFunctionEndpoint')).map((r: any) => r.Properties);
const endpointNamed = (t: Template, name: string) => endpoints(t).find((p) => p.EndpointName === name);
const currentRevision = { 'Fn::GetAtt': [Match.stringLikeRegexp('^ApiRevision'), 'RevisionId'] };

describe('revisions', () => {
  test('replaced revisions are kept (rollback targets); deleting the function deletes them', () => {
    const { template } = make();
    template().hasResource('AWS::Lambda::WebFunctionRevision', { DeletionPolicy: 'Retain', UpdateReplacePolicy: 'Retain' });
    // The function itself is deleted normally, which deletes every revision.
    template().hasResource('AWS::Lambda::WebFunction', { DeletionPolicy: Match.absent() });
  });

  test('currentRevision is the revision built from the code and configuration', () => {
    const { fn, stack } = make();
    expect(stack.resolve(fn.currentRevision.revisionId)).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^ApiRevision/), 'RevisionId'] });
    expect(stack.resolve(fn.currentRevision.revisionArn)).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^ApiRevision/), 'RevisionArn'] });
    expect(fn.currentRevision.webFunction).toBe(fn);
    expect(fn.revisionId).toBe(fn.currentRevision.revisionId);
  });

  test('cleanup keeps the newest 20 by default, runs after every endpoint, and never deletes the revisions in use', () => {
    const { fn, template } = make();
    const stable = WebFunctionRevision.fromRevisionAttributes(fn, 'Stable', { webFunction: fn, revisionId: 'rev-stabl' });
    const pinned = fn.addEndpoint('Pinned', { authType: WebFunctionAuthType.AWS_IAM, revision: stable });
    const t = template();

    t.hasResourceProperties('Custom::LambdaWebRevisionCleanup', {
      FunctionArn: { 'Fn::GetAtt': [Match.stringLikeRegexp('^Api'), 'FunctionArn'] },
      Keep: '20',
      RevisionIds: [currentRevision, 'rev-stabl'],
    });
    const [cleanup] = Object.values(t.findResources('Custom::LambdaWebRevisionCleanup')) as any[];
    const endpointIds = Object.keys(t.findResources('AWS::Lambda::WebFunctionEndpoint'));
    expect(endpointIds).toHaveLength(2);
    expect(cleanup.DependsOn).toEqual(expect.arrayContaining(endpointIds));
    expect(pinned.node.path).toBe('Stack/Api/Pinned');
  });

  test('revisionRetention sets how many to keep (1-50)', () => {
    make({ revisionRetention: 5 }).template().hasResourceProperties('Custom::LambdaWebRevisionCleanup', { Keep: '5' });
    expect(() => make({ revisionRetention: 1 })).not.toThrow();
    expect(() => make({ revisionRetention: 50 })).not.toThrow();
    for (const n of [0, 51, 2.5]) {
      expect(() => make({ revisionRetention: n })).toThrow(/revisionRetention must be an integer from 1 to 50/);
    }
  });

  test('the cleanup may only list and delete revisions of this function', () => {
    const t = make({ webFunctionName: 'orders' }).template();
    const roles = t.findResources('AWS::IAM::Role');
    const provider = Object.entries(roles).find(([k]) => k.startsWith('CustomLambdaWebFunctionProvider'))![1] as any;
    expect(provider.Properties.Policies[0].PolicyDocument.Statement).toContainEqual({
      Effect: 'Allow',
      Action: ['lambda:ListWebFunctionRevisions', 'lambda:DeleteWebFunctionRevision'],
      Resource: [
        { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':lambda:ap-south-1:111111111111:web-function/orders']] },
        { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':lambda:ap-south-1:111111111111:web-function/orders/revision/*']] },
      ],
    });
  });
});

describe('several endpoints', () => {
  test('addEndpoint adds an endpoint with its own name, auth, description and limits', () => {
    const { fn, template } = make();
    const admin = fn.addEndpoint('Admin', {
      authType: WebFunctionAuthType.NONE,
      description: 'Admin traffic',
      rateLimit: 500,
      maxEnvironments: 20,
    });
    const t = template();

    expect(admin.endpointName).toMatch(/^admin-[0-9a-f]{8}$/);
    expect(admin.authType).toBe(WebFunctionAuthType.NONE);
    expect(endpointNamed(t, admin.endpointName)).toEqual({
      FunctionName: { 'Fn::GetAtt': [expect.stringMatching(/^Api/), 'FunctionArn'] },
      EndpointName: admin.endpointName,
      EndpointType: 'HomeRegion',
      AuthType: 'ApplicationManaged',
      Description: 'Admin traffic',
      RevisionWeights: [{ RevisionId: { 'Fn::GetAtt': [expect.stringMatching(/^ApiRevision/), 'RevisionId'] }, Weight: 100 }],
      ThrottleConfig: { RateLimit: 500 },
      ScalingConfig: { MaxEnvironments: 20 },
    });
    // The default endpoint is unchanged and has no limits.
    const defaults = endpointNamed(t, fn.endpoint.endpointName);
    expect(defaults.AuthType).toBe('IamAuth');
    expect(defaults).not.toHaveProperty('ThrottleConfig');
    expect(defaults).not.toHaveProperty('ScalingConfig');
    Annotations.fromStack(Stack.of(fn)).hasWarning('/Stack/Api/Admin', Match.stringLikeRegexp('authType NONE'));
  });

  test('the default endpoint takes limits and a description too', () => {
    const t = make({ endpoint: { rateLimit: 0, maxEnvironments: 2, description: 'paused' } }).template();
    t.hasResourceProperties('AWS::Lambda::WebFunctionEndpoint', { ThrottleConfig: { RateLimit: 0 }, ScalingConfig: { MaxEnvironments: 2 }, Description: 'paused' });
  });

  test('generated names: <id>-<hash>, a new name when the type or regions change, unique per function', () => {
    const name = (id: string, regions: string[]) => {
      const { fn } = make();
      const endpointType = regions.length ? WebFunctionEndpointType.MULTI_REGION : undefined;
      return fn.addEndpoint(id, { authType: WebFunctionAuthType.AWS_IAM, endpointType, regions }).endpointName;
    };
    expect(name('Global', ['us-east-1'])).toBe(name('Global', ['us-east-1']));
    expect(name('Global', ['us-east-1'])).not.toBe(name('Global', ['us-east-1', 'eu-west-1']));
    expect(name('Global', ['us-east-1'])).not.toBe(name('Other', ['us-east-1']));
    expect(name('My Endpoint_v2!', [])).toMatch(/^my-endpoint-v2-[0-9a-f]{8}$/);
    expect(name('__', [])).toMatch(/^endpoint-[0-9a-f]{8}$/);
    expect(name('x'.repeat(80), []).length).toBeLessThanOrEqual(64);
  });

  test('explicit names must be unique per function', () => {
    const { fn } = make({ endpoint: { endpointName: 'live' } });
    expect(() => fn.addEndpoint('Other', { authType: WebFunctionAuthType.AWS_IAM, endpointName: 'live' })).toThrow(/endpointName 'live' is already used by Stack\/Api\/Endpoint/);
  });

  test('at most 10 endpoints per function', () => {
    const { fn } = make();
    for (let i = 1; i < 10; i++) fn.addEndpoint(`E${i}`, { authType: WebFunctionAuthType.AWS_IAM });
    expect(() => fn.addEndpoint('E10', { authType: WebFunctionAuthType.AWS_IAM })).toThrow(/at most 10 endpoints/);
  });

  test('every region any endpoint serves gets one .local group, created once', () => {
    const { fn, template } = make({ endpoint: { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] } });
    fn.addEndpoint('Global', { authType: WebFunctionAuthType.AWS_IAM, endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1', 'eu-west-1'] });
    fn.addEndpoint('Europe', { authType: WebFunctionAuthType.AWS_IAM, endpointType: WebFunctionEndpointType.PER_REGION, regions: ['eu-west-1'] });
    const t = template();

    const groups = Object.values(t.findResources('Custom::LambdaWebLogGroup')).map((r: any) => `${r.Properties.Region} ${r.Properties.LogGroupName}`).sort();
    const name = `/aws/lambda/web/${fn.webFunctionName}`;
    expect(groups).toEqual([`ap-south-1 ${name}`, `ap-south-1 ${name}.local`, `eu-west-1 ${name}.local`, `us-east-1 ${name}.local`]);
    // Each group outlives the function (deleted after it).
    const [fnResource] = Object.values(t.findResources('AWS::Lambda::WebFunction')) as any[];
    expect(fnResource.DependsOn.filter((d: string) => d.includes('Logs'))).toHaveLength(4);
  });

  test('rateLimit and maxEnvironments are validated', () => {
    const add = (opts: { rateLimit?: number; maxEnvironments?: number }) => make().fn.addEndpoint('E', { authType: WebFunctionAuthType.AWS_IAM, ...opts });
    for (const rateLimit of [0, 100, 700, 1000, 2000, 10000]) expect(() => add({ rateLimit })).not.toThrow();
    for (const rateLimit of [50, 150, 1100, 1500, 2500, 11000, -100]) expect(() => add({ rateLimit })).toThrow(/rateLimit must be 0, 100-1,000 in steps of 100, or 2,000-10,000 in steps of 1,000/);
    for (const maxEnvironments of [2, 10000]) expect(() => add({ maxEnvironments })).not.toThrow();
    for (const maxEnvironments of [0, 1, 10001, 2.5]) expect(() => add({ maxEnvironments })).toThrow(/maxEnvironments must be an integer from 2 to 10,000/);
  });

  test('each endpoint grants invoke on itself only; fn.grants stays on the default endpoint', () => {
    const { fn, stack, template } = make();
    const admin = fn.addEndpoint('Admin', { authType: WebFunctionAuthType.AWS_IAM });
    const a = new iam.Role(stack, 'A', { assumedBy: new iam.AccountRootPrincipal() });
    const b = new iam.Role(stack, 'B', { assumedBy: new iam.AccountRootPrincipal() });
    fn.grantInvoke(a);
    admin.grantInvoke(b);
    const t = template();

    const resourceFor = (role: string) => {
      const policy = Object.values(t.findResources('AWS::IAM::Policy')).find((p: any) => p.Properties.Roles[0].Ref.startsWith(role)) as any;
      return policy.Properties.PolicyDocument.Statement.map((s: any) => s.Resource['Fn::GetAtt'][0]);
    };
    expect(resourceFor('A')).toEqual([expect.stringMatching(/^ApiEndpoint[0-9A-F]{8}$/)]);
    expect(resourceFor('B')).toEqual([expect.stringMatching(/^ApiAdmin[0-9A-F]{8}$/)]);
    expect(admin.grants.invoke(a).success).toBe(true);
  });
});

describe('routing to revisions', () => {
  test('an endpoint can stay on an earlier revision while the default endpoint follows the current one', () => {
    const { fn, template } = make();
    const previous = WebFunctionRevision.fromRevisionAttributes(fn, 'Previous', { webFunction: fn, revisionId: 'rev-a1b2c' });
    const prod = fn.addEndpoint('Prod', { authType: WebFunctionAuthType.AWS_IAM, revision: previous });

    expect(endpointNamed(template(), prod.endpointName).RevisionWeights).toEqual([{ RevisionId: 'rev-a1b2c', Weight: 100 }]);
    expect(Stack.of(fn).resolve(previous.revisionArn)).toEqual({ 'Fn::Join': ['', [{ 'Fn::GetAtt': [expect.stringMatching(/^Api/), 'FunctionArn'] }, '/revision/rev-a1b2c']] });
  });

  test('additionalRevisions splits traffic: the extra revision gets its weight, the endpoint revision the rest', () => {
    const { fn, template } = make();
    const stable = WebFunctionRevision.fromRevisionAttributes(fn, 'Stable', { webFunction: fn, revisionId: 'rev-stabl' });
    const canary = fn.addEndpoint('Canary', { authType: WebFunctionAuthType.AWS_IAM, revision: stable, additionalRevisions: [{ revision: fn.currentRevision, weight: 0.1 }] });

    expect(endpointNamed(template(), canary.endpointName).RevisionWeights).toEqual([
      { RevisionId: 'rev-stabl', Weight: 90 },
      { RevisionId: { 'Fn::GetAtt': [expect.stringMatching(/^ApiRevision/), 'RevisionId'] }, Weight: 10 },
    ]);
  });

  test('routeTraffic: the default endpoint keeps 90% on an earlier revision and sends 10% to the current one', () => {
    const { fn, template } = make();
    const previous = WebFunctionRevision.fromRevisionAttributes(fn, 'Previous', { webFunction: fn, revisionId: 'rev-old11' });
    fn.endpoint.routeTraffic(previous, [{ revision: fn.currentRevision, weight: 0.1 }]);
    const t = template();

    expect(endpointNamed(t, fn.endpoint.endpointName).RevisionWeights).toEqual([
      { RevisionId: 'rev-old11', Weight: 90 },
      { RevisionId: { 'Fn::GetAtt': [expect.stringMatching(/^ApiRevision/), 'RevisionId'] }, Weight: 10 },
    ]);
    // Both are protected from cleanup.
    t.hasResourceProperties('Custom::LambdaWebRevisionCleanup', { RevisionIds: [currentRevision, 'rev-old11'] });
  });

  test('routeTraffic can be called once, and not after revision or additionalRevisions', () => {
    const { fn } = make();
    const rev = (id: string) => WebFunctionRevision.fromRevisionAttributes(fn, id, { webFunction: fn, revisionId: id });
    fn.endpoint.routeTraffic(rev('rev-a'));
    expect(() => fn.endpoint.routeTraffic(rev('rev-b'))).toThrow(/revisions are already set/);
    const pinned = fn.addEndpoint('Pinned', { authType: WebFunctionAuthType.AWS_IAM, revision: rev('rev-c') });
    expect(() => pinned.routeTraffic(rev('rev-d'))).toThrow(/revisions are already set/);
  });

  test('weights must be whole percentages from 1 to 99, with one extra revision of the same function', () => {
    const { fn } = make();
    const rev = (id: string) => WebFunctionRevision.fromRevisionAttributes(fn, id, { webFunction: fn, revisionId: id });
    const add = (opts: any) => fn.addEndpoint(`E${Math.random().toString(36).slice(2)}`, { authType: WebFunctionAuthType.AWS_IAM, ...opts });

    for (const weight of [0.01, 0.5, 0.99, 0.07]) expect(() => add({ additionalRevisions: [{ revision: rev(`rev-${String(weight).slice(2)}`), weight }] })).not.toThrow();
    for (const weight of [0, 1, 0.005, 0.123, -0.1, 1.5]) {
      expect(() => add({ additionalRevisions: [{ revision: rev(`rev-w${String(weight).replace(/\W/g, '')}`), weight }] })).toThrow(/whole percentage from 0.01 to 0.99/);
    }
    expect(() => add({ additionalRevisions: [{ revision: rev('rev-x1'), weight: 0.1 }, { revision: rev('rev-x2'), weight: 0.1 }] })).toThrow(/at most two revisions/);
    expect(() => add({ additionalRevisions: [{ revision: fn.currentRevision, weight: 0.1 }] })).toThrow(/same as the endpoint's revision/);
    expect(() => add({ revision: rev('rev-y1'), additionalRevisions: [{ revision: rev('rev-y1b'), weight: 0.1 }] })).not.toThrow();

    const other = make().fn;
    const foreign = WebFunctionRevision.fromRevisionAttributes(other, 'Foreign', { webFunction: other, revisionId: 'rev-other' });
    expect(() => add({ revision: foreign })).toThrow(/revision rev-other belongs to another function/);
  });
});
