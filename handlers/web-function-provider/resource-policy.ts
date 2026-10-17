import {
  DeleteResourcePolicyCommand, GetResourcePolicyCommand, LambdaWebClient, PutResourcePolicyCommand,
} from '@aws-sdk/client-lambda-web';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import type { HandlerResponse } from './index';
import type { ResourcePolicyStatementsProperties } from '../../src/private/provider-protocol';

/** Waits between attempts: a write another writer got in first, and IAM propagation of the provider's grant. */
export const retry = { conflictDelaySeconds: 2, conflictAttempts: 10, accessDeniedDelaySeconds: 15, accessDeniedAttempts: 8 };

/** PutResourcePolicy's limit on the policy document. */
const MAX_POLICY_LENGTH = 20480;

type Statement = Record<string, unknown> & { Sid?: string };

/**
 * Writes one stack's statements into a Web Function's resource policy. The policy is a single document (Web Functions
 * have no AddPermission), so this reads it, replaces only the statements this resource owns (by Sid), and writes it
 * back conditioned on the revision it read, retrying when another writer got in first. Statements added by other
 * stacks or outside CloudFormation are kept.
 *
 * Physical id = `<function arn>/statements/<logical id>`: a new function is a replacement, and CloudFormation then
 * removes the statements from the old function with the old resource's Delete.
 */
export async function handleResourcePolicyStatements(event: CloudFormationCustomResourceEvent): Promise<HandlerResponse> {
  const props = event.ResourceProperties as unknown as ResourcePolicyStatementsProperties;
  if (event.RequestType === 'Delete') {
    await write(props.FunctionArn, sidsOf(props), [], false);
    return { PhysicalResourceId: event.PhysicalResourceId };
  }
  const old = event.RequestType === 'Update' ? event.OldResourceProperties as unknown as ResourcePolicyStatementsProperties : undefined;
  const sameFunction = old !== undefined && old.FunctionArn === props.FunctionArn;
  // A statement that was already there before this resource existed, with exactly our content, is taken over rather
  // than duplicated: e.g. the ones the AWS::Lambda::ResourcePolicy of versions 0.1.5-0.1.6 wrote, kept with RETAIN.
  await write(props.FunctionArn, sameFunction ? sidsOf(old) : new Set(), [...props.Policy.Statement], !sameFunction);
  return { PhysicalResourceId: `${props.FunctionArn}/statements/${event.LogicalResourceId}` };
}

async function write(functionArn: string, owned: Set<string>, ours: Statement[], adoptUnnamed: boolean): Promise<void> {
  const web = new LambdaWebClient({ region: functionArn.split(':')[3] });
  const oursBySid = new Map(ours.map((s) => [s.Sid!, s]));
  for (let attempt = 1; ; attempt++) {
    const current = await withAccess(() => read(web, functionArn));
    const kept: Statement[] = [];
    for (const statement of current?.statements ?? []) {
      const sid = statement.Sid;
      if (sid !== undefined && owned.has(sid)) continue;
      if (sid !== undefined && oursBySid.has(sid)) {
        if (same(statement, oursBySid.get(sid)!)) continue;
        throw new Error(`The resource policy of ${functionArn} already has a statement with Sid '${sid}' that another stack or tool added. Use another id (addPermission) or remove that statement.`);
      }
      if (sid === undefined && adoptUnnamed && ours.some((s) => same(statement, withoutSid(s)))) continue;
      kept.push(statement);
    }

    const next = [...kept, ...ours];
    try {
      if (next.length === 0) {
        if (current !== undefined) {
          await withAccess(() => web.send(new DeleteResourcePolicyCommand({ resourceArn: functionArn, revisionId: current.revisionId })));
        }
      } else {
        const policy = JSON.stringify({ Version: '2012-10-17', Statement: next });
        if (policy.length > MAX_POLICY_LENGTH) {
          throw new Error(`The resource policy of ${functionArn} would be ${policy.length} characters, over Lambda's limit of ${MAX_POLICY_LENGTH}`);
        }
        // Without a policy there's no revision to condition on: creating is unconditional, so check it afterwards.
        await withAccess(() => web.send(new PutResourcePolicyCommand({ resourceArn: functionArn, policy, revisionId: current?.revisionId })));
        if (current === undefined && !(await hasAll(web, functionArn, ours))) throw conflict('another writer created the policy at the same time');
      }
      console.log(JSON.stringify({ msg: 'resource policy written', functionArn, removed: [...owned], written: ours.map((s) => s.Sid), kept: kept.length }));
      return;
    } catch (e) {
      const name = (e as Error).name;
      if (name === 'ResourceNotFoundException' && ours.length === 0) return; // the function (or its policy) is gone
      if (name !== 'ConflictException' || attempt >= retry.conflictAttempts) throw e;
      await sleep(retry.conflictDelaySeconds * attempt);
    }
  }
}

async function read(web: LambdaWebClient, functionArn: string): Promise<{ statements: Statement[]; revisionId: string } | undefined> {
  try {
    const r = await web.send(new GetResourcePolicyCommand({ resourceArn: functionArn }));
    return { statements: JSON.parse(r.policy!).Statement ?? [], revisionId: r.revisionId! };
  } catch (e) {
    // No policy yet, or no function (a Delete after the function was deleted).
    if ((e as Error).name === 'ResourceNotFoundException') return undefined;
    throw e;
  }
}

async function hasAll(web: LambdaWebClient, functionArn: string, ours: Statement[]): Promise<boolean> {
  const sids = new Set((await read(web, functionArn))?.statements.map((s) => s.Sid));
  return ours.every((s) => sids.has(s.Sid));
}

/** The provider's grant can arrive in the same deployment as the first statement writer, and IAM takes a while. */
async function withAccess<T>(call: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (e) {
      if (!/AccessDenied/.test((e as Error).name) || attempt >= retry.accessDeniedAttempts) throw e;
      await sleep(retry.accessDeniedDelaySeconds);
    }
  }
}

function sidsOf(props: ResourcePolicyStatementsProperties): Set<string> {
  return new Set((props.Policy?.Statement ?? []).map((s) => s.Sid));
}

function withoutSid(statement: Statement): Statement {
  const { Sid: _, ...rest } = statement;
  return rest;
}

/** Equal as policy statements: key order, one-element lists and list order don't matter. */
function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(canonical).sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)));
    return items.length === 1 ? items[0] : items;
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical((value as Record<string, unknown>)[k])]));
  }
  return value === undefined ? value : String(value);
}

function conflict(message: string): Error {
  return Object.assign(new Error(message), { name: 'ConflictException' });
}

const sleep = (seconds: number) => new Promise((r) => setTimeout(r, seconds * 1000));
