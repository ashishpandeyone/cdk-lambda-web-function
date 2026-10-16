import { Duration, Lazy, Names, Stack, Token } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { Construct } from 'constructs';
import { WebFunctionAuthType, WebFunctionEndpointType } from './enums';
import type { WebFunctionEndpoint } from './web-function-endpoint';

/**
 * Regions that are not enabled by default. CloudFront can't sign a request that a MULTI_REGION endpoint routes
 * to one of them, so the origin returns 403 (CloudFront Developer Guide, Lambda Web Function origins, 2026-10).
 */
const OPT_IN_REGIONS = [
  'af-south-1', 'ap-east-1', 'ap-east-2', 'ap-south-2', 'ap-southeast-3', 'ap-southeast-4', 'ap-southeast-5', 'ap-southeast-6',
  'ap-southeast-7', 'ca-west-1', 'eu-central-2', 'eu-south-1', 'eu-south-2', 'il-central-1', 'me-central-1', 'me-south-1', 'mx-central-1',
];

/**
 * Properties for a Web Function endpoint origin.
 */
export interface WebFunctionOriginProps extends cloudfront.OriginProps {
  /**
   * For a `PER_REGION` endpoint: the region whose URL CloudFront calls. Only one region per origin; use an origin
   * group or one origin per behavior for more.
   *
   * @default - the endpoint's home region
   */
  readonly region?: string;

  /**
   * How long CloudFront waits for a response from the origin. Above 120 seconds needs a CloudFront quota increase.
   *
   * @default Duration.seconds(30)
   */
  readonly readTimeout?: Duration;

  /**
   * How long CloudFront keeps its connection to the origin open.
   *
   * @default Duration.seconds(5)
   */
  readonly keepaliveTimeout?: Duration;

  /**
   * Which IP protocol CloudFront uses to connect to the origin.
   *
   * @default OriginIpAddressType.IPV4
   */
  readonly ipAddressType?: cloudfront.OriginIpAddressType;
}

/**
 * Properties for a Web Function endpoint origin with origin access control.
 */
export interface WebFunctionOriginWithOacProps extends WebFunctionOriginProps {
  /**
   * The origin access control. It must have origin type `lambda`, signing behavior `always-amz-auth`, and signing
   * protocol `sigv4` (a regional endpoint) or `sigv4a` (a `MULTI_REGION` endpoint's global domain).
   *
   * @default - one is created per stack and signing protocol
   */
  readonly originAccessControl?: cloudfront.IOriginAccessControlRef;
}

/**
 * A CloudFront origin for a Web Function endpoint.
 *
 * Use `WebFunctionOrigin.withOriginAccessControl(endpoint)` for an `AWS_IAM` endpoint: CloudFront signs every request,
 * and only your distribution may call the endpoint. `new WebFunctionOrigin(endpoint)` is for a public (`NONE`) endpoint.
 */
export class WebFunctionOrigin extends cloudfront.OriginBase {
  /**
   * An origin for an `AWS_IAM` endpoint, with origin access control: CloudFront signs every request to the endpoint
   * (`always-amz-auth`, which keeps the viewer's `Authorization` header for your application), and the function's
   * resource policy allows `cloudfront.amazonaws.com` to call this endpoint on behalf of this distribution only.
   *
   * The distribution must be in the function's stack.
   */
  public static withOriginAccessControl(endpoint: WebFunctionEndpoint, props: WebFunctionOriginWithOacProps = {}): cloudfront.IOrigin {
    if (endpoint.authType !== WebFunctionAuthType.AWS_IAM) {
      throw new Error(`${endpoint.node.path}: origin access control needs an AWS_IAM endpoint (this one is ${endpoint.authType}, which Lambda doesn't authenticate); use new WebFunctionOrigin(endpoint)`);
    }
    if (endpoint.endpointType === WebFunctionEndpointType.MULTI_REGION) {
      const optIn = endpoint.regions.filter((r) => OPT_IN_REGIONS.includes(r));
      if (optIn.length > 0) {
        throw new Error(`${endpoint.node.path}: CloudFront can't sign requests that a MULTI_REGION endpoint routes to opt-in regions (${optIn.join(', ')}); use a PER_REGION endpoint and one origin per region`);
      }
    }
    return new WebFunctionOriginWithOac(endpoint, props);
  }

  private readonly props: WebFunctionOriginProps;

  constructor(endpoint: WebFunctionEndpoint, props: WebFunctionOriginProps = {}) {
    if (endpoint.authType === WebFunctionAuthType.AWS_IAM) {
      throw new Error(`${endpoint.node.path}: CloudFront can only call an AWS_IAM endpoint with origin access control; use WebFunctionOrigin.withOriginAccessControl(endpoint)`);
    }
    super(originDomainName(endpoint, props.region), props);
    validateTimeouts(endpoint, props);
    this.props = props;
  }

  protected renderCustomOriginConfig(): cloudfront.CfnDistribution.CustomOriginConfigProperty | undefined {
    return customOriginConfig(this.props);
  }
}

class WebFunctionOriginWithOac extends cloudfront.OriginBase {
  private readonly signingProtocol: 'sigv4' | 'sigv4a';

  constructor(private readonly endpoint: WebFunctionEndpoint, private readonly props: WebFunctionOriginWithOacProps) {
    super(originDomainName(endpoint, props.region), props);
    validateTimeouts(endpoint, props);
    // The global domain routes to any of the endpoint's regions, so CloudFront signs for all of them.
    this.signingProtocol = endpoint.endpointType === WebFunctionEndpointType.MULTI_REGION ? 'sigv4a' : 'sigv4';
  }

  public bind(scope: Construct, options: cloudfront.OriginBindOptions): cloudfront.OriginBindConfig {
    const config = super.bind(scope, options);
    const stack = Stack.of(scope);
    if (stack !== Stack.of(this.endpoint)) {
      // The resource policy names the distribution, and the distribution names the endpoint: a reference cycle.
      throw new Error(`${scope.node.path}: a distribution with a WebFunctionOrigin must be in the function's stack (${Stack.of(this.endpoint).stackName})`);
    }
    const oac = this.props.originAccessControl ?? this.sharedOriginAccessControl(stack);

    const result = this.endpoint.webFunction.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      actions: ['lambda:InvokeWebFunctionEndpoint'],
      resources: [this.endpoint.endpointArn],
      conditions: {
        StringEquals: {
          'aws:SourceArn': stack.formatArn({ service: 'cloudfront', region: '', resource: 'distribution', resourceName: options.distributionId }),
        },
      },
    }));
    if (!result.statementAdded) {
      throw new Error(`${scope.node.path}: could not add CloudFront to the resource policy of ${this.endpoint.webFunction.node.path}`);
    }

    return { ...config, originProperty: { ...config.originProperty!, originAccessControlId: oac.originAccessControlRef.originAccessControlId } };
  }

  protected renderCustomOriginConfig(): cloudfront.CfnDistribution.CustomOriginConfigProperty | undefined {
    return customOriginConfig(this.props);
  }

  /** One origin access control per stack and signing protocol, shared by the stack's Web Function origins. */
  private sharedOriginAccessControl(scope: Stack): cloudfront.IOriginAccessControlRef {
    const id = `WebFunctionOriginAccessControl${this.signingProtocol === 'sigv4a' ? 'SigV4a' : 'SigV4'}`;
    const existing = scope.node.tryFindChild(id) as cloudfront.CfnOriginAccessControl | undefined;
    if (existing) return existing;
    const oac: cloudfront.CfnOriginAccessControl = new cloudfront.CfnOriginAccessControl(scope, id, {
      originAccessControlConfig: {
        // Unique in the account, like the names CDK generates for its own origin access controls.
        name: Lazy.string({ produce: () => Names.uniqueResourceName(oac, { maxLength: 64 }) }),
        description: `Lambda Web Function origins (${this.signingProtocol})`,
        // The CDK enums have neither value yet. Lambda Web Function origins accept only always-amz-auth.
        originAccessControlOriginType: 'lambda',
        signingBehavior: 'always-amz-auth',
        signingProtocol: this.signingProtocol,
      },
    });
    return oac;
  }
}

function originDomainName(endpoint: WebFunctionEndpoint, region?: string): string {
  if (region === undefined) return endpoint.domainName;
  if (endpoint.endpointType !== WebFunctionEndpointType.PER_REGION) {
    throw new Error(`${endpoint.node.path}: region is only for PER_REGION endpoints (this one is ${endpoint.endpointType})`);
  }
  return endpoint.regionalDomainName(region);
}

function validateTimeouts(endpoint: WebFunctionEndpoint, props: WebFunctionOriginProps) {
  for (const [name, value] of [['readTimeout', props.readTimeout], ['keepaliveTimeout', props.keepaliveTimeout]] as const) {
    const seconds = value?.toSeconds();
    if (seconds !== undefined && !Token.isUnresolved(seconds) && (!Number.isInteger(seconds) || seconds < 1)) {
      throw new Error(`${endpoint.node.path}: ${name} must be a whole number of seconds, at least 1, got ${seconds}`);
    }
  }
}

function customOriginConfig(props: WebFunctionOriginProps): cloudfront.CfnDistribution.CustomOriginConfigProperty {
  return {
    originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2],
    originReadTimeout: props.readTimeout?.toSeconds(),
    originKeepaliveTimeout: props.keepaliveTimeout?.toSeconds(),
    ipAddressType: props.ipAddressType,
  };
}
