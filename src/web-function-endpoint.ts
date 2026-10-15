import { createHash } from 'node:crypto';
import { Annotations, Stack, Token, Validations } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { WebFunctionAuthType, WebFunctionEndpointType } from './enums';
import { EndpointLookup } from './private/endpoint-lookup';
import { CFN_VALIDATE_UNKNOWN_TYPE, assertResourceName } from './private/validation';

/**
 * Options for a Web Function's endpoint.
 */
export interface WebFunctionEndpointOptions {
  /**
   * Where the endpoint serves traffic from.
   *
   * @default WebFunctionEndpointType.HOME_REGION
   */
  readonly endpointType?: WebFunctionEndpointType;

  /**
   * Regions to serve from in addition to the home region (the stack's region).
   * Required (at least one) for `MULTI_REGION` and `PER_REGION`; must be empty for `HOME_REGION`.
   *
   * Changing this creates a new endpoint with a new URL.
   *
   * @default - no extra regions
   */
  readonly regions?: string[];

  /**
   * The endpoint's name, shown in logs (`endpointName`) and in the `lambda-web-endpoint-name` header.
   *
   * When omitted, the name is `default-<hash>`, with the hash covering the endpoint type and regions,
   * so changing either deploys a new endpoint cleanly. When set, changing the endpoint type or
   * regions also requires a new name: two endpoints of one function can't share a name, and
   * CloudFormation creates the replacement before deleting the old one.
   *
   * @default - `default-<hash of type and regions>`
   */
  readonly endpointName?: string;
}

/**
 * Internal: how `WebFunction` creates its endpoint. Not part of the public API.
 */
interface WebFunctionEndpointProps extends WebFunctionEndpointOptions {
  /** Literal name of the Web Function (the provider's IAM must not reference resource attributes). */
  readonly functionName: string;

  /** The Web Function's ARN. */
  readonly functionArn: string;

  /** ID of the revision the endpoint serves. */
  readonly revisionId: string;

  /** How callers are authenticated. */
  readonly authType: WebFunctionAuthType;
}

/**
 * The HTTPS endpoint of a Web Function. Created by `WebFunction`; access it as `fn.endpoint`.
 *
 * Only `WebFunction` creates endpoints in this version (one per function), so the constructor is private.
 */
export class WebFunctionEndpoint extends Construct {
  /**
   * Creates the endpoint of a Web Function. Used by `WebFunction`.
   *
   * @internal
   */
  public static _create(scope: Construct, id: string, props: WebFunctionEndpointProps): WebFunctionEndpoint {
    return new WebFunctionEndpoint(scope, id, props);
  }

  /** The endpoint's name. */
  public readonly endpointName: string;

  /** The endpoint's ARN. */
  public readonly endpointArn: string;

  /** Where the endpoint serves traffic from. */
  public readonly endpointType: WebFunctionEndpointType;

  /** Every region the endpoint serves from: the home region first, then the others in alphabetical order. */
  public readonly regions: string[];

  /**
   * The endpoint's domain name: the global domain for `MULTI_REGION`, otherwise the home region's.
   */
  public readonly domainName: string;

  /**
   * The endpoint's URL: the global URL for `MULTI_REGION`, otherwise the home region's.
   */
  public readonly url: string;

  private readonly homeRegion: string;
  private readonly functionName: string;
  private readonly functionArn: string;
  private lookup?: EndpointLookup;

  private constructor(scope: Construct, id: string, props: WebFunctionEndpointProps) {
    super(scope, id);

    const homeRegion = Stack.of(this).region;
    const endpointType = props.endpointType ?? WebFunctionEndpointType.HOME_REGION;
    const extraRegions = normaliseRegions(this, endpointType, homeRegion, props.regions ?? []);

    if (props.endpointName !== undefined) {
      assertResourceName(this, 'endpointName', props.endpointName);
      Annotations.of(this).addWarningV2('@cdk-lambda-web:explicitEndpointName',
        `endpointName '${props.endpointName}' is set explicitly: changing endpointType or regions later also requires a new endpointName, otherwise the deployment fails with "already exists" (the stack rolls back safely). Omit endpointName to get a name that changes automatically.`);
    }
    if (props.authType === WebFunctionAuthType.NONE) {
      Annotations.of(this).addWarningV2('@cdk-lambda-web:authTypeNone',
        'authType NONE makes the endpoint public: Lambda does no authentication, so your application must authenticate requests itself.');
    }

    this.endpointType = endpointType;
    this.endpointName = props.endpointName ?? defaultEndpointName(endpointType, extraRegions);
    this.regions = [homeRegion, ...extraRegions];
    this.homeRegion = homeRegion;
    this.functionName = props.functionName;
    this.functionArn = props.functionArn;

    const resource = new lambda.CfnWebFunctionEndpoint(this, 'Resource', {
      functionName: props.functionArn,
      endpointName: this.endpointName,
      endpointType,
      authType: props.authType,
      regions: extraRegions.length > 0 ? extraRegions : undefined,
      revisionWeights: [{ revisionId: props.revisionId, weight: 100 }],
    });
    Validations.of(resource).acknowledge(CFN_VALIDATE_UNKNOWN_TYPE);

    this.endpointArn = resource.attrEndpointArn;
    this.domainName = resource.attrDomainName;
    this.url = `https://${resource.attrDomainName}`;
  }

  /**
   * The URL of this endpoint in one region. Only for `PER_REGION` endpoints.
   *
   * @param region one of `regions`
   */
  public regionalUrl(region: string): string {
    if (this.endpointType !== WebFunctionEndpointType.PER_REGION) {
      throw new Error(`${this.node.path}: regionalUrl() is only available for PER_REGION endpoints (this one is ${this.endpointType}); use url`);
    }
    if (!this.regions.includes(region)) {
      throw new Error(`${this.node.path}: region ${region} is not one of the endpoint's regions (${this.regions.join(', ')})`);
    }
    if (region === this.homeRegion) {
      return this.url;
    }
    this.lookup ??= new EndpointLookup(this, 'Lookup', {
      functionName: this.functionName,
      functionArn: this.functionArn,
      endpointName: this.endpointName,
      endpointArn: this.endpointArn,
    });
    return `https://${this.lookup.regionalDomain(region)}`;
  }
}

function normaliseRegions(scope: Construct, endpointType: WebFunctionEndpointType, homeRegion: string, regions: string[]): string[] {
  const extra = [...new Set(regions)].filter((r) => r !== homeRegion).sort();
  for (const r of regions) {
    if (Token.isUnresolved(r)) {
      throw new Error(`${scope.node.path}: regions must be literal region names, got a token`);
    }
    if (!/^[a-z]{2}(-[a-z]+)+-\d$/.test(r)) {
      throw new Error(`${scope.node.path}: '${r}' is not a valid region name`);
    }
  }
  if (endpointType === WebFunctionEndpointType.HOME_REGION && extra.length > 0) {
    throw new Error(`${scope.node.path}: a HOME_REGION endpoint serves only the home region (${homeRegion}); use MULTI_REGION or PER_REGION to add ${extra.join(', ')}`);
  }
  if (endpointType !== WebFunctionEndpointType.HOME_REGION) {
    if (Token.isUnresolved(homeRegion)) {
      throw new Error(`${scope.node.path}: ${endpointType} endpoints need a stack with an explicit region (env.region)`);
    }
    if (extra.length === 0) {
      throw new Error(`${scope.node.path}: a ${endpointType} endpoint needs at least one region besides the home region (${homeRegion})`);
    }
  }
  return extra;
}

/** `default-<hash>`: a type or region change produces a new name, so the replacement doesn't collide. */
function defaultEndpointName(endpointType: WebFunctionEndpointType, extraRegions: string[]): string {
  const hash = createHash('sha256').update([endpointType, ...extraRegions].join(',')).digest('hex').slice(0, 8);
  return `default-${hash}`;
}
