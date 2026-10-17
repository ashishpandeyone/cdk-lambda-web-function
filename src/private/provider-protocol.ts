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

/**
 * Moves an endpoint's traffic to a revision in steps, watching alarms (canary and linear deployments).
 * Served by the deployment provider (`handlers/web-function-deployment`), not the shared provider: it can run for up to an hour.
 */
export const TRAFFIC_SHIFT_RESOURCE_TYPE = 'Custom::LambdaWebTrafficShift';

export interface TrafficShiftProperties {
  readonly FunctionArn: string;
  readonly EndpointName: string;
  /** The revision that ends up with all of the endpoint's traffic. */
  readonly RevisionId: string;
  /** The revision's share of traffic at each step, in percent, comma-separated; the last is 100. */
  readonly Steps: string;
  /** Seconds each step serves (counted from when its update started) before the next. */
  readonly WaitSeconds: string;
  /** Alarms (in any region) that stop the deployment and restore the previous weights. */
  readonly AlarmArns?: string[];
  /** Hash of the endpoint's other settings: any endpoint change re-checks its traffic before CloudFormation writes it. */
  readonly EndpointConfig: string;
}

/** What `onEvent` hands to `isComplete` (the Provider framework passes it as `Data`). */
export interface TrafficShiftState {
  /** `none`: nothing to do; `shift`: moving in steps; `switch`: all at once, without alarms (stack rollback). */
  readonly Action: 'none' | 'shift' | 'switch';
  /** `shift`: the endpoint's weights before the deployment (JSON `[{revisionId, weight}]`), restored when an alarm fires. */
  readonly PreviousWeights?: string;
  /** `switch`: the weights being written (JSON `[{revisionId, weight}]`). */
  readonly TargetWeights?: string;
}

/** Creates a CloudWatch metric alarm in any region (CloudFormation only creates alarms in the stack's region). */
/** Prefix of every alarm this library creates outside the stack's region; the provider's IAM is scoped to it. */
export const ALARM_NAME_PREFIX = 'LambdaWeb-';
export const REGIONAL_ALARM_RESOURCE_TYPE = 'Custom::LambdaWebAlarm';

export interface RegionalAlarmProperties {
  readonly Region: string;
  readonly AlarmName: string;
  readonly AlarmDescription: string;
  /** PutMetricAlarm's `Metrics`, as JSON. */
  readonly Metrics: string;
  readonly Threshold: string;
  readonly EvaluationPeriods: string;
  /** PutMetricAlarm's `ComparisonOperator`. */
  readonly ComparisonOperator: string;
  /** PutMetricAlarm's `TreatMissingData`. */
  readonly TreatMissingData: string;
}

/** Empties the stack's code bucket (every object version and delete marker) when the stack deletes it. */
export const CODE_BUCKET_CLEANUP_RESOURCE_TYPE = 'Custom::LambdaWebCodeBucketCleanup';

/**
 * Tag on the code bucket that lets the cleanup empty it. A rollback reverts the bucket's tags before it deletes
 * resources the failed update created, so a cleanup resource added to an existing bucket never empties it on rollback.
 */
export const EMPTY_ON_DELETE_TAG = { key: 'cdk-lambda-web:empty-on-delete', value: 'true' };

export interface CodeBucketCleanupProperties {
  readonly BucketName: string;
}

/**
 * Writes one stack's statements into a Web Function's resource policy, keeping every other writer's statements
 * (Web Functions have no AddPermission: the policy is a single document, so writers merge into it).
 */
export const RESOURCE_POLICY_STATEMENTS_RESOURCE_TYPE = 'Custom::LambdaWebResourcePolicyStatements';

export interface ResourcePolicyStatementsProperties {
  readonly FunctionArn: string;
  /** The statements this resource owns, each with a Sid unique in the function's policy. */
  readonly Policy: { readonly Statement: ReadonlyArray<{ readonly Sid: string; readonly [key: string]: unknown }> };
}
