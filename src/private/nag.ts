import { CfnResource, Stack, Validations } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { IConstruct } from 'constructs';

/**
 * Acknowledges cdk-nag AwsSolutions findings on resources this library creates, so teams that run cdk-nag don't have
 * to acknowledge our internals. Written for both major versions, without depending on cdk-nag:
 * - cdk-nag 3 reads CDK's `Validations.of(resource).acknowledge()`, one id per finding (`AwsSolutions::<rule>[<finding>]`);
 * - cdk-nag 2 reads `cdk_nag` metadata, where a rule without `applies_to` covers all its findings.
 */
export function acknowledgeNagRules(resource: CfnResource, rules: string[], reason: string): void {
  for (const rule of rules) Validations.of(resource).acknowledge({ id: `AwsSolutions::${rule}`, reason });
  addV2Suppressions(resource, rules, reason);
}

/**
 * Acknowledges the IAM findings of a role or policy whose permissions are all this library's: wildcards (IAM5) and,
 * with `managedPolicies`, AWS managed policies (IAM4). Finding ids depend on the resolved policy (logical IDs, the
 * stack's environment), so they're computed when the app is synthesized.
 */
export function acknowledgeIamFindings(resource: CfnResource, reason: string, options: { managedPolicies?: boolean } = {}): void {
  addV2Suppressions(resource, ['AwsSolutions-IAM5', ...(options.managedPolicies ? ['AwsSolutions-IAM4'] : [])], reason);
  resource.node.addValidation({
    validate: () => {
      for (const finding of iamFindings(resource, options.managedPolicies ?? false)) {
        Validations.of(resource).acknowledge({ id: `AwsSolutions::${finding}`, reason });
      }
      return [];
    },
  });
}

/** Acknowledges IAM findings on every role and policy under `scope`, and the given rules on matching resources. */
export function acknowledgeNagUnder(scope: IConstruct, reason: string, rulesByType: Record<string, string[]> = {}): void {
  for (const child of scope.node.findAll()) {
    if (!CfnResource.isCfnResource(child)) continue;
    if (child instanceof iam.CfnRole || child instanceof iam.CfnPolicy) acknowledgeIamFindings(child, reason, { managedPolicies: true });
    const rules = rulesByType[child.cfnResourceType];
    if (rules) acknowledgeNagRules(child, rules, reason);
  }
}

function iamFindings(resource: CfnResource, managedPolicies: boolean): string[] {
  const stack = Stack.of(resource);
  const documents: any[] = [];
  const findings: string[] = [];
  if (resource instanceof iam.CfnPolicy) {
    documents.push(stack.resolve(resource.policyDocument));
  } else if (resource instanceof iam.CfnRole) {
    for (const policy of stack.resolve(resource.policies) ?? []) documents.push(stack.resolve(stack.resolve(policy).policyDocument));
    if (managedPolicies) {
      for (const arn of stack.resolve(resource.managedPolicyArns) ?? []) findings.push(`AwsSolutions-IAM4[Policy::${flatten(arn)}]`);
    }
  }
  for (const document of documents) {
    for (const statement of document?.Statement ?? []) {
      if (statement.Effect !== 'Allow') continue;
      for (const action of list(statement.Action)) if (String(action).includes('*')) findings.push(`AwsSolutions-IAM5[Action::${action}]`);
      for (const r of list(statement.Resource)) {
        const flat = flatten(r);
        if (flat.includes('*')) findings.push(`AwsSolutions-IAM5[Resource::${flat}]`);
      }
    }
  }
  return [...new Set(findings)];
}

/** cdk-nag's own flattening of CloudFormation references in finding ids (`utils/flatten-cfn-reference`). */
function flatten(node: any): string {
  if (node === undefined) return '';
  if (typeof node === 'string') return node.replace(/\$\{/g, '<').replace(/}/g, '>');
  if (node['Fn::Join']) {
    const [delimiter, items] = node['Fn::Join'];
    return items.map(flatten).join(delimiter);
  }
  if (node['Fn::Sub']) return flatten(node['Fn::Sub']);
  if (node['Fn::GetAtt']) return `<${flatten(node['Fn::GetAtt'][0])}.${flatten(node['Fn::GetAtt'][1])}>`;
  if (node['Fn::ImportValue']) return flatten(node['Fn::ImportValue']);
  if (node.Ref) return `<${flatten(node.Ref)}>`;
  return JSON.stringify(node);
}

function addV2Suppressions(resource: CfnResource, rules: string[], reason: string): void {
  const existing = (resource.getMetadata('cdk_nag') as { rules_to_suppress?: { id: string; reason: string }[] } | undefined)?.rules_to_suppress ?? [];
  const ids = new Set(existing.map((r) => r.id));
  resource.addMetadata('cdk_nag', { rules_to_suppress: [...existing, ...rules.filter((id) => !ids.has(id)).map((id) => ({ id, reason }))] });
}

function list(value: unknown): unknown[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}
