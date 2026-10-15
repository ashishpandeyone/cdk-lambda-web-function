import { GetWebFunctionEndpointCommand, LambdaWebClient } from '@aws-sdk/client-lambda-web';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import type { HandlerResponse } from './index';
import { regionalDomainAttribute, type EndpointLookupProperties } from '../../src/private/provider-protocol';

/**
 * Returns every regional domain of an endpoint as `Domain.<region>` attributes.
 * CloudFormation exposes them only inside the `RegionalEndpoints` map, which templates
 * can't index by key.
 */
export async function handleEndpointLookup(event: CloudFormationCustomResourceEvent): Promise<HandlerResponse> {
  const props = event.ResourceProperties as unknown as EndpointLookupProperties;
  if (event.RequestType === 'Delete') {
    return { PhysicalResourceId: event.PhysicalResourceId };
  }

  const homeRegion = props.FunctionArn.split(':')[3];
  const web = new LambdaWebClient({ region: homeRegion });
  const endpoint = await web.send(new GetWebFunctionEndpointCommand({ functionName: props.FunctionArn, endpointName: props.EndpointName }));

  const data: Record<string, string> = {};
  for (const [region, regional] of Object.entries(endpoint.regionalEndpoints ?? {})) {
    if (regional.domainName) data[regionalDomainAttribute(region)] = regional.domainName;
  }
  return { PhysicalResourceId: props.EndpointArn, Data: data };
}
