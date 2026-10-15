import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import { handleCode } from './code';
import { handleEndpointLookup } from './endpoint-lookup';
import { handleLogGroup } from './log-group';
import { CODE_RESOURCE_TYPE, ENDPOINT_LOOKUP_RESOURCE_TYPE, LOG_GROUP_RESOURCE_TYPE } from '../../src/private/provider-protocol';

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
    default:
      throw new Error(`Unsupported resource type: ${event.ResourceType}`);
  }
}
