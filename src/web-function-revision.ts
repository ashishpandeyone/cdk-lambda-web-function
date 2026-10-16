import type * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct, type IConstruct } from 'constructs';

/**
 * A revision of a Web Function: an immutable snapshot of its code and configuration.
 */
export interface IWebFunctionRevision extends IConstruct {
  /** The revision's ID, e.g. `rev-a1b2c`. */
  readonly revisionId: string;

  /** The revision's ARN. */
  readonly revisionArn: string;

  /** The function the revision belongs to. */
  readonly webFunction: lambda.IWebFunctionRef;
}

/**
 * Attributes of an existing revision.
 */
export interface WebFunctionRevisionAttributes {
  /** The function the revision belongs to. */
  readonly webFunction: lambda.IWebFunctionRef;

  /** The revision's ID, e.g. `rev-a1b2c` (the `revisionId` of an earlier deployment). */
  readonly revisionId: string;
}

/**
 * A revision of a Web Function.
 *
 * `WebFunction` creates its current revision (`fn.currentRevision`) from its code and configuration.
 * Use `fromRevisionAttributes` to route an endpoint to an earlier one, which must still exist:
 * only revisions within `revisionRetention`, or that an endpoint routes to, are kept.
 */
export class WebFunctionRevision extends Construct implements IWebFunctionRevision {
  /**
   * References an existing revision of `webFunction`, e.g. to pin an endpoint to it or split traffic with it.
   */
  public static fromRevisionAttributes(scope: Construct, id: string, attrs: WebFunctionRevisionAttributes): IWebFunctionRevision {
    return new WebFunctionRevision(scope, id, attrs.webFunction, attrs.revisionId, `${attrs.webFunction.webFunctionRef.functionArn}/revision/${attrs.revisionId}`);
  }

  /**
   * The revision `WebFunction` creates.
   *
   * @internal
   */
  public static _current(
    scope: Construct, id: string, webFunction: lambda.IWebFunctionRef, revisionId: string, revisionArn: string,
  ): WebFunctionRevision {
    return new WebFunctionRevision(scope, id, webFunction, revisionId, revisionArn);
  }

  public readonly webFunction: lambda.IWebFunctionRef;
  public readonly revisionId: string;
  public readonly revisionArn: string;

  private constructor(scope: Construct, id: string, webFunction: lambda.IWebFunctionRef, revisionId: string, revisionArn: string) {
    super(scope, id);
    this.webFunction = webFunction;
    this.revisionId = revisionId;
    this.revisionArn = revisionArn;
  }
}
