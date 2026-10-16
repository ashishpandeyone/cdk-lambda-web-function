import { DeleteWebFunctionRevisionCommand, LambdaWebClient, paginateListWebFunctionRevisions, type FunctionRevisionSummary } from '@aws-sdk/client-lambda-web';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import type { HandlerResponse } from './index';
import type { RevisionCleanupProperties } from '../../src/private/provider-protocol';

/**
 * Keeps the newest `Keep` revisions of a function and deletes older ones.
 *
 * Never deleted: revisions the current or previous template uses (a rollback routes back to the previous ones),
 * and revisions any endpoint routes to (the service rejects those with ConflictException). Lambda's own cleanup
 * past 50 revisions may delete some first, so missing revisions are fine.
 *
 * A failed cleanup only logs a warning: it must never fail or roll back a deployment.
 */
export async function handleRevisionCleanup(event: CloudFormationCustomResourceEvent): Promise<HandlerResponse> {
  const props = event.ResourceProperties as unknown as RevisionCleanupProperties;
  const physicalResourceId = `${props.FunctionArn}/revision-cleanup`;
  // Deleting the function deletes its revisions.
  if (event.RequestType === 'Delete') {
    return { PhysicalResourceId: event.PhysicalResourceId };
  }

  const previous = event.RequestType === 'Update' ? (event.OldResourceProperties as unknown as RevisionCleanupProperties).RevisionIds ?? [] : [];
  const kept = new Set([...(props.RevisionIds ?? []), ...previous]);
  const deleted: string[] = [];
  const inUse: string[] = [];
  try {
    const web = new LambdaWebClient({ region: props.FunctionArn.split(':')[3] });
    const revisions: FunctionRevisionSummary[] = [];
    for await (const page of paginateListWebFunctionRevisions({ client: web }, { functionName: props.FunctionArn })) {
      revisions.push(...(page.revisions ?? []));
    }
    revisions.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

    for (const revision of revisions.slice(Number(props.Keep))) {
      const revisionId = revision.revisionId!;
      if (kept.has(revisionId)) continue;
      try {
        await web.send(new DeleteWebFunctionRevisionCommand({ functionName: props.FunctionArn, revisionId }));
        deleted.push(revisionId);
      } catch (e) {
        const name = (e as Error).name;
        if (name === 'ConflictException') inUse.push(revisionId);
        else if (name !== 'ResourceNotFoundException') throw e;
      }
    }
    console.log(JSON.stringify({ msg: 'revision cleanup', total: revisions.length, keep: Number(props.Keep), deleted, inUse }));
  } catch (e) {
    console.warn(JSON.stringify({ msg: 'revision cleanup failed; old revisions are left in place', error: `${(e as Error).name}: ${(e as Error).message}`, deleted }));
  }
  return { PhysicalResourceId: physicalResourceId, Data: { Deleted: String(deleted.length) } };
}
