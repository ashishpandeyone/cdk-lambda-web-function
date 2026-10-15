import * as iam from 'aws-cdk-lib/aws-iam';
import type { WebFunctionEndpoint } from './web-function-endpoint';

/**
 * Grants on a Web Function. Access it as `fn.grants`.
 */
export class WebFunctionGrants {
  /**
   * @internal
   */
  public static _forEndpoint(endpoint: WebFunctionEndpoint): WebFunctionGrants {
    return new WebFunctionGrants(endpoint);
  }

  private constructor(private readonly endpoint: WebFunctionEndpoint) {}

  /**
   * Allows `grantee` to call the function's endpoint (`lambda:InvokeWebFunctionEndpoint`).
   *
   * The grant is on the endpoint's home-region ARN, which IAM evaluates for every region the
   * endpoint serves from, including a MULTI_REGION global URL.
   */
  public invoke(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipal({
      grantee,
      actions: ['lambda:InvokeWebFunctionEndpoint'],
      resourceArns: [this.endpoint.endpointArn],
    });
  }
}
