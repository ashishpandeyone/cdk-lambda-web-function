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
  public static _forEndpointArns(endpointArns: string[]): WebFunctionGrants {
    return new WebFunctionGrants(() => endpointArns);
  }

  private constructor(private readonly endpointArns: () => string[], private readonly webFunction?: IWebFunction) {}

  /**
   * Allows `grantee` to call the endpoint (`lambda:InvokeWebFunctionEndpoint`).
   *
   * The grant is on the endpoint's home-region ARN, which IAM evaluates for every region the
   * endpoint serves from, including a MULTI_REGION global URL.
   *
   * A grantee in the function's account gets an IAM policy statement. Another account or an AWS service also gets
   * a statement in the function's resource policy (not for an imported function's endpoints).
   */
  public invoke(grantee: iam.IGrantable): iam.Grant {
    const options = { grantee, actions: ['lambda:InvokeWebFunctionEndpoint'], resourceArns: this.endpointArns() };
    return this.webFunction
      ? iam.Grant.addToPrincipalOrResource({ ...options, resource: this.webFunction })
      : iam.Grant.addToPrincipal(options);
  }
}
