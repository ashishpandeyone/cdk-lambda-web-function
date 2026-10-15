import { ArnFormat, CustomResource, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { grantToProvider, webFunctionProvider } from './provider';
import { ENDPOINT_LOOKUP_RESOURCE_TYPE, regionalDomainAttribute, type EndpointLookupProperties } from './provider-protocol';

export interface EndpointLookupProps {
  /** Literal function name: the provider's IAM must not reference attributes of resources that use the provider (dependency cycle). */
  readonly functionName: string;
  readonly functionArn: string;
  readonly endpointName: string;
  readonly endpointArn: string;
}

/** Reads an endpoint's per-region domains (CloudFormation can't index the RegionalEndpoints map). */
export class EndpointLookup extends Construct {
  private readonly resource: CustomResource;

  constructor(scope: Construct, id: string, props: EndpointLookupProps) {
    super(scope, id);
    const provider = webFunctionProvider(this);
    // Stable grant (see grantToProvider): every endpoint of the function, since endpoint names change with type/regions.
    const endpointsArn = Stack.of(this).formatArn({
      service: 'lambda', resource: 'web-function', resourceName: `${props.functionName}/endpoint/*`, arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });
    grantToProvider(provider, { Action: 'lambda:GetWebFunctionEndpoint', Resource: endpointsArn });

    const properties: EndpointLookupProperties = {
      FunctionArn: props.functionArn,
      EndpointName: props.endpointName,
      EndpointArn: props.endpointArn,
    };
    this.resource = new CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      resourceType: ENDPOINT_LOOKUP_RESOURCE_TYPE,
      properties: { ...properties },
    });
  }

  /** The endpoint's domain in `region`. */
  public regionalDomain(region: string): string {
    return this.resource.getAttString(regionalDomainAttribute(region));
  }
}
