import * as path from 'node:path';
import { ArnFormat, CustomResourceProvider, CustomResourceProviderRuntime, Duration, Size, Stack } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { ALARM_NAME_PREFIX } from './provider-protocol';

/**
 * The single custom resource provider (one Lambda per stack) behind code copies, log groups,
 * endpoint lookups, revision cleanup and alarms in other regions. It's a core `CustomResourceProvider`,
 * not a `lambda.Function`, so tools that discover functions by class (e.g. cdk-watchful) don't pick it up.
 */
export function webFunctionProvider(scope: Construct): CustomResourceProvider {
  const provider = CustomResourceProvider.getOrCreateProvider(scope, 'Custom::LambdaWebFunctionProvider', {
    codeDirectory: path.join(__dirname, '..', '..', 'assets', 'web-function-provider'),
    runtime: CustomResourceProviderRuntime.NODEJS_24_X,
    // Log group deletion waits for late flushes (75s + a re-check) on top of the API calls.
    timeout: Duration.minutes(5),
    memorySize: Size.mebibytes(256),
    description: 'Copies code, manages log groups, looks up endpoints and cleans up revisions for Lambda Web Functions',
  });
  // Granted whether or not a stack has alarms in other regions yet: a grant added or removed together with the
  // alarm fails on IAM propagation, or leaves the alarm behind when it's removed (see grantToProvider).
  grantToProvider(provider, {
    Action: ['cloudwatch:PutMetricAlarm', 'cloudwatch:DeleteAlarms'],
    Resource: Stack.of(provider).formatArn({
      service: 'cloudwatch', region: '*', resource: 'alarm', resourceName: `${ALARM_NAME_PREFIX}*`, arnFormat: ArnFormat.COLON_RESOURCE_NAME,
    }),
  });
  return provider;
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
