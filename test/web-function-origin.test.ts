import * as path from 'node:path';
import { App, Duration, Stack } from 'aws-cdk-lib';
import { Annotations, Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebFunction, WebFunctionAuthType, WebFunctionEndpointType, WebFunctionOrigin, type WebFunctionProps } from '../src';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };

function make(props: Partial<WebFunctionProps> = {}) {
  const stack = new Stack(new App(), 'Stack', { env });
  const fn = new WebFunction(stack, 'Api', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, ...props });
  return { stack, fn, template: () => Template.fromStack(stack) };
}

const distribution = (stack: Stack, origin: cloudfront.IOrigin) => new cloudfront.Distribution(stack, 'Cdn', { defaultBehavior: { origin } });
const origins = (t: Template) => (Object.values(t.findResources('AWS::CloudFront::Distribution'))[0] as any).Properties.DistributionConfig.Origins;
const oacs = (t: Template) => Object.values(t.findResources('AWS::CloudFront::OriginAccessControl')).map((r: any) => r.Properties.OriginAccessControlConfig);
const policyStatements = (t: Template) => (Object.values(t.findResources('AWS::Lambda::ResourcePolicy'))[0] as any).Properties.PolicyDocument.Statement;

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

  test('the distribution must be in the function\'s stack', () => {
    const { fn, stack } = make();
    const other = new Stack(stack.node.scope as App, 'Cdn', { env });
    expect(() => distribution(other, WebFunctionOrigin.withOriginAccessControl(fn.endpoint))).toThrow(/must be in the function's stack \(Stack\)/);
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

  test('timeouts are whole seconds, at least 1', () => {
    const { fn } = make();
    expect(() => WebFunctionOrigin.withOriginAccessControl(fn.endpoint, { readTimeout: Duration.seconds(0) })).toThrow(/readTimeout must be a whole number of seconds/);
  });
});

describe('new WebFunctionOrigin', () => {
  test('a public endpoint: no origin access control, no resource policy', () => {
    const { fn, stack, template } = make({ authType: WebFunctionAuthType.NONE });
    distribution(stack, new WebFunctionOrigin(fn.endpoint, { keepaliveTimeout: Duration.seconds(10) }));
    const t = template();
    t.resourceCountIs('AWS::CloudFront::OriginAccessControl', 0);
    t.resourceCountIs('AWS::Lambda::ResourcePolicy', 0);
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
