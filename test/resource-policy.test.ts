import * as path from 'node:path';
import { App, Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebFunction, WebFunctionAuthType, type WebFunctionProps } from '../src';
import { inspectResourcePolicy } from '../src/private/resource-policy';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };
const INVOKE = 'lambda:InvokeWebFunctionEndpoint';
const fnArn = { 'Fn::GetAtt': [Match.stringLikeRegexp('^ApiF70053CD'), 'FunctionArn'] };
const allEndpoints = { 'Fn::Join': ['', [fnArn, '/endpoint/*']] };
const defaultEndpoint = { 'Fn::GetAtt': [Match.stringLikeRegexp('^ApiEndpoint'), 'EndpointArn'] };

function make(props: Partial<WebFunctionProps> = {}) {
  const stack = new Stack(new App(), 'Stack', { env });
  const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, ...props });
  return { stack, fn, template: () => Template.fromStack(stack) };
}

const policies = (t: Template) => Object.values(t.findResources('AWS::Lambda::ResourcePolicy')) as any[];
const statements = (t: Template) => policies(t)[0].Properties.PolicyDocument.Statement;
const identityStatements = (t: Template) => Object.values(t.findResources('AWS::IAM::Policy'))
  .flatMap((p: any) => p.Properties.PolicyDocument.Statement).filter((s: any) => s.Action === INVOKE);

describe('resource policy', () => {
  test('none by default', () => {
    const { template } = make();
    template().resourceCountIs('AWS::Lambda::ResourcePolicy', 0);
  });

  test('addPermission: one policy on the function, a statement per permission', () => {
    const { fn, template } = make();
    fn.addPermission('Partner', { principal: new iam.AccountPrincipal('222222222222') });
    fn.addPermission('Cdn', {
      principal: new iam.ServicePrincipal('cloudfront.amazonaws.com'),
      endpoint: fn.endpoint,
      sourceArn: 'arn:aws:cloudfront::111111111111:distribution/E123',
      sourceAccount: '111111111111',
    });
    const t = template();
    t.resourceCountIs('AWS::Lambda::ResourcePolicy', 1);
    expect(policies(t)[0].Properties.ResourceArn).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^ApiF70053CD/), 'FunctionArn'] });
    // Fixed logical ID: CloudFormation can't create a second policy for the function, even to replace the first.
    expect(Object.keys(t.findResources('AWS::Lambda::ResourcePolicy'))[0]).toMatch(/^ApiResourcePolicy[0-9A-F]{8}$/);
    t.hasResourceProperties('AWS::Lambda::ResourcePolicy', {
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          Match.objectEquals({
            Sid: 'Partner',
            Effect: 'Allow',
            Action: INVOKE,
            Resource: allEndpoints,
            Principal: { AWS: { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::222222222222:root']] } },
          }),
          Match.objectEquals({
            Sid: 'Cdn',
            Effect: 'Allow',
            Action: INVOKE,
            Resource: defaultEndpoint,
            Principal: { Service: 'cloudfront.amazonaws.com' },
            Condition: {
              ArnLike: { 'aws:SourceArn': 'arn:aws:cloudfront::111111111111:distribution/E123' },
              StringEquals: { 'aws:SourceAccount': '111111111111' },
            },
          }),
        ],
      },
    });
  });

  test('addPermission: id is the Sid, so letters and digits, unique', () => {
    const { fn } = make();
    const principal = new iam.AccountPrincipal('222222222222');
    expect(() => fn.addPermission('partner-1', { principal })).toThrow(/permission id 'partner-1' must be letters and digits only/);
    fn.addPermission('Partner', { principal });
    expect(() => fn.addPermission('Partner', { principal })).toThrow(/already a permission with id 'Partner'/);
  });

  test('addPermission: the endpoint must be this function\'s', () => {
    const { fn, stack } = make();
    const other = new WebFunction(stack, 'Other', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM });
    expect(() => fn.addPermission('Partner', { principal: new iam.AccountPrincipal('222222222222'), endpoint: other.endpoint }))
      .toThrow(/endpoint Stack\/Other\/Endpoint belongs to another function/);
  });

  test('addToResourcePolicy: any action, and the policy is the dependable', () => {
    const { fn, stack, template } = make();
    const result = fn.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.AccountPrincipal('222222222222')],
      actions: ['lambda:GetWebFunction'],
      resources: [fn.webFunctionArn],
    }));
    expect(result.statementAdded).toBe(true);
    expect(stack.resolve((result.policyDependable as any).logicalId)).toMatch(/^ApiResourcePolicy/);
    expect(statements(template())).toEqual([expect.objectContaining({ Action: 'lambda:GetWebFunction', Resource: { 'Fn::GetAtt': [expect.stringMatching(/^ApiF70053CD/), 'FunctionArn'] } })]);
  });

  test('grantInvoke: a role in this account stays identity-only', () => {
    const { fn, stack, template } = make();
    fn.grantInvoke(new iam.Role(stack, 'Caller', { assumedBy: new iam.AccountRootPrincipal() }));
    const t = template();
    t.resourceCountIs('AWS::Lambda::ResourcePolicy', 0);
    expect(identityStatements(t)).toHaveLength(1);
  });

  test('grantInvoke: another account also gets a resource-policy statement on the endpoint', () => {
    const { fn, stack, template } = make();
    const partner = iam.Role.fromRoleArn(stack, 'Partner', 'arn:aws:iam::222222222222:role/caller');
    fn.grantInvoke(partner);
    fn.grantInvoke(new iam.AccountPrincipal('333333333333'));
    const t = template();
    expect(statements(t)).toEqual([
      expect.objectContaining({ Action: INVOKE, Resource: expect.anything(), Principal: { AWS: 'arn:aws:iam::222222222222:role/caller' } }),
      expect.objectContaining({ Action: INVOKE, Principal: { AWS: { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::333333333333:root']] } } }),
    ]);
    expect(stack.resolve(statements(t)[0].Resource)).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^ApiEndpoint/), 'EndpointArn'] });
  });

  test('grantInvoke on another endpoint: the statement names that endpoint', () => {
    const { fn, template } = make();
    const admin = fn.addEndpoint('Admin', { authType: WebFunctionAuthType.AWS_IAM });
    admin.grantInvoke(new iam.AccountPrincipal('222222222222'));
    expect(statements(template())[0].Resource).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^ApiAdmin/), 'EndpointArn'] });
  });

  test('grantInvoke: a service principal gets a resource-policy statement (no IAM policy to add to)', () => {
    const { fn, template } = make();
    fn.grantInvoke(new iam.ServicePrincipal('cloudfront.amazonaws.com').withConditions({ StringEquals: { 'aws:SourceAccount': '111111111111' } }));
    const t = template();
    expect(statements(t)).toEqual([expect.objectContaining({
      Principal: { Service: 'cloudfront.amazonaws.com' }, Condition: { StringEquals: { 'aws:SourceAccount': '111111111111' } },
    })]);
    Annotations.fromStack(Stack.of(fn)).hasNoWarning('/Stack/Api', Match.stringLikeRegexp('from any account'));
  });

  test('warns when a service principal has no source condition', () => {
    const { fn } = make();
    fn.addPermission('Cdn', { principal: new iam.ServicePrincipal('cloudfront.amazonaws.com') });
    Annotations.fromStack(Stack.of(fn)).hasWarning('/Stack/Api',
      Match.stringLikeRegexp('lets cloudfront.amazonaws.com call the function from any account.*\\[ack: @cdk-lambda-web:servicePrincipalWithoutSource\\]'));
  });

  test('a public statement fails synthesis; an organization principal is not public', () => {
    const pub = make();
    pub.fn.addToResourcePolicy(new iam.PolicyStatement({ principals: [new iam.AnyPrincipal()], actions: [INVOKE], resources: ['*'] }));
    expect(() => pub.template()).toThrow(/resource policy: statement 1 allows principal '\*': Lambda rejects public resource policies/);

    const org = make();
    org.fn.addPermission('Org', { principal: new iam.OrganizationPrincipal('o-a1b2c3d4e5') });
    expect(statements(org.template())).toEqual([expect.objectContaining({
      Principal: { AWS: '*' }, Condition: { StringEquals: { 'aws:PrincipalOrgID': 'o-a1b2c3d4e5' } },
    })]);
  });

  test('a statement without a principal fails synthesis', () => {
    const { fn, template } = make();
    fn.addToResourcePolicy(new iam.PolicyStatement({ actions: [INVOKE], resources: ['*'] }));
    expect(() => template()).toThrow(/A PolicyStatement used in a resource-based policy must specify at least one IAM principal/);
  });

  test('imported functions: nothing is added, with a warning; grants stay identity-only', () => {
    const stack = new Stack(new App(), 'Stack', { env });
    const fn = WebFunction.fromWebFunctionArn(stack, 'Orders', 'arn:aws:lambda:ap-south-1:111111111111:web-function/orders');
    const result = fn.addToResourcePolicy(new iam.PolicyStatement({ principals: [new iam.AccountPrincipal('222222222222')], actions: [INVOKE], resources: ['*'] }));
    expect(result.statementAdded).toBe(false);
    fn.grantInvoke(new iam.Role(stack, 'Caller', { assumedBy: new iam.AccountRootPrincipal() }));
    const t = Template.fromStack(stack);
    t.resourceCountIs('AWS::Lambda::ResourcePolicy', 0);
    expect(identityStatements(t)).toHaveLength(1);
    Annotations.fromStack(stack).hasWarning('/Stack/Orders', Match.stringLikeRegexp('not added to an imported function\'s resource policy'));
  });
});

describe('inspectResourcePolicy', () => {
  const allow = (extra: object) => ({ Statement: [{ Effect: 'Allow', Action: INVOKE, Resource: '*', ...extra }] });

  test.each([
    ['Principal "*"', { Principal: '*' }],
    ['AWS "*"', { Principal: { AWS: '*' } }],
    ['AWS ["*", account]', { Principal: { AWS: ['*', '222222222222'] } }],
    ['an IP condition only', { Principal: '*', Condition: { IpAddress: { 'aws:SourceIp': '10.0.0.0/8' } } }],
    ['a resource condition only', { Principal: '*', Condition: { StringEquals: { 'lambda:Resource/WebFunctionAuthType': 'IamAuth' } } }],
  ])('public: %s', (_, statement) => {
    expect(inspectResourcePolicy(allow(statement)).errors).toHaveLength(1);
  });

  test.each([
    ['an account', { Principal: { AWS: '222222222222' } }],
    ['* with aws:PrincipalOrgID', { Principal: '*', Condition: { StringEquals: { 'aws:PrincipalOrgID': 'o-1' } } }],
    ['* with a trusted key in another case', { Principal: { AWS: '*' }, Condition: { StringEquals: { 'AWS:SourceAccount': '222222222222' } } }],
    ['a deny', { Effect: 'Deny', Principal: '*' }],
  ])('not public: %s', (_, statement) => {
    expect(inspectResourcePolicy(allow(statement)).errors).toEqual([]);
  });

  test('service principals: unscoped unless a source key is present', () => {
    expect(inspectResourcePolicy(allow({ Principal: { Service: ['a.amazonaws.com', 'b.amazonaws.com'] } })).unscopedServices)
      .toEqual(['a.amazonaws.com', 'b.amazonaws.com']);
    expect(inspectResourcePolicy(allow({ Principal: { Service: 'a.amazonaws.com' }, Condition: { ArnLike: { 'aws:SourceArn': 'arn:x' } } })).unscopedServices)
      .toEqual([]);
  });
});
