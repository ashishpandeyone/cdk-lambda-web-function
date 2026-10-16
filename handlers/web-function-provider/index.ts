import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import { handleRegionalAlarm } from './alarm';
import { handleCode } from './code';
import { handleCodeBucketCleanup } from './code-bucket-cleanup';
import { handleEndpointLookup } from './endpoint-lookup';
import { handleLogGroup } from './log-group';
import { handleRevisionCleanup } from './revision-cleanup';
import { CODE_BUCKET_CLEANUP_RESOURCE_TYPE, CODE_RESOURCE_TYPE, ENDPOINT_LOOKUP_RESOURCE_TYPE, LOG_GROUP_RESOURCE_TYPE, REGIONAL_ALARM_RESOURCE_TYPE, REVISION_CLEANUP_RESOURCE_TYPE } from '../../src/private/provider-protocol';

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
    default:
      throw new Error(`Unsupported resource type: ${event.ResourceType}`);
  }
}
