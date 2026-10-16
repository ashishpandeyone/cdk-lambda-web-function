import * as path from 'node:path';
import { CustomResourceProvider, CustomResourceProviderRuntime, Duration, Size, Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

/**
 * The single custom resource provider (one Lambda per stack) behind code copies, log groups
 * and endpoint lookups. It's a core `CustomResourceProvider`, not a `lambda.Function`, so
 * tools that discover functions by class (e.g. cdk-watchful) don't pick it up.
 */
export function webFunctionProvider(scope: Construct): CustomResourceProvider {
  return CustomResourceProvider.getOrCreateProvider(scope, 'Custom::LambdaWebFunctionProvider', {
    codeDirectory: path.join(__dirname, '..', '..', 'assets', 'web-function-provider'),
    runtime: CustomResourceProviderRuntime.NODEJS_24_X,
    // Log group deletion waits for late flushes (75s + a re-check) on top of the API calls.
    timeout: Duration.minutes(5),
    memorySize: Size.mebibytes(256),
    description: 'Copies code, manages log groups, looks up endpoints and cleans up revisions for Lambda Web Functions',
  });
}

const granted = new WeakMap<CustomResourceProvider, Set<string>>();

/**
 * Adds a statement to the shared provider's role, once.
 *
 * Grants must be **stable across updates**: scoped by prefixes that don't change when a
 * resource is renamed or replaced. CloudFormation updates the role just before (and on rollback,
 * reverts it just before) the custom resources run, and IAM takes seconds to minutes to
 * propagate, so per-name grants fail with AccessDenied on renames and on rollback cleanup.
 * They must also never reference attributes of resources that use the provider (cycle).
 */
export function grantToProvider(provider: CustomResourceProvider, statement: { Action: string | string[]; Resource: string | string[] }): void {
  const key = JSON.stringify(Stack.of(provider).resolve(statement));
  let seen = granted.get(provider);
  if (!seen) {
    seen = new Set();
    granted.set(provider, seen);
  }
  if (seen.has(key)) return;
  seen.add(key);
  provider.addToRolePolicy({ Effect: 'Allow', ...statement });
}
