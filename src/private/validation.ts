import { Token, type Acknowledgment } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

/**
 * The CloudFormation validation bundled with aws-cdk-lib predates the Lambda Web Functions
 * resource types and reports them as unknown (an error with
 * `@aws-cdk/core:validateAgainstDefaultRules`). Acknowledged on this library's own resources only.
 */
export const CFN_VALIDATE_UNKNOWN_TYPE: Acknowledgment = {
  id: 'CloudFormation-Validate::F3006',
  reason: 'AWS::Lambda::WebFunction* resource types are newer than the schemas bundled with aws-cdk-lib',
};

/** Function and endpoint names: 1-64 letters, digits, hyphens or underscores, not starting or ending with - or _. */
export function assertResourceName(scope: Construct, prop: string, name: string): void {
  if (Token.isUnresolved(name)) return;
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9_-]{0,62}[A-Za-z0-9])?$/.test(name)) {
    throw new Error(`${scope.node.path}: ${prop} '${name}' must be 1-64 letters, digits, hyphens or underscores, and can't start or end with a hyphen or underscore`);
  }
}
