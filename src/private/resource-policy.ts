/**
 * Checks on a Web Function's resource policy, run at synthesis on the resolved document.
 *
 * Lambda rejects a public policy at deploy time ("Lambda blocked the creation of this policy because it would grant
 * public access"): a `*` principal is only accepted when a trusted condition key pins the caller. A service principal
 * without a source condition is accepted, but lets any account's use of that service call the endpoint.
 */

/** Condition keys Lambda accepts to make a `*` principal non-public (Lambda Web Function permissions docs, 2026-10). */
const TRUSTED_KEYS = [
  'aws:PrincipalAccount', 'aws:PrincipalArn', 'aws:PrincipalOrgID', 'aws:PrincipalOrgPaths', 'aws:SourceAccount', 'aws:SourceArn',
  'aws:SourceOrgID', 'aws:SourceOrgPaths', 'aws:SourceVpc', 'aws:SourceVpcArn', 'aws:SourceVpce', 'aws:VpceAccount', 'aws:VpceOrgID',
  'aws:VpceOrgPaths', 'aws:Ec2InstanceSourceVpc', 'aws:UserId', 'aws:PrincipalServiceName', 'aws:PrincipalServiceNamesList',
  'aws:PrincipalIsAWSService', 'lambda:SourceFunctionArn',
].map((k) => k.toLowerCase());

/** Condition keys that tie a service principal to the resource or account calling on its behalf. */
const SOURCE_KEYS = ['aws:SourceArn', 'aws:SourceAccount', 'aws:SourceOrgID', 'aws:SourceOrgPaths'].map((k) => k.toLowerCase());

export interface ResourcePolicyFindings {
  /** Statements Lambda would reject as public. */
  readonly errors: string[];
  /** Service principals allowed without a source condition. */
  readonly unscopedServices: string[];
}

/** Inspects a resolved policy document (`{ Statement: [...] }`). */
export function inspectResourcePolicy(document: any): ResourcePolicyFindings {
  const errors: string[] = [];
  const unscopedServices: string[] = [];
  for (const [i, s] of (document?.Statement ?? []).entries()) {
    if (s.Effect !== 'Allow') continue;
    const keys = conditionKeys(s.Condition);
    const name = s.Sid ? `statement '${s.Sid}'` : `statement ${i + 1}`;
    if (isWildcard(s.Principal) && !keys.some((k) => TRUSTED_KEYS.includes(k))) {
      errors.push(`${name} allows principal '*': Lambda rejects public resource policies. Pin the caller with a condition such as aws:PrincipalOrgID or aws:SourceAccount (e.g. iam.OrganizationPrincipal), or name the accounts`);
    }
    const services = list(s.Principal?.Service).map(String);
    if (services.length > 0 && !keys.some((k) => SOURCE_KEYS.includes(k))) {
      unscopedServices.push(...services);
    }
  }
  return { errors, unscopedServices };
}

function isWildcard(principal: any): boolean {
  return principal === '*' || list(principal?.AWS).includes('*');
}

function conditionKeys(condition: any): string[] {
  return Object.values(condition ?? {}).flatMap((byKey: any) => Object.keys(byKey ?? {})).map((k) => k.toLowerCase());
}

function list(value: unknown): unknown[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}
