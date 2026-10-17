import * as path from 'node:path';
import { App, CfnResource, Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebFunction, WebFunctionAuthType, type WebFunctionProps } from '../src';
import { inspectResourcePolicy } from '../src/private/resource-policy';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };
const WRITER = 'Custom::LambdaWebResourcePolicyStatements';
const INVOKE = 'lambda:InvokeWebFunctionEndpoint';
const fnArn = { 'Fn::GetAtt': [Match.stringLikeRegexp('^ApiF70053CD'), 'FunctionArn'] };
const allEndpoints = { 'Fn::Join': ['', [fnArn, '/endpoint/*']] };
const defaultEndpoint = { 'Fn::GetAtt': [Match.stringLikeRegexp('^ApiEndpoint'), 'EndpointArn'] };

function make(props: Partial<WebFunctionProps> = {}) {
  const stack = new Stack(new App(), 'Stack', { env });
  const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, ...props });
  return { stack, fn, template: () => Template.fromStack(stack) };
}

const policies = (t: Template) => Object.values(t.findResources(WRITER)) as any[];
const statements = (t: Template) => policies(t)[0].Properties.Policy.Statement;
const identityStatements = (t: Template) => Object.values(t.findResources('AWS::IAM::Policy'))
  .flatMap((p: any) => p.Properties.PolicyDocument.Statement).filter((s: any) => s.Action === INVOKE);

describe('resource policy', () => {
  test('none by default', () => {
    const { template } = make();
    template().resourceCountIs(WRITER, 0);
  });

  test('addPermission: one writer per stack and function, a statement per permission', () => {
    const { fn, template } = make();
    fn.addPermission('Partner', { principal: new iam.AccountPrincipal('222222222222') });
    fn.addPermission('Cdn', {
      principal: new iam.ServicePrincipal('cloudfront.amazonaws.com'),
      endpoint: fn.endpoint,
      sourceArn: 'arn:aws:cloudfront::111111111111:distribution/E123',
      sourceAccount: '111111111111',
    });
    const t = template();
    t.resourceCountIs(WRITER, 1);
    expect(policies(t)[0].Properties.FunctionArn).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^ApiF70053CD/), 'FunctionArn'] });
    // Not the AWS::Lambda::ResourcePolicy of 0.1.5-0.1.6, which owned the whole document.
    expect(Object.keys(t.findResources(WRITER))[0]).toMatch(/^ApiResourcePolicyStatements[0-9A-F]{8}$/);
    t.resourceCountIs('AWS::Lambda::ResourcePolicy', 0);
    t.hasResourceProperties(WRITER, {
      Policy: {
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
    const { fn, template } = make();
    const result = fn.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.AccountPrincipal('222222222222')],
      actions: ['lambda:GetWebFunction'],
      resources: [fn.webFunctionArn],
    }));
    expect(result.statementAdded).toBe(true);
    expect((result.policyDependable as any).node.path).toBe('Stack/Api/ResourcePolicyStatements/Resource');
    expect(statements(template())).toEqual([expect.objectContaining({ Action: 'lambda:GetWebFunction', Resource: { 'Fn::GetAtt': [expect.stringMatching(/^ApiF70053CD/), 'FunctionArn'] } })]);
  });

  test('grantInvoke: a role in this account stays identity-only', () => {
    const { fn, stack, template } = make();
    fn.grantInvoke(new iam.Role(stack, 'Caller', { assumedBy: new iam.AccountRootPrincipal() }));
    const t = template();
    t.resourceCountIs(WRITER, 0);
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

  // The principal kinds CDK's lambda.Function grantInvoke tests cover.
  test('grantInvoke: an ARN principal in another account', () => {
    const { fn, template } = make();
    fn.grantInvoke(new iam.ArnPrincipal('arn:aws:iam::222222222222:role/caller'));
    expect(statements(template())).toEqual([expect.objectContaining({ Principal: { AWS: 'arn:aws:iam::222222222222:role/caller' }, Action: INVOKE })]);
  });

  test('grantInvoke: an organization (a * principal pinned by aws:PrincipalOrgID)', () => {
    const { fn, template } = make();
    fn.grantInvoke(new iam.OrganizationPrincipal('o-12345abcde'));
    expect(statements(template())).toEqual([expect.objectContaining({
      Principal: { AWS: '*' }, Condition: { StringEquals: { 'aws:PrincipalOrgID': 'o-12345abcde' } },
    })]);
  });

  test('grantInvoke: a composite principal of two accounts', () => {
    const { fn, template } = make();
    fn.grantInvoke(new iam.CompositePrincipal(new iam.AccountPrincipal('222222222222'), new iam.AccountPrincipal('333333333333')));
    const principals = statements(template()).flatMap((st: any) => [st.Principal.AWS].flat());
    expect(principals).toEqual([
      { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::222222222222:root']] },
      { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::333333333333:root']] },
    ]);
  });

  test('grantInvoke: an imported role in this account stays identity-only', () => {
    const { fn, stack, template } = make();
    fn.grantInvoke(iam.Role.fromRoleArn(stack, 'Local', 'arn:aws:iam::111111111111:role/caller'));
    const t = template();
    t.resourceCountIs(WRITER, 0);
    t.hasResourceProperties('AWS::IAM::Policy', { Roles: ['caller'], PolicyDocument: { Statement: [Match.objectLike({ Action: INVOKE })] } });
  });

  test('grantInvoke twice for the same service principal: one statement', () => {
    const { fn, template } = make();
    const cdn = new iam.ServicePrincipal('cloudfront.amazonaws.com').withConditions({ StringEquals: { 'aws:SourceAccount': '111111111111' } });
    fn.grantInvoke(cdn);
    fn.grantInvoke(cdn);
    expect(statements(template())).toHaveLength(1);
  });

  test('grantInvoke for the same service principal with different conditions: one statement each', () => {
    const { fn, template } = make();
    const from = (id: string) => new iam.ServicePrincipal('cloudfront.amazonaws.com')
      .withConditions({ StringEquals: { 'aws:SourceArn': `arn:aws:cloudfront::111111111111:distribution/${id}` } });
    fn.grantInvoke(from('A'));
    fn.grantInvoke(from('B'));
    expect(statements(template()).map((st: any) => st.Condition.StringEquals['aws:SourceArn'])).toEqual([
      'arn:aws:cloudfront::111111111111:distribution/A', 'arn:aws:cloudfront::111111111111:distribution/B',
    ]);
  });

  test('in an environment-agnostic stack, a role of the stack stays identity-only', () => {
    const stack = new Stack(new App(), 'Stack');
    const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM });
    fn.grantInvoke(new iam.Role(stack, 'Caller', { assumedBy: new iam.AccountRootPrincipal() }));
    Template.fromStack(stack).resourceCountIs(WRITER, 0);
  });

  test('a grant on the resource policy can be depended on', () => {
    const { fn, stack, template } = make();
    const consumer = new CfnResource(stack, 'Consumer', { type: 'Test::Consumer' });
    fn.grantInvoke(new iam.AccountPrincipal('222222222222')).applyBefore(consumer);
    expect(template().toJSON().Resources.Consumer.DependsOn).toEqual([expect.stringMatching(/^ApiResourcePolicy/)]);
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
    expect(() => pub.template()).toThrow(/resource policy: statement 'Cdk\w+' allows principal '\*': Lambda rejects public resource policies/);

    const org = make();
    org.fn.addPermission('Org', { principal: new iam.OrganizationPrincipal('o-a1b2c3d4e5') });
    expect(statements(org.template())).toEqual([expect.objectContaining({
      Principal: { AWS: '*' }, Condition: { StringEquals: { 'aws:PrincipalOrgID': 'o-a1b2c3d4e5' } },
    })]);
  });

  test.each([
    ['no principal', { actions: [INVOKE], resources: ['*'] }, /must specify at least one IAM principal/],
    ['no action', { principals: [new iam.AccountPrincipal('222222222222')], resources: ['*'] }, /must specify at least one 'action' or 'notAction'/],
    ['no resource', { principals: [new iam.AccountPrincipal('222222222222')], actions: [INVOKE] }, /must specify at least one resource/],
  ])('a statement with %s fails synthesis', (_, props, error) => {
    const { fn, template } = make();
    fn.addToResourcePolicy(new iam.PolicyStatement(props));
    expect(() => template()).toThrow(error);
  });

  test('an imported function in this account: the importing stack writes its own statements, in the function\'s region', () => {
    const stack = new Stack(new App(), 'Stack', { env });
    const arn = 'arn:aws:lambda:us-east-1:111111111111:web-function/orders';
    const fn = WebFunction.fromWebFunctionArn(stack, 'Orders', arn);
    fn.grantInvoke(new iam.Role(stack, 'Caller', { assumedBy: new iam.AccountRootPrincipal() })); // identity-only
    fn.grantInvoke(new iam.AccountPrincipal('222222222222'));
    fn.addToResourcePolicy(new iam.PolicyStatement({ sid: 'Manage', principals: [new iam.AccountPrincipal('222222222222')], actions: ['lambda:GetWebFunction'], resources: [arn] }));
    const t = Template.fromStack(stack);
    expect(identityStatements(t)).toHaveLength(1);
    expect(Object.keys(t.findResources(WRITER))).toEqual([expect.stringMatching(/^OrdersResourcePolicyStatements/)]);
    expect(policies(t)[0].Properties.FunctionArn).toBe(arn);
    expect(statements(t).map((st: any) => [st.Sid, st.Action, st.Resource])).toEqual([
      [expect.stringMatching(/^Cdk[0-9A-F]{8}0$/), INVOKE, `${arn}/endpoint/*`],
      ['Manage', 'lambda:GetWebFunction', arn],
    ]);
  });

  test('an imported function by token ARN is taken to be in this account: a role of the account stays identity-only', () => {
    const { fn, stack, template } = make();
    const imported = WebFunction.fromWebFunctionArn(stack, 'Imported', fn.webFunctionArn);
    expect([imported.env.account, imported.env.region]).toEqual([stack.account, stack.region]);
    imported.grantInvoke(new iam.Role(stack, 'Caller', { assumedBy: new iam.AccountRootPrincipal() }));
    const t = template();
    t.resourceCountIs(WRITER, 0);
    expect(identityStatements(t)).toHaveLength(1);
  });

  test('an imported function in another account: nothing is added, with a warning', () => {
    const stack = new Stack(new App(), 'Stack', { env });
    const fn = WebFunction.fromWebFunctionArn(stack, 'Orders', 'arn:aws:lambda:ap-south-1:999999999999:web-function/orders');
    const result = fn.addToResourcePolicy(new iam.PolicyStatement({ principals: [new iam.AccountPrincipal('222222222222')], actions: [INVOKE], resources: ['*'] }));
    expect(result.statementAdded).toBe(false);
    fn.grantInvoke(new iam.Role(stack, 'Caller', { assumedBy: new iam.AccountRootPrincipal() }));
    const t = Template.fromStack(stack);
    t.resourceCountIs(WRITER, 0);
    expect(identityStatements(t)).toHaveLength(1);
    Annotations.fromStack(stack).hasWarning('/Stack/Orders', Match.stringLikeRegexp('function in account 999999999999 was not added: stack Stack is in account 111111111111'));
  });

  test('every statement gets a Sid unique to its writer; two writers never share one', () => {
    const app = new App();
    const a = new Stack(app, 'A', { env });
    const fn = new WebFunction(a, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM });
    fn.grantInvoke(new iam.AccountPrincipal('222222222222'));
    const b = new Stack(app, 'B', { env });
    WebFunction.fromWebFunctionArn(b, 'Api', 'arn:aws:lambda:ap-south-1:111111111111:web-function/api').grantInvoke(new iam.AccountPrincipal('222222222222'));
    const sidA = statements(Template.fromStack(a))[0].Sid;
    const sidB = statements(Template.fromStack(b))[0].Sid;
    expect([sidA, sidB]).toEqual([expect.stringMatching(/^Cdk[0-9A-F]{8}0$/), expect.stringMatching(/^Cdk[0-9A-F]{8}0$/)]);
    expect(sidA).not.toBe(sidB);
  });

  test('two statements with the same Sid fail synthesis', () => {
    const { fn, template } = make();
    fn.addPermission('Partner', { principal: new iam.AccountPrincipal('222222222222') });
    fn.addToResourcePolicy(new iam.PolicyStatement({ sid: 'Partner', principals: [new iam.AccountPrincipal('333333333333')], actions: [INVOKE], resources: ['*'] }));
    expect(() => template()).toThrow(/more than one statement has Sid 'Partner'/);
  });

  test('the provider may read and write the resource policy of any Web Function in the account', () => {
    const { fn, template } = make();
    fn.grantInvoke(new iam.AccountPrincipal('222222222222'));
    template().hasResourceProperties('AWS::IAM::Role', {
      Policies: Match.arrayWith([Match.objectLike({
        PolicyDocument: {
          Statement: Match.arrayWith([{
            Effect: 'Allow',
            Action: ['lambda:GetResourcePolicy', 'lambda:PutResourcePolicy', 'lambda:DeleteResourcePolicy'],
            Resource: { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':lambda:*:111111111111:web-function/*']] },
          }]),
        },
      })]),
    });
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
