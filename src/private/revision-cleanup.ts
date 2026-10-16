import { ArnFormat, CustomResource, Lazy, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { grantToProvider, webFunctionProvider } from './provider';
import { REVISION_CLEANUP_RESOURCE_TYPE, type RevisionCleanupProperties } from './provider-protocol';

export interface RevisionCleanupProps {
  /** Literal function name: the provider's IAM must not reference attributes of resources that use the provider (dependency cycle). */
  readonly functionName: string;
  readonly functionArn: string;
  /** How many of the newest revisions to keep. */
  readonly keep: number;
  /** Revisions the template uses, read when the template is synthesized (endpoints can be added later). */
  readonly revisionIds: () => string[];
}

/**
 * Deletes a function's oldest revisions beyond `keep` on every deployment. Runs after the endpoints
 * (add them as dependencies), so the revisions they just stopped routing to are eligible.
 */
export class RevisionCleanup extends Construct {
  public readonly resource: CustomResource;

  constructor(scope: Construct, id: string, props: RevisionCleanupProps) {
    super(scope, id);
    const provider = webFunctionProvider(this);
    // Stable grant (see grantToProvider): the function and its revisions, by name.
    const functionArn = Stack.of(this).formatArn({
      service: 'lambda', resource: 'web-function', resourceName: props.functionName, arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });
    grantToProvider(provider, {
      Action: ['lambda:ListWebFunctionRevisions', 'lambda:DeleteWebFunctionRevision'],
      Resource: [functionArn, `${functionArn}/revision/*`],
    });

    const properties: RevisionCleanupProperties = {
      FunctionArn: props.functionArn,
      Keep: String(props.keep),
      RevisionIds: Lazy.list({ produce: () => [...new Set(props.revisionIds())] }),
    };
    this.resource = new CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      resourceType: REVISION_CLEANUP_RESOURCE_TYPE,
      properties: { ...properties },
    });
  }
}
