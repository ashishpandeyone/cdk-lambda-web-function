/**
 * Contract between the constructs and the custom resource handler in
 * `handlers/web-function-provider`. Both sides import this file, so resource
 * types and property names can't drift apart.
 *
 * CloudFormation passes every scalar property to the handler as a string.
 */

/** Copies a code zip into the stack's code bucket and returns the object's version. */
export const CODE_RESOURCE_TYPE = 'Custom::LambdaWebCode';

export interface CodeProperties {
  readonly SourceBucket: string;
  readonly SourceKey: string;
  readonly SourceVersion?: string;
  readonly DestinationBucket: string;
  readonly DestinationKey: string;
}

export interface CodeAttributes {
  readonly VersionId: string;
}

/** Ensures one log group (in any region) exists with the given retention, and removes it on delete. */
export const LOG_GROUP_RESOURCE_TYPE = 'Custom::LambdaWebLogGroup';

export interface LogGroupProperties {
  readonly Region: string;
  readonly LogGroupName: string;
  /** Days, or 'Infinite' for no retention. */
  readonly RetentionInDays: string;
  readonly RemovalPolicy: 'retain' | 'destroy';
  /** Seconds to wait before deleting, so environments still shutting down can flush their last lines. */
  readonly FlushWaitSeconds: string;
  /** Seconds to wait before checking once more that the service hasn't re-created the group. */
  readonly RecheckWaitSeconds: string;
}

/** Reads an endpoint's per-region domain names, which CloudFormation can't index out of `RegionalEndpoints`. */
export const ENDPOINT_LOOKUP_RESOURCE_TYPE = 'Custom::LambdaWebEndpointLookup';

export interface EndpointLookupProperties {
  readonly FunctionArn: string;
  readonly EndpointName: string;
  /** Changes whenever the endpoint is replaced, so the lookup runs again. */
  readonly EndpointArn: string;
}

/** Attribute name holding the domain of one region, e.g. `Domain.us-east-1`. */
export function regionalDomainAttribute(region: string): string {
  return `Domain.${region}`;
}

/** Deletes a function's oldest revisions beyond a count, except those that are in use or may be rolled back to. */
export const REVISION_CLEANUP_RESOURCE_TYPE = 'Custom::LambdaWebRevisionCleanup';

export interface RevisionCleanupProperties {
  readonly FunctionArn: string;
  /** How many of the newest revisions to keep. */
  readonly Keep: string;
  /**
   * Revisions the template uses (the current one and any an endpoint routes to). Always kept, and on an update
   * the previous template's are kept too: they're what a rollback routes back to.
   */
  readonly RevisionIds: string[];
}
