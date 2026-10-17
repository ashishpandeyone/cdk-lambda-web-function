import * as iam from 'aws-cdk-lib/aws-iam';
import type { IWebFunction } from './web-function';
import type { WebFunctionEndpoint } from './web-function-endpoint';

/**
 * Grants on a Web Function endpoint. Access them as `fn.grants` (the default endpoint) or `endpoint.grants`.
 */
export class WebFunctionGrants {
  /**
   * @internal
   */
  public static _forEndpoint(endpoint: WebFunctionEndpoint, webFunction: IWebFunction): WebFunctionGrants {
    return new WebFunctionGrants(() => [endpoint.endpointArn], webFunction);
  }

  /**
   * Grants on endpoints known only by ARN (an imported function's).
   *
   * @internal
   */
  public static _forEndpointArns(endpointArns: string[], webFunction: IWebFunction): WebFunctionGrants {
    return new WebFunctionGrants(() => endpointArns, webFunction);
  }

  private constructor(private readonly endpointArns: () => string[], private readonly webFunction: IWebFunction) {}

  /**
   * Allows `grantee` to call the endpoint (`lambda:InvokeWebFunctionEndpoint`).
   *
   * The grant is on the endpoint's home-region ARN, which IAM evaluates for every region the
   * endpoint serves from, including a MULTI_REGION global URL.
   *
   * A grantee in the function's account gets an IAM policy statement. Another account or an AWS service also gets
   * a statement in the function's resource policy.
   */
  public invoke(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipalOrResource({
      grantee, actions: ['lambda:InvokeWebFunctionEndpoint'], resourceArns: this.endpointArns(), resource: this.webFunction,
    });
  }
}
