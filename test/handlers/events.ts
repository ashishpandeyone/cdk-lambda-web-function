import type { CloudFormationCustomResourceEvent } from 'aws-lambda';

export function cfnEvent(
  requestType: 'Create' | 'Update' | 'Delete',
  resourceType: string,
  props: Record<string, unknown>,
  physicalResourceId = 'existing-id',
): CloudFormationCustomResourceEvent {
  const base = {
    ServiceToken: 'arn:aws:lambda:ap-south-1:111111111111:function:provider',
    ResponseURL: 'https://example.com',
    StackId: 'arn:aws:cloudformation:ap-south-1:111111111111:stack/s/1',
    RequestId: 'req',
    LogicalResourceId: 'Res',
    ResourceType: resourceType,
    ResourceProperties: { ServiceToken: 'token', ...props },
  };
  if (requestType === 'Create') return { ...base, RequestType: 'Create' } as CloudFormationCustomResourceEvent;
  if (requestType === 'Update') return { ...base, RequestType: 'Update', PhysicalResourceId: physicalResourceId, OldResourceProperties: {} } as CloudFormationCustomResourceEvent;
  return { ...base, RequestType: 'Delete', PhysicalResourceId: physicalResourceId } as CloudFormationCustomResourceEvent;
}
