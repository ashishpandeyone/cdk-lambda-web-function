import { DeleteWebFunctionRevisionCommand, LambdaWebClient, ListWebFunctionRevisionsCommand } from '@aws-sdk/client-lambda-web';
import { mockClient } from 'aws-sdk-client-mock';
import { cfnEvent } from './events';
import { handler } from '../../handlers/web-function-provider/index';
import { REVISION_CLEANUP_RESOURCE_TYPE } from '../../src/private/provider-protocol';

const web = mockClient(LambdaWebClient);
const FunctionArn = 'arn:aws:lambda:ap-south-1:111111111111:web-function/api';
const props = (keep: number, revisionIds: string[]) => ({ FunctionArn, Keep: String(keep), RevisionIds: revisionIds });
/** Revisions rev-1 (oldest) … rev-n (newest), listed in no particular order. */
const revisions = (n: number) => Array.from({ length: n }, (_, i) => ({ revisionId: `rev-${i + 1}`, createdAt: new Date(Date.UTC(2026, 9, 1, 0, i)) }))
  .sort(() => 0.5 - Math.random());
const deleted = () => web.commandCalls(DeleteWebFunctionRevisionCommand).map((c) => c.args[0].input.revisionId).sort();

beforeEach(() => {
  web.reset();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

test('keeps the newest revisions and deletes the older ones', async () => {
  web.on(ListWebFunctionRevisionsCommand).resolves({ revisions: revisions(6) as any });

  const res = await handler(cfnEvent('Create', REVISION_CLEANUP_RESOURCE_TYPE, props(3, ['rev-6'])));

  expect(deleted()).toEqual(['rev-1', 'rev-2', 'rev-3']);
  expect(res).toEqual({ PhysicalResourceId: `${FunctionArn}/revision-cleanup`, Data: { Deleted: '3' } });
  expect(web.commandCalls(DeleteWebFunctionRevisionCommand)[0].args[0].input.functionName).toBe(FunctionArn);
  expect(await web.call(0).thisValue.config.region()).toBe('ap-south-1');
});

test('never deletes revisions the current or the previous template uses (a rollback returns to them)', async () => {
  web.on(ListWebFunctionRevisionsCommand).resolves({ revisions: revisions(6) as any });
  const event = cfnEvent('Update', REVISION_CLEANUP_RESOURCE_TYPE, props(1, ['rev-6', 'rev-2']), `${FunctionArn}/revision-cleanup`);
  (event as any).OldResourceProperties = props(1, ['rev-5', 'rev-1']);

  await handler(event);

  expect(deleted()).toEqual(['rev-3', 'rev-4']);
});

test('skips revisions an endpoint routes to, and ones already gone', async () => {
  web.on(ListWebFunctionRevisionsCommand).resolves({ revisions: revisions(4) as any });
  web.on(DeleteWebFunctionRevisionCommand, { revisionId: 'rev-1' }).rejects(Object.assign(new Error('in use by [prod]'), { name: 'ConflictException' }));
  web.on(DeleteWebFunctionRevisionCommand, { revisionId: 'rev-2' }).rejects(Object.assign(new Error('gone'), { name: 'ResourceNotFoundException' }));

  const res = await handler(cfnEvent('Create', REVISION_CLEANUP_RESOURCE_TYPE, props(2, [])));

  expect(deleted()).toEqual(['rev-1', 'rev-2']);
  expect(res.Data).toEqual({ Deleted: '0' });
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"inUse":["rev-1"]'));
});

test('reads every page of revisions', async () => {
  const all = revisions(5).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  web.on(ListWebFunctionRevisionsCommand).resolvesOnce({ revisions: all.slice(0, 3) as any, nextToken: 't' }).resolvesOnce({ revisions: all.slice(3) as any });

  await handler(cfnEvent('Create', REVISION_CLEANUP_RESOURCE_TYPE, props(2, [])));

  expect(web.commandCalls(ListWebFunctionRevisionsCommand)).toHaveLength(2);
  expect(deleted()).toEqual(['rev-1', 'rev-2', 'rev-3']);
});

test('a failure only warns: cleanup never fails or rolls back a deployment', async () => {
  web.on(ListWebFunctionRevisionsCommand).resolves({ revisions: revisions(3) as any });
  web.on(DeleteWebFunctionRevisionCommand).rejects(Object.assign(new Error('not allowed'), { name: 'AccessDeniedException' }));

  const res = await handler(cfnEvent('Create', REVISION_CLEANUP_RESOURCE_TYPE, props(1, [])));

  expect(res.PhysicalResourceId).toBe(`${FunctionArn}/revision-cleanup`);
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('AccessDeniedException: not allowed'));
});

test('does nothing on delete (deleting the function deletes its revisions)', async () => {
  const res = await handler(cfnEvent('Delete', REVISION_CLEANUP_RESOURCE_TYPE, props(1, []), 'id'));

  expect(res).toEqual({ PhysicalResourceId: 'id' });
  expect(web.calls()).toHaveLength(0);
});
