import { createHash } from 'node:crypto';
import { Annotations, Stack, Token, Validations } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { WebFunctionAuthType, WebFunctionEndpointType } from './enums';
import { EndpointLookup } from './private/endpoint-lookup';
import { TrafficShift } from './private/traffic-shift';
import { CFN_VALIDATE_UNKNOWN_TYPE, assertResourceName } from './private/validation';
import type { IWebFunction } from './web-function';
import type { WebFunctionDeployment } from './web-function-deployment';
import { WebFunctionGrants } from './web-function-grants';
import type { IWebFunctionRevision } from './web-function-revision';

/**
 * A revision and the share of an endpoint's traffic it receives.
 */
export interface WebFunctionRevisionWeight {
  /** The revision. */
  readonly revision: IWebFunctionRevision;

  /**
   * The revision's share of the endpoint's traffic, as a fraction (like `lambda.Alias` `additionalVersions`).
   * Must be a whole percentage from 0.01 to 0.99.
   */
  readonly weight: number;
}

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
   * Names are unique per function.
   *
   * When omitted, the name ends in a hash of the endpoint type and regions, so changing either deploys
   * a new endpoint cleanly. When set, changing the endpoint type or regions also requires a new name:
   * two endpoints of one function can't share a name, and CloudFormation creates the replacement
   * before deleting the old one.
   *
   * @default - `default-<hash>` for the function's default endpoint, `<id>-<hash>` for endpoints added with `addEndpoint`
   */
  readonly endpointName?: string;

  /**
   * A description of the endpoint.
   *
   * @default - no description
   */
  readonly description?: string;

  /**
   * The most requests per second the endpoint accepts; excess requests get HTTP 429.
   * Allowed: 0 (blocks all traffic), 100–1,000 in steps of 100, or 2,000–10,000 in steps of 1,000.
   *
   * Enforced separately in each region the endpoint serves from, so a multi-region endpoint
   * can accept this many requests per second in every region.
   *
   * @default - no limit beyond the service quota of 10,000 requests per second per endpoint (per region)
   */
  readonly rateLimit?: number;

  /**
   * The most execution environments the endpoint may use (2–10,000). Each one uses 2 vCPUs of the account's quota.
   *
   * Enforced separately in each region the endpoint serves from.
   *
   * @default - scales within the account's vCPU quota
   */
  readonly maxEnvironments?: number;

  /**
   * How the endpoint moves its traffic to a new revision: all at once, or in steps
   * (`WebFunctionDeployment.canary()` or `linear()`) that watch CloudWatch alarms and move
   * the traffic back when one goes into ALARM.
   *
   * A deployment in steps can't be combined with `revision`, `additionalRevisions` or `routeTraffic()`.
   *
   * @default WebFunctionDeployment.allAtOnce()
   */
  readonly deployment?: WebFunctionDeployment;
}

/**
 * Options for `WebFunction.addEndpoint`.
 */
export interface AddWebFunctionEndpointOptions extends WebFunctionEndpointOptions {
  /**
   * How callers of this endpoint are authenticated.
   */
  readonly authType: WebFunctionAuthType;

  /**
   * The revision the endpoint serves, e.g. an earlier one from `WebFunctionRevision.fromRevisionAttributes`
   * to keep this endpoint on it while others move on. Same as calling `routeTraffic`.
   *
   * @default - the function's current revision (`currentRevision`)
   */
  readonly revision?: IWebFunctionRevision;

  /**
   * A second revision and its share of the endpoint's traffic; `revision` gets the rest.
   * An endpoint routes to at most two revisions.
   *
   * @default - all traffic goes to `revision`
   */
  readonly additionalRevisions?: WebFunctionRevisionWeight[];
}

/**
 * Internal: how `WebFunction` creates its endpoints. Not part of the public API.
 */
interface WebFunctionEndpointProps extends AddWebFunctionEndpointOptions {
  /** The function that owns the endpoint. */
  readonly webFunction: IWebFunction;

  /** The function's current revision, served unless `revision` is given. */
  readonly currentRevision: IWebFunctionRevision;

  /** Prefix of the generated endpoint name. */
  readonly namePrefix: string;

  /** Extra input to the generated name's hash (the construct ID of an added endpoint). */
  readonly nameSeed?: string;
}

/**
 * An HTTPS endpoint of a Web Function: `fn.endpoint` (the default one) or the result of `fn.addEndpoint()`.
 *
 * Endpoints are created only through `WebFunction`, which owns their log groups in every region, so the constructor is private.
 */
export class WebFunctionEndpoint extends Construct {
  /**
   * Creates an endpoint of a Web Function. Used by `WebFunction`.
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

  /** How callers of the endpoint are authenticated. */
  public readonly authType: WebFunctionAuthType;

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

  /** Grants on this endpoint (e.g. `grants.invoke(principal)`). */
  public readonly grants: WebFunctionGrants;

  private readonly homeRegion: string;
  private readonly webFunction: IWebFunction;
  private readonly resource: lambda.CfnWebFunctionEndpoint;
  private weights: lambda.CfnWebFunctionEndpoint.RevisionWeightProperty[];
  private routed = false;
  private readonly gradual: boolean;
  private lookup?: EndpointLookup;

  private constructor(scope: Construct, id: string, props: WebFunctionEndpointProps) {
    super(scope, id);

    const homeRegion = Stack.of(this).region;
    const endpointType = props.endpointType ?? WebFunctionEndpointType.HOME_REGION;
    const extraRegions = normaliseRegions(this, endpointType, homeRegion, props.regions ?? []);
    validateRateLimit(this, props.rateLimit);
    validateMaxEnvironments(this, props.maxEnvironments);

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
    this.authType = props.authType;
    this.endpointName = props.endpointName ?? defaultEndpointName(props.namePrefix, props.nameSeed, endpointType, extraRegions);
    this.regions = [homeRegion, ...extraRegions];
    this.homeRegion = homeRegion;
    this.webFunction = props.webFunction;
    this.weights = [{ revisionId: props.currentRevision.revisionId, weight: 100 }];

    const resource = new lambda.CfnWebFunctionEndpoint(this, 'Resource', {
      functionName: props.webFunction.webFunctionArn,
      endpointName: this.endpointName,
      endpointType,
      authType: props.authType,
      description: props.description,
      regions: extraRegions.length > 0 ? extraRegions : undefined,
      revisionWeights: this.weights,
      throttleConfig: props.rateLimit !== undefined ? { rateLimit: props.rateLimit } : undefined,
      scalingConfig: props.maxEnvironments !== undefined ? { maxEnvironments: props.maxEnvironments } : undefined,
    });
    Validations.of(resource).acknowledge(CFN_VALIDATE_UNKNOWN_TYPE);
    this.resource = resource;

    this.gradual = props.deployment?._gradual ?? false;
    if (props.deployment?._gradual) {
      if (props.revision !== undefined || props.additionalRevisions !== undefined) {
        throw new Error(`${this.node.path}: an endpoint with a ${props.deployment._kind} deployment always moves to the current revision; it can't also set revision or additionalRevisions`);
      }
      // Moves the traffic in steps before CloudFormation writes the endpoint, which then finds it already done.
      const shift = new TrafficShift(this, 'Deployment', {
        functionName: props.webFunction.webFunctionName,
        functionArn: props.webFunction.webFunctionArn,
        endpointName: this.endpointName,
        revisionId: props.currentRevision.revisionId,
        deployment: props.deployment,
        endpointConfig: {
          endpointType,
          authType: props.authType,
          description: props.description,
          regions: extraRegions,
          rateLimit: props.rateLimit,
          maxEnvironments: props.maxEnvironments,
        },
      });
      resource.node.addDependency(shift);
    }
    if (props.revision !== undefined || props.additionalRevisions !== undefined) {
      this.routeTraffic(props.revision ?? props.currentRevision, props.additionalRevisions);
    }

    this.endpointArn = resource.attrEndpointArn;
    this.domainName = resource.attrDomainName;
    this.url = `https://${resource.attrDomainName}`;
    this.grants = WebFunctionGrants._forEndpoint(this);
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
      functionName: this.webFunction.webFunctionName,
      functionArn: this.webFunction.webFunctionArn,
      endpointName: this.endpointName,
      endpointArn: this.endpointArn,
    });
    return `https://${this.lookup.regionalDomain(region)}`;
  }

  /**
   * Routes the endpoint to `revision` instead of the function's current revision, optionally sharing
   * traffic with one more revision (`additionalRevisions`, which gets its weight; `revision` gets the rest).
   *
   * Use it to keep an endpoint on an earlier revision (`WebFunctionRevision.fromRevisionAttributes`),
   * or to send part of the traffic to the current revision:
   * `fn.endpoint.routeTraffic(previous, [{ revision: fn.currentRevision, weight: 0.1 }])`.
   * Can be called once per endpoint, and not on one created with `revision` or `additionalRevisions`.
   */
  public routeTraffic(revision: IWebFunctionRevision, additionalRevisions?: WebFunctionRevisionWeight[]): void {
    if (this.gradual) {
      throw new Error(`${this.node.path}: the endpoint has a deployment in steps, which always moves it to the current revision; routeTraffic() can't be used with it`);
    }
    if (this.routed) {
      throw new Error(`${this.node.path}: the endpoint's revisions are already set (revision, additionalRevisions or routeTraffic)`);
    }
    this.weights = revisionWeights(this, this.webFunction, revision, additionalRevisions ?? []);
    this.resource.revisionWeights = this.weights;
    this.routed = true;
  }

  /**
   * The IDs of the revisions this endpoint routes to.
   *
   * @internal
   */
  public _revisionIds(): string[] {
    return this.weights.map((w) => w.revisionId);
  }

  /**
   * Allows `grantee` to call this endpoint. Shortcut for `grants.invoke(grantee)`.
   * [disable-awslint:no-grants]
   */
  public grantInvoke(grantee: iam.IGrantable): iam.Grant {
    return this.grants.invoke(grantee);
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

function validateRateLimit(scope: Construct, rateLimit: number | undefined): void {
  if (rateLimit === undefined || Token.isUnresolved(rateLimit)) return;
  const allowed = rateLimit === 0
    || (rateLimit >= 100 && rateLimit <= 1000 && rateLimit % 100 === 0)
    || (rateLimit >= 2000 && rateLimit <= 10000 && rateLimit % 1000 === 0);
  if (!allowed) {
    throw new Error(`${scope.node.path}: rateLimit must be 0, 100-1,000 in steps of 100, or 2,000-10,000 in steps of 1,000, got ${rateLimit}`);
  }
}

function validateMaxEnvironments(scope: Construct, maxEnvironments: number | undefined): void {
  if (maxEnvironments === undefined || Token.isUnresolved(maxEnvironments)) return;
  if (!Number.isInteger(maxEnvironments) || maxEnvironments < 2 || maxEnvironments > 10000) {
    throw new Error(`${scope.node.path}: maxEnvironments must be an integer from 2 to 10,000, got ${maxEnvironments}`);
  }
}

/** `primary` gets what `additional` leaves; weights are whole percentages summing to 100. */
function revisionWeights(
  scope: Construct,
  webFunction: IWebFunction,
  primary: IWebFunctionRevision,
  additional: WebFunctionRevisionWeight[],
): lambda.CfnWebFunctionEndpoint.RevisionWeightProperty[] {
  for (const r of [primary, ...additional.map((a) => a.revision)]) {
    if (r.webFunction !== webFunction) {
      throw new Error(`${scope.node.path}: revision ${r.revisionId} belongs to another function`);
    }
  }
  if (additional.length === 0) {
    return [{ revisionId: primary.revisionId, weight: 100 }];
  }
  if (additional.length > 1) {
    throw new Error(`${scope.node.path}: an endpoint routes to at most two revisions, so additionalRevisions takes one`);
  }
  const [{ revision, weight }] = additional;
  const percent = Math.round(weight * 100);
  if (Token.isUnresolved(weight) || Math.abs(weight * 100 - percent) > 1e-9 || percent < 1 || percent > 99) {
    throw new Error(`${scope.node.path}: an additional revision's weight must be a whole percentage from 0.01 to 0.99, got ${weight}`);
  }
  if (revision === primary || (!Token.isUnresolved(revision.revisionId) && revision.revisionId === primary.revisionId)) {
    throw new Error(`${scope.node.path}: the additional revision is the same as the endpoint's revision`);
  }
  return [{ revisionId: primary.revisionId, weight: 100 - percent }, { revisionId: revision.revisionId, weight: percent }];
}

/**
 * `<prefix>-<hash>`, with the hash covering the endpoint type and regions: a type or region change produces
 * a new name, so the replacement doesn't collide with the endpoint it replaces.
 */
function defaultEndpointName(prefix: string, seed: string | undefined, endpointType: WebFunctionEndpointType, extraRegions: string[]): string {
  const hash = createHash('sha256').update([...(seed !== undefined ? [seed] : []), endpointType, ...extraRegions].join(',')).digest('hex').slice(0, 8);
  return `${prefix}-${hash}`;
}
