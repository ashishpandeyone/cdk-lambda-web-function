import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import { handleRegionalAlarm } from './alarm';
import { handleCode } from './code';
import { handleCodeBucketCleanup } from './code-bucket-cleanup';
import { handleEndpointLookup } from './endpoint-lookup';
import { handleLogGroup } from './log-group';
import { handleResourcePolicyStatements } from './resource-policy';
import { handleRevisionCleanup } from './revision-cleanup';
import {
  CODE_BUCKET_CLEANUP_RESOURCE_TYPE, CODE_RESOURCE_TYPE, ENDPOINT_LOOKUP_RESOURCE_TYPE, LOG_GROUP_RESOURCE_TYPE, REGIONAL_ALARM_RESOURCE_TYPE,
  RESOURCE_POLICY_STATEMENTS_RESOURCE_TYPE, REVISION_CLEANUP_RESOURCE_TYPE,
} from '../../src/private/provider-protocol';

export interface HandlerResponse {
  readonly PhysicalResourceId: string;
  readonly Data?: Record<string, string>;
}

/** Entry point, wrapped by aws-cdk-lib's custom resource provider (which sends the CloudFormation response). */
export async function handler(event: CloudFormationCustomResourceEvent): Promise<HandlerResponse> {
  switch (event.ResourceType) {
    case CODE_RESOURCE_TYPE:
      return handleCode(event);
    case LOG_GROUP_RESOURCE_TYPE:
      return handleLogGroup(event);
    case ENDPOINT_LOOKUP_RESOURCE_TYPE:
      return handleEndpointLookup(event);
    case REVISION_CLEANUP_RESOURCE_TYPE:
      return handleRevisionCleanup(event);
    case REGIONAL_ALARM_RESOURCE_TYPE:
      return handleRegionalAlarm(event);
    case CODE_BUCKET_CLEANUP_RESOURCE_TYPE:
      return handleCodeBucketCleanup(event);
    case RESOURCE_POLICY_STATEMENTS_RESOURCE_TYPE:
      return handleResourcePolicyStatements(event);
    default:
      // A rollback to an earlier version of this handler deletes resource types that only a newer version created.
      // Nothing was created for them here, so the delete succeeds instead of failing (and being retried) for minutes.
      if (event.RequestType === 'Delete') {
        console.log(JSON.stringify({ msg: 'delete of an unknown resource type ignored', resourceType: event.ResourceType }));
        return { PhysicalResourceId: event.PhysicalResourceId };
      }
      throw new Error(`Unsupported resource type: ${event.ResourceType}`);
  }
}
