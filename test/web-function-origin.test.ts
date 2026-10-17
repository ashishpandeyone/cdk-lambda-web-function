import * as path from 'node:path';
import { App, Duration, Names, Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {
  WebFunction, WebFunctionAuthType, WebFunctionEndpointType, WebFunctionOrigin,
  type WebFunctionEndpoint, type WebFunctionOriginProps, type WebFunctionProps,
} from '../src';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };
const WRITER = 'Custom::LambdaWebResourcePolicyStatements';

function make(props: Partial<WebFunctionProps> = {}) {
  const stack = new Stack(new App(), 'Stack', { env });
  const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, ...props });
  return { stack, fn, template: () => Template.fromStack(stack) };
}

const distribution = (stack: Stack, origin: cloudfront.IOrigin) => new cloudfront.Distribution(stack, 'Cdn', { defaultBehavior: { origin } });
const origins = (t: Template) => (Object.values(t.findResources('AWS::CloudFront::Distribution'))[0] as any).Properties.DistributionConfig.Origins;
const oacs = (t: Template) => Object.values(t.findResources('AWS::CloudFront::OriginAccessControl')).map((r: any) => r.Properties.OriginAccessControlConfig);
const policyStatements = (t: Template) => (Object.values(t.findResources(WRITER))[0] as any).Properties.Policy.Statement;

describe('WebFunctionOrigin.withOriginAccessControl', () => {
  test('signs with always-amz-auth (SigV4) and lets only this distribution call the endpoint', () => {
    const { fn, stack, template } = make();
    distribution(stack, WebFunctionOrigin.withOriginAccessControl(fn.endpoint));
    const t = template();

    const [origin] = origins(t);
    expect(origin.DomainName).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^ApiEndpoint/), 'DomainName'] });
    expect(origin.OriginAccessControlId).toEqual({ Ref: expect.stringMatching(/^WebFunctionOriginAccessControlSigV4$/) });
    expect(origin.CustomOriginConfig).toEqual({ OriginProtocolPolicy: 'https-only', OriginSSLProtocols: ['TLSv1.2'] });

    expect(oacs(t)).toEqual([{
      Name: expect.stringMatching(/^StackWebFunctionOriginAccessControlSigV4/),
      Description: 'Lambda Web Function origins (sigv4)',
      OriginAccessControlOriginType: 'lambda',
      SigningBehavior: 'always-amz-auth',
      SigningProtocol: 'sigv4',
    }]);

    expect(policyStatements(t)).toEqual([{
      Sid: expect.stringMatching(/^Cdk[0-9A-F]{8}0$/),
      Effect: 'Allow',
      Principal: { Service: 'cloudfront.amazonaws.com' },
      Action: 'lambda:InvokeWebFunctionEndpoint',
      Resource: { 'Fn::GetAtt': [expect.stringMatching(/^ApiEndpoint/), 'EndpointArn'] },
      Condition: {
        StringEquals: {
          'aws:SourceArn': { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':cloudfront::111111111111:distribution/', { Ref: expect.stringMatching(/^Cdn/) }]] },
        },
      },
    }]);
    Annotations.fromStack(stack).hasNoWarning('*', Match.stringLikeRegexp('from any account'));
  });

  test('a MULTI_REGION endpoint\'s global domain is signed with SigV4a; one OAC per protocol, shared by the stack\'s origins', () => {
    const { fn, stack, template } = make({ endpoint: { endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1'] } });
    const home = fn.addEndpoint('Home', { authType: WebFunctionAuthType.AWS_IAM });
    const admin = fn.addEndpoint('Admin', { authType: WebFunctionAuthType.AWS_IAM });
    const cdn = distribution(stack, WebFunctionOrigin.withOriginAccessControl(fn.endpoint));
    cdn.addBehavior('/home/*', WebFunctionOrigin.withOriginAccessControl(home));
    cdn.addBehavior('/admin/*', WebFunctionOrigin.withOriginAccessControl(admin));
    // A second distribution in the stack reuses them.
    new cloudfront.Distribution(stack, 'Cdn2', { defaultBehavior: { origin: WebFunctionOrigin.withOriginAccessControl(home) } });
    const t = template();

    expect(oacs(t).map((c) => c.SigningProtocol).sort()).toEqual(['sigv4', 'sigv4a']);
    expect(origins(t).map((o: any) => o.OriginAccessControlId.Ref)).toEqual([
      'WebFunctionOriginAccessControlSigV4a', 'WebFunctionOriginAccessControlSigV4', 'WebFunctionOriginAccessControlSigV4',
    ]);
    expect(policyStatements(t)).toHaveLength(4);
  });

  test('PER_REGION: the home region by default, or the region given', () => {
    const { fn, stack, template } = make({ endpoint: { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] } });
    const cdn = distribution(stack, WebFunctionOrigin.withOriginAccessControl(fn.endpoint));
    cdn.addBehavior('/us/*', WebFunctionOrigin.withOriginAccessControl(fn.endpoint, { region: 'us-east-1' }));
    const [home, us] = origins(template());
    expect(home.DomainName).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^ApiEndpoint/), 'DomainName'] });
    expect(us.DomainName).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^ApiEndpointLookup/), 'Domain.us-east-1'] });
    expect(oacs(template()).map((c) => c.SigningProtocol)).toEqual(['sigv4']);
  });

  test('region is only for PER_REGION endpoints, and must be one of theirs', () => {
    const per = make({ endpoint: { endpointType: WebFunctionEndpointType.PER_REGION, regions: ['us-east-1'] } });
    expect(() => WebFunctionOrigin.withOriginAccessControl(per.fn.endpoint, { region: 'eu-west-1' })).toThrow(/region eu-west-1 is not one of the endpoint's regions/);
    const home = make();
    expect(() => WebFunctionOrigin.withOriginAccessControl(home.fn.endpoint, { region: 'ap-south-1' })).toThrow(/region is only for PER_REGION endpoints/);
  });

  test('needs an AWS_IAM endpoint', () => {
    const { fn } = make({ authType: WebFunctionAuthType.NONE });
    expect(() => WebFunctionOrigin.withOriginAccessControl(fn.endpoint)).toThrow(/origin access control needs an AWS_IAM endpoint/);
  });

  test('rejects a MULTI_REGION endpoint with an opt-in region', () => {
    const { fn } = make({ endpoint: { endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1', 'me-central-1'] } });
    expect(() => WebFunctionOrigin.withOriginAccessControl(fn.endpoint)).toThrow(/opt-in regions \(me-central-1\)/);
  });

  test('a distribution in another stack writes its statement from its own stack (no reference cycle)', () => {
    const { fn, stack } = make();
    const app = stack.node.scope as App;
    const cdnStack = new Stack(app, 'Cdn', { env });
    distribution(cdnStack, WebFunctionOrigin.withOriginAccessControl(fn.endpoint));
    const assembly = app.synth(); // fails on a cycle

    const fnTemplate = Template.fromStack(stack);
    fnTemplate.resourceCountIs(WRITER, 0);
    const cdn = Template.fromStack(cdnStack);
    const [writer] = Object.values(cdn.findResources(WRITER)) as any[];
    expect(writer.Properties.FunctionArn).toEqual({ 'Fn::ImportValue': expect.stringMatching(/^Stack:ExportsOutputFnGetAttApi/) });
    expect(writer.Properties.Policy.Statement[0].Condition.StringEquals['aws:SourceArn']['Fn::Join'][1]).toContainEqual({ Ref: expect.stringMatching(/^Cdn/) });
    // The function's stack doesn't depend on the distribution's.
    const stackDeps = (name: string) => assembly.getStackByName(name).dependencies.map((d) => d.id).filter((id) => !id.endsWith('.assets'));
    expect(stackDeps('Stack')).toEqual([]);
    expect(stackDeps('Cdn')).toEqual(['Stack']);
  });

  test('uses a given origin access control instead of creating one', () => {
    const { fn, stack, template } = make();
    const oac = new cloudfront.CfnOriginAccessControl(stack, 'Mine', {
      originAccessControlConfig: { name: 'mine', originAccessControlOriginType: 'lambda', signingBehavior: 'always-amz-auth', signingProtocol: 'sigv4' },
    });
    distribution(stack, WebFunctionOrigin.withOriginAccessControl(fn.endpoint, { originAccessControl: oac, readTimeout: Duration.seconds(60) }));
    const t = template();
    expect(oacs(t).map((c) => c.Name)).toEqual(['mine']);
    expect(origins(t)[0].OriginAccessControlId).toEqual({ Ref: 'Mine' });
    expect(origins(t)[0].CustomOriginConfig.OriginReadTimeout).toBe(60);
  });

  test('renders the origin exactly (bound directly, as CDK\'s origin tests do)', () => {
    const { fn, stack } = make();
    const config = WebFunctionOrigin.withOriginAccessControl(fn.endpoint).bind(stack, { originId: 'StackOrigin', distributionId: 'DIST' });
    expect(stack.resolve(config.originProperty)).toEqual({
      id: 'StackOrigin',
      domainName: { 'Fn::GetAtt': [expect.stringMatching(/^ApiEndpoint/), 'DomainName'] },
      customOriginConfig: { originProtocolPolicy: 'https-only', originSslProtocols: ['TLSv1.2'] },
      originAccessControlId: { Ref: 'WebFunctionOriginAccessControlSigV4' },
    });
  });

  test('passes the standard origin properties through', () => {
    const { fn, stack } = make();
    const origin = WebFunctionOrigin.withOriginAccessControl(fn.endpoint, {
      originId: 'Custom',
      originPath: '/app',
      connectionTimeout: Duration.seconds(5),
      connectionAttempts: 2,
      customHeaders: { 'x-origin': 'cdn' },
      originShieldRegion: 'ap-south-1',
      responseCompletionTimeout: Duration.seconds(90),
      readTimeout: Duration.seconds(60),
      keepaliveTimeout: Duration.seconds(10),
    });
    expect(stack.resolve(origin.bind(stack, { originId: 'StackOrigin', distributionId: 'DIST' }).originProperty)).toEqual({
      id: 'Custom',
      domainName: expect.anything(),
      originPath: '/app',
      connectionTimeout: 5,
      connectionAttempts: 2,
      originCustomHeaders: [{ headerName: 'x-origin', headerValue: 'cdn' }],
      originShield: { enabled: true, originShieldRegion: 'ap-south-1' },
      responseCompletionTimeout: 90,
      customOriginConfig: {
        originProtocolPolicy: 'https-only', originSslProtocols: ['TLSv1.2'], originReadTimeout: 60, originKeepaliveTimeout: 10,
      },
      originAccessControlId: expect.anything(),
    });
  });

  test('needs a distribution ID to scope the resource policy', () => {
    const { fn, stack } = make();
    expect(() => WebFunctionOrigin.withOriginAccessControl(fn.endpoint).bind(stack, { originId: 'StackOrigin' }))
      .toThrow(/must be used by a cloudfront.Distribution/);
  });

  test('the generated origin access control name is unique in the account', () => {
    const { fn, stack, template } = make();
    distribution(stack, WebFunctionOrigin.withOriginAccessControl(fn.endpoint));
    const t = template();
    const oac = stack.node.findChild('WebFunctionOriginAccessControlSigV4');
    expect(oacs(t)[0].Name).toBe(Names.uniqueResourceName(oac, { maxLength: 64 }));
  });

  test('in an environment-agnostic stack, the distribution ARN uses the deploy-time account', () => {
    const stack = new Stack(new App(), 'Stack');
    const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM });
    distribution(stack, WebFunctionOrigin.withOriginAccessControl(fn.endpoint));
    expect(policyStatements(Template.fromStack(stack))[0].Condition.StringEquals['aws:SourceArn']).toEqual({
      'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':cloudfront::', { Ref: 'AWS::AccountId' }, ':distribution/', { Ref: expect.stringMatching(/^Cdn/) }]],
    });
  });

  test('rejects a given origin access control with settings CloudFront refuses for Web Function origins', () => {
    const { fn, stack } = make({ endpoint: { endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1'] } });
    const home = fn.addEndpoint('Home', { authType: WebFunctionAuthType.AWS_IAM });
    // CDK's own Lambda OAC signs with 'always'.
    const l2 = new cloudfront.FunctionUrlOriginAccessControl(stack, 'FunctionUrlOac');
    expect(() => WebFunctionOrigin.withOriginAccessControl(home, { originAccessControl: l2 }))
      .toThrow(/FunctionUrlOac must have SigningBehavior 'always-amz-auth' for this endpoint/);
    // The global domain needs SigV4a.
    const sigv4 = new cloudfront.CfnOriginAccessControl(stack, 'SigV4', {
      originAccessControlConfig: { name: 'v4', originAccessControlOriginType: 'lambda', signingBehavior: 'always-amz-auth', signingProtocol: 'sigv4' },
    });
    expect(() => WebFunctionOrigin.withOriginAccessControl(fn.endpoint, { originAccessControl: sigv4 })).toThrow(/must have SigningProtocol 'sigv4a'/);
    expect(() => WebFunctionOrigin.withOriginAccessControl(home, { originAccessControl: sigv4 })).not.toThrow();
    // An imported one can't be checked.
    const imported = cloudfront.FunctionUrlOriginAccessControl.fromOriginAccessControlId(stack, 'Imported', 'E2QWRUHAPOMQZL');
    expect(() => WebFunctionOrigin.withOriginAccessControl(home, { originAccessControl: imported })).not.toThrow();
  });

  test.each([cloudfront.OriginIpAddressType.IPV4, cloudfront.OriginIpAddressType.IPV6, cloudfront.OriginIpAddressType.DUALSTACK])('ipAddressType %s', (ipAddressType) => {
    const { fn, stack, template } = make();
    distribution(stack, WebFunctionOrigin.withOriginAccessControl(fn.endpoint, { ipAddressType }));
    expect(origins(template())[0].CustomOriginConfig.IpAddressType).toBe(ipAddressType);
  });
});

// Both construction paths validate their props, like CDK's FunctionUrlOrigin.
const factories: Array<[string, WebFunctionAuthType, (e: WebFunctionEndpoint, p: WebFunctionOriginProps) => unknown]> = [
  ['new WebFunctionOrigin', WebFunctionAuthType.NONE, (e, p) => new WebFunctionOrigin(e, p)],
  ['WebFunctionOrigin.withOriginAccessControl', WebFunctionAuthType.AWS_IAM, (e, p) => WebFunctionOrigin.withOriginAccessControl(e, p)],
];

describe.each(factories)('%s: timeouts', (_name, authType, create) => {
  const endpoint = () => make({ authType }).fn.endpoint;

  test.each(['readTimeout', 'keepaliveTimeout'] as const)('%s is at least 1 second', (prop) => {
    expect(() => create(endpoint(), { [prop]: Duration.seconds(0) })).toThrow(new RegExp(`${prop} must be a whole number of seconds, at least 1, got 0`));
  });

  test('values above the default quotas are left for CloudFront to check', () => {
    expect(() => create(endpoint(), { readTimeout: Duration.minutes(5), keepaliveTimeout: Duration.minutes(10) })).not.toThrow();
  });

  test('responseCompletionTimeout can\'t be shorter than readTimeout', () => {
    expect(() => create(endpoint(), { readTimeout: Duration.seconds(60), responseCompletionTimeout: Duration.seconds(30) }))
      .toThrow('responseCompletionTimeout must be equal to or greater than readTimeout (60s), got: 30s.');
    expect(() => create(endpoint(), { readTimeout: Duration.seconds(60), responseCompletionTimeout: Duration.seconds(60) })).not.toThrow();
  });
});

describe('new WebFunctionOrigin', () => {
  test('a public endpoint: no origin access control, no resource policy', () => {
    const { fn, stack, template } = make({ authType: WebFunctionAuthType.NONE });
    distribution(stack, new WebFunctionOrigin(fn.endpoint, { keepaliveTimeout: Duration.seconds(10) }));
    const t = template();
    t.resourceCountIs('AWS::CloudFront::OriginAccessControl', 0);
    t.resourceCountIs(WRITER, 0);
    expect(origins(t)[0]).toEqual(expect.objectContaining({
      DomainName: { 'Fn::GetAtt': [expect.stringMatching(/^ApiEndpoint/), 'DomainName'] },
      CustomOriginConfig: { OriginProtocolPolicy: 'https-only', OriginSSLProtocols: ['TLSv1.2'], OriginKeepaliveTimeout: 10 },
    }));
    expect(origins(t)[0].OriginAccessControlId).toBeUndefined();
  });

  test('an AWS_IAM endpoint needs origin access control', () => {
    const { fn } = make();
    expect(() => new WebFunctionOrigin(fn.endpoint)).toThrow(/use WebFunctionOrigin.withOriginAccessControl/);
  });
});
