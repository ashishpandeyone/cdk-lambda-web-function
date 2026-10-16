import type { Duration } from 'aws-cdk-lib';

/** `WebFunctionRollbackOptions` with defaults applied. */
export interface ResolvedRollbackOptions {
  readonly serverErrorRate?: number;
  readonly clientErrorRate?: number;
  readonly minimumRequests: number;
  readonly period: Duration;
  readonly evaluationPeriods: number;
}
