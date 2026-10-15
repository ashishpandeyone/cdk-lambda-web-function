/**
 * How callers of a Web Function endpoint are authenticated.
 */
export enum WebFunctionAuthType {
  /**
   * Requests must be signed with SigV4 or SigV4a (signing name `lambda`) by a principal
   * allowed `lambda:InvokeWebFunctionEndpoint` on the endpoint.
   */
  AWS_IAM = 'IamAuth',

  /**
   * No authentication by Lambda: the endpoint is public and your application authenticates
   * requests itself. The `Authorization` header reaches your application untouched.
   */
  NONE = 'ApplicationManaged',
}

/**
 * Where a Web Function endpoint serves traffic from.
 */
export enum WebFunctionEndpointType {
  /** One URL, served from the stack's region (the home region). */
  HOME_REGION = 'HomeRegion',

  /** One global URL, served from the nearest of the home region and `regions`. */
  MULTI_REGION = 'MultiRegion',

  /** One URL per region (the home region and each of `regions`). */
  PER_REGION = 'PerRegion',
}
