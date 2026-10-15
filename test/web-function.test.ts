import * as path from 'node:path';
import { App, Duration, RemovalPolicy, Stack, Tags } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { WebFunction, WebFunctionAuthType, WebFunctionEndpointType, type WebFunctionProps } from '../src';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };

function make(props: Partial<WebFunctionProps> = {}, stackProps: { env?: typeof env; context?: Record<string, unknown> } = { env }) {
  const app = new App({ context: stackProps.context });
  const stack = new Stack(app, 'Stack', { env: stackProps.env });
  const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, ...props });
  return { app, stack, fn, template: () => Template.fromStack(stack) };
}

describe('home region (default)', () => {
  test('creates the function, its revision and a home-region endpoint', () => {
    const { fn, stack, template } = make();
    const t = template();

    t.hasResourceProperties('AWS::Lambda::WebFunction', { FunctionName: fn.webFunctionName });
    expect(fn.webFunctionName).toMatch(/^[A-Za-z0-9][A-Za-z0-9_-]{0,62}[A-Za-z0-9]$/);
    t.hasResourceProperties('AWS::Lambda::WebFunctionRevision', {
      FunctionName: { 'Fn::GetAtt': [Match.stringLikeRegexp('^Api'), 'FunctionArn'] },
      BuildConfig: {
        CodeConfig: { S3Object: { Bucket: { Ref: Match.stringLikeRegexp('LambdaWebFunctionCodeBucket') }, Key: Match.stringLikeRegexp('^web-functions/'), VersionId: { 'Fn::GetAtt': [Match.stringLikeRegexp('CodeCopy'), 'VersionId'] } } },
        RuntimeConfig: { Runtime: 'nodejs24.x' },
      },
      ServiceConfig: {
        ExecutionRoleArn: { 'Fn::GetAtt': [Match.stringLikeRegexp('ServiceRole'), 'Arn'] },
        TimeoutSeconds: 30,
        TelemetryConfig: { LoggingConfig: { LogGroup: `/aws/lambda/web/${fn.webFunctionName}` } },
      },
    });
    t.hasResourceProperties('AWS::Lambda::WebFunctionEndpoint', {
      FunctionName: { 'Fn::GetAtt': [Match.stringLikeRegexp('^Api'), 'FunctionArn'] },
      EndpointName: Match.stringLikeRegexp('^default-[0-9a-f]{8}$'),
      EndpointType: 'HomeRegion',
      AuthType: 'IamAuth',
      Regions: Match.absent(),
      RevisionWeights: [{ RevisionId: { 'Fn::GetAtt': [Match.stringLikeRegexp('Revision'), 'RevisionId'] }, Weight: 100 }],
    });
    expect(fn.endpoint.regions).toEqual(['ap-south-1']);
    expect(stack.resolve(fn.endpoint.url)).toEqual({ 'Fn::Join': ['', ['https://', { 'Fn::GetAtt': [expect.stringMatching(/^ApiEndpoint[0-9A-F]{8}$/), 'DomainName'] }]] });
  });

  test('owns both home-region log groups, with retention, deleted after the function', () => {
    const { fn, template } = make();
    const t = template();

    t.resourceCountIs('Custom::LambdaWebLogGroup', 2);
    for (const name of [`/aws/lambda/web/${fn.webFunctionName}`, `/aws/lambda/web/${fn.webFunctionName}.local`]) {
      t.hasResourceProperties('Custom::LambdaWebLogGroup', { Region: 'ap-south-1', LogGroupName: name, RetentionInDays: '30', RemovalPolicy: 'retain' });
    }
    const [fnId] = Object.keys(t.findResources('AWS::Lambda::WebFunction'));
    const logIds = Object.keys(t.findResources('Custom::LambdaWebLogGroup'));
    expect(t.findResources('AWS::Lambda::WebFunction')[fnId].DependsOn).toEqual(expect.arrayContaining(logIds));
  });

  test('the revision waits for the execution role and its policies', () => {
    const { fn, template } = make();
    fn.addToRolePolicy(new iam.PolicyStatement({ actions: ['s3:GetObject'], resources: ['*'] }));
    const t = template();
    const [revision] = Object.values(t.findResources('AWS::Lambda::WebFunctionRevision'));
    const roleIds = [...Object.keys(t.findResources('AWS::IAM::Role')), ...Object.keys(t.findResources('AWS::IAM::Policy'))].filter((k) => k.startsWith('ApiServiceRole'));
    expect(roleIds.length).toBe(2);
    expect(revision.DependsOn).toEqual(expect.arrayContaining(roleIds));
  });

  test('logGroup is the home-region aggregate', () => {
    const { fn, stack } = make();
    expect(stack.resolve(fn.logGroup.logGroupName)).toBe(`/aws/lambda/web/${fn.webFunctionName}`);
  });
});

describe('multi-region', () => {
  test('MULTI_REGION: regions are deduplicated and sorted, home is implied, and every region gets a .local group', () => {
    const { fn, stack, template } = make({ endpoint: { endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1', 'eu-west-1', 'us-east-1', 'ap-south-1'] } });
    const t = template();

    t.hasResourceProperties('AWS::Lambda::WebFunctionEndpoint', { EndpointType: 'MultiRegion', Regions: ['eu-west-1', 'us-east-1'] });
    expect(fn.endpoint.regions).toEqual(['ap-south-1', 'eu-west-1', 'us-east-1']);
    t.resourceCountIs('Custom::LambdaWebLogGroup', 4);
    for (const region of ['eu-west-1', 'us-east-1']) {
      t.hasResourceProperties('Custom::LambdaWebLogGroup', { Region: region, LogGroupName: `/aws/lambda/web/${fn.webFunctionName}.local` });
    }
    const [fnRes] = Object.values(t.findResources('AWS::Lambda::WebFunction'));
    expect(fnRes.DependsOn).toHaveLength(4);
    expect(stack.resolve(fn.endpoint.url)).toEqual({ 'Fn::Join': ['', ['https://', { 'Fn::GetAtt': [expect.any(String), 'DomainName'] }]] });
  });

  test('the default endpoint name changes when the type or regions change, and is otherwise stable', () => {
    const name = (endpoint: WebFunctionProps['endpoint']) => make({ endpoint }).fn.endpoint.endpointName;
    const multi = name({ endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1', 'eu-west-1'] });

    expect(name({ endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['eu-west-1', 'us-east-1'] })).toBe(multi);
    expect(name({ endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1'] })).not.toBe(multi);
    expect(name({ endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1', 'eu-west-1'] })).not.toBe(multi);
    expect(name(undefined)).not.toBe(multi);
  });

  test('PER_REGION: regionalUrl reads remote domains through the lookup and uses the endpoint URL at home', () => {
    const { fn, stack, template } = make({ endpoint: { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] } });

    expect(fn.endpoint.regionalUrl('ap-south-1')).toBe(fn.endpoint.url);
    expect(stack.resolve(fn.endpoint.regionalUrl('us-east-1'))).toEqual({ 'Fn::Join': ['', ['https://', { 'Fn::GetAtt': [expect.stringMatching(/EndpointLookup/), 'Domain.us-east-1'] }]] });
    fn.endpoint.regionalUrl('us-east-1');
    template().resourceCountIs('Custom::LambdaWebEndpointLookup', 1);
    expect(() => fn.endpoint.regionalUrl('eu-west-1')).toThrow(/not one of the endpoint's regions/);
  });

  test('regionalUrl is only for PER_REGION endpoints', () => {
    const { fn } = make({ endpoint: { endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1'] } });
    expect(() => fn.endpoint.regionalUrl('us-east-1')).toThrow(/only available for PER_REGION/);
  });

  test.each([
    [{ endpointType: WebFunctionEndpointType.HOME_REGION, regions: ['us-east-1'] }, /HOME_REGION endpoint serves only the home region/],
    [{ endpointType: WebFunctionEndpointType.MULTI_REGION }, /needs at least one region besides the home region/],
    [{ endpointType: WebFunctionEndpointType.PER_REGION, regions: ['ap-south-1'] }, /needs at least one region besides the home region/],
    [{ endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['US-EAST-1'] }, /not a valid region name/],
  ])('rejects invalid endpoint regions %#', (endpoint, error) => {
    expect(() => make({ endpoint })).toThrow(error);
  });

  test('multi-region endpoints need a stack with an explicit region', () => {
    expect(() => make({ endpoint: { endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1'] } }, { env: undefined }))
      .toThrow(/need a stack with an explicit region/);
  });
});

describe('configuration', () => {
  test('environment, entrypoint, timeout, concurrency and log levels reach the revision', () => {
    const { fn, template } = make({
      environment: { TABLE: 'orders' },
      entrypoint: 'server.js',
      timeout: Duration.minutes(2),
      maxConcurrencyPerEnvironment: 16,
      description: 'Orders API',
      applicationLogLevelV2: lambda.ApplicationLogLevel.WARN,
      systemLogLevelV2: lambda.SystemLogLevel.DEBUG,
    });
    fn.addEnvironment('LATE', 'added-after-construction');

    template().hasResourceProperties('AWS::Lambda::WebFunctionRevision', {
      Description: 'Orders API',
      ServiceConfig: {
        EnvironmentVariables: { TABLE: 'orders', AWS_LAMBDA_NODEJS_ENTRYPOINT: 'server.js', LATE: 'added-after-construction' },
        TimeoutSeconds: 120,
        MaxConcurrencyPerEnvironment: 16,
        TelemetryConfig: { LoggingConfig: { ApplicationLogLevel: 'WARN', SystemLogLevel: 'DEBUG' } },
      },
    });
  });

  test('log retention and removal apply to every group', () => {
    const { template } = make({ logRetention: logs.RetentionDays.ONE_WEEK, logRemovalPolicy: RemovalPolicy.DESTROY, endpoint: { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['eu-west-1'] } });
    const groups = Object.values(template().findResources('Custom::LambdaWebLogGroup'));
    expect(groups).toHaveLength(3);
    for (const g of groups) expect(g.Properties).toMatchObject({ RetentionInDays: '7', RemovalPolicy: 'destroy' });
  });

  test('uses a given role and an explicit function name', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack', { env });
    const role = iam.Role.fromRoleArn(stack, 'Role', 'arn:aws:iam::111111111111:role/existing');
    const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, role, webFunctionName: 'orders-api' });
    const t = Template.fromStack(stack);

    expect(fn.webFunctionName).toBe('orders-api');
    expect(Object.keys(t.findResources('AWS::IAM::Role')).filter((k) => k.startsWith('ApiServiceRole'))).toEqual([]);
    t.hasResourceProperties('AWS::Lambda::WebFunctionRevision', { ServiceConfig: { ExecutionRoleArn: 'arn:aws:iam::111111111111:role/existing' } });
  });

  test.each<[Partial<WebFunctionProps>, RegExp]>([
    [{ runtime: lambda.Runtime.PYTHON_3_13 }, /run Node.js only/],
    [{ timeout: Duration.seconds(1) }, /timeout must be between 3 seconds and 15 minutes/],
    [{ timeout: Duration.minutes(16) }, /timeout must be between 3 seconds and 15 minutes/],
    [{ maxConcurrencyPerEnvironment: 0 }, /maxConcurrencyPerEnvironment must be an integer from 1 to 128/],
    [{ maxConcurrencyPerEnvironment: 129 }, /maxConcurrencyPerEnvironment must be an integer from 1 to 128/],
    [{ environment: { AWS_REGION: 'x' } }, /AWS_REGION is reserved/],
    [{ environment: { AWS_LAMBDA_NODEJS_ENTRYPOINT: 'x' } }, /use the entrypoint property/],
    [{ webFunctionName: '-bad' }, /webFunctionName '-bad' must be 1-64/],
    [{ webFunctionName: 'a'.repeat(65) }, /must be 1-64/],
    [{ endpoint: { endpointName: 'bad name' } }, /endpointName 'bad name' must be 1-64/],
    [{ systemLogLevelV2: 'ERROR' as lambda.SystemLogLevel }, /systemLogLevelV2 must be DEBUG, INFO or WARN/],
    [{ code: lambda.Code.fromInline('x') }, /do not support inline code/],
  ])('rejects invalid configuration %#', (props, error) => {
    expect(() => make(props)).toThrow(error);
  });
});

describe('warnings and validation', () => {
  test('warns when the endpoint is public or its name is explicit', () => {
    const { stack } = make({ authType: WebFunctionAuthType.NONE, endpoint: { endpointName: 'live' } });
    const annotations = Annotations.fromStack(stack);
    annotations.hasWarning('/Stack/Api/Endpoint', Match.stringLikeRegexp('authType NONE makes the endpoint public'));
    annotations.hasWarning('/Stack/Api/Endpoint', Match.stringLikeRegexp("endpointName 'live' is set explicitly"));
  });

  test('no warnings for the recommended setup', () => {
    const { stack } = make();
    Annotations.fromStack(stack).hasNoWarning('*', Match.anyValue());
  });

  test('synthesizes with @aws-cdk/core:validateAgainstDefaultRules (F3006 is acknowledged on our resources)', () => {
    const { app } = make({ endpoint: { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] } }, { env, context: { '@aws-cdk/core:validateAgainstDefaultRules': true } });
    expect(() => app.synth()).not.toThrow();
  });
});

describe('permissions and tags', () => {
  test.each(['grants.invoke', 'grantInvoke'])('%s allows invoking this endpoint only', (method) => {
    const { fn, stack } = make();
    const consumer = new iam.Role(stack, 'Consumer', { assumedBy: new iam.AccountRootPrincipal() });
    if (method === 'grants.invoke') fn.grants.invoke(consumer); else fn.grantInvoke(consumer);

    Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
      Roles: [{ Ref: Match.stringLikeRegexp('^Consumer') }],
      PolicyDocument: { Statement: [{ Effect: 'Allow', Action: 'lambda:InvokeWebFunctionEndpoint', Resource: { 'Fn::GetAtt': [Match.stringLikeRegexp('^ApiEndpoint[0-9A-F]{8}$'), 'EndpointArn'] } }] },
    });
  });

  test('tags reach the function', () => {
    const { fn, template } = make();
    Tags.of(fn).add('team', 'orders');
    template().hasResourceProperties('AWS::Lambda::WebFunction', { Tags: [{ Key: 'team', Value: 'orders' }] });
  });
});

describe('shared provider IAM', () => {
  const providerStatements = (t: Template) => {
    const roles = t.findResources('AWS::IAM::Role');
    const id = Object.keys(roles).find((k) => k.startsWith('CustomLambdaWebFunctionProvider'))!;
    return (roles[id] as any).Properties.Policies[0].PolicyDocument.Statement;
  };

  test('does not change when an endpoint changes regions (IAM propagation and rollback would break it)', () => {
    const before = providerStatements(make({ endpoint: { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] } }).template());
    const after = providerStatements(make({ endpoint: { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1', 'eu-west-1'] } }).template());
    expect(after).toEqual(before);
  });

  test('is not duplicated per function or per log group', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack', { env });
    for (const id of ['A', 'B']) {
      new WebFunction(stack, id, {
        runtime: lambda.Runtime.NODEJS_24_X,
        code: code(),
        authType: WebFunctionAuthType.AWS_IAM,
        endpoint: { endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1', 'eu-west-1'] },
      });
    }
    const statements = providerStatements(Template.fromStack(stack)).map((st: unknown) => JSON.stringify(st));
    expect(new Set(statements).size).toBe(statements.length);
    expect(statements.filter((st: string) => st.includes('logs:CreateLogGroup'))).toHaveLength(1);
  });
});

test('logical IDs are stable (changing them replaces resources and URLs)', () => {
  const { template } = make({ endpoint: { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] } });
  const ids = Object.entries(template().toJSON().Resources as Record<string, { Type: string }>)
    .map(([id, r]) => `${r.Type} ${id}`).sort();
  expect(ids).toMatchSnapshot();
});
