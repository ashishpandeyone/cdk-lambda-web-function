import * as iam from 'aws-cdk-lib/aws-iam';
import type { WebFunctionEndpoint } from './web-function-endpoint';

/**
 * Grants on a Web Function endpoint. Access them as `fn.grants` (the default endpoint) or `endpoint.grants`.
 */
export class WebFunctionGrants {
  /**
   * @internal
   */
  public static _forEndpoint(endpoint: WebFunctionEndpoint): WebFunctionGrants {
    return new WebFunctionGrants(() => [endpoint.endpointArn]);
  }

  /**
   * Grants on endpoints known only by ARN (an imported function's).
   *
   * @internal
   */
  public static _forEndpointArns(endpointArns: string[]): WebFunctionGrants {
    return new WebFunctionGrants(() => endpointArns);
  }

  private constructor(private readonly endpointArns: () => string[]) {}

  /**
   * Allows `grantee` to call the endpoint (`lambda:InvokeWebFunctionEndpoint`).
   *
   * The grant is on the endpoint's home-region ARN, which IAM evaluates for every region the
   * endpoint serves from, including a MULTI_REGION global URL.
   */
  public invoke(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipal({
      grantee,
      actions: ['lambda:InvokeWebFunctionEndpoint'],
      resourceArns: this.endpointArns(),
    });
  }
}
