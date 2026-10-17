import { DeleteResourcePolicyCommand, GetResourcePolicyCommand, LambdaWebClient, PutResourcePolicyCommand } from '@aws-sdk/client-lambda-web';
import { mockClient } from 'aws-sdk-client-mock';
import { cfnEvent } from './events';
import { handler } from '../../handlers/web-function-provider/index';
import { retry } from '../../handlers/web-function-provider/resource-policy';
import { RESOURCE_POLICY_STATEMENTS_RESOURCE_TYPE as TYPE } from '../../src/private/provider-protocol';

const web = mockClient(LambdaWebClient);
const FunctionArn = 'arn:aws:lambda:us-east-1:111111111111:web-function/api';
const statement = (Sid: string | undefined, account: string) => ({
  ...(Sid ? { Sid } : {}),
  Effect: 'Allow',
  Principal: { AWS: `arn:aws:iam::${account}:root` },
  Action: 'lambda:InvokeWebFunctionEndpoint',
  Resource: `${FunctionArn}/endpoint/*`,
});
const props = (...statements: object[]) => ({ FunctionArn, Policy: { Version: '2012-10-17', Statement: statements } });
const policy = (...statements: object[]) => JSON.stringify({ Version: '2012-10-17', Statement: statements });
const notFound = () => Object.assign(new Error('no policy'), { name: 'ResourceNotFoundException' });
const conflict = () => Object.assign(new Error('updated by another request'), { name: 'ConflictException' });
const puts = () => web.commandCalls(PutResourcePolicyCommand).map((c) => ({ ...c.args[0].input, policy: JSON.parse(c.args[0].input.policy!) }));
const sids = (put: { policy: { Statement: { Sid?: string }[] } }) => put.policy.Statement.map((s) => s.Sid ?? '(none)');

beforeEach(() => {
  web.reset();
  Object.assign(retry, { conflictDelaySeconds: 0, accessDeniedDelaySeconds: 0 });
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('creates the policy when there is none (unconditionally, then checks), in the function\'s region', async () => {
  web.on(GetResourcePolicyCommand).rejectsOnce(notFound()).resolves({ policy: policy(statement('Mine', '222222222222')), revisionId: 'r2' });
  web.on(PutResourcePolicyCommand).resolves({ revisionId: 'r2' });

  const res = await handler(cfnEvent('Create', TYPE, props(statement('Mine', '222222222222'))));

  expect(puts()).toEqual([{ resourceArn: FunctionArn, revisionId: undefined, policy: { Version: '2012-10-17', Statement: [statement('Mine', '222222222222')] } }]);
  expect(res).toEqual({ PhysicalResourceId: `${FunctionArn}/statements/Res` });
  expect(await web.call(0).thisValue.config.region()).toBe('us-east-1');
});

test('keeps statements other stacks or tools added, and writes on the revision it read', async () => {
  web.on(GetResourcePolicyCommand).resolves({ policy: policy(statement('Theirs', '333333333333')), revisionId: 'r1' });
  web.on(PutResourcePolicyCommand).resolves({ revisionId: 'r2' });

  await handler(cfnEvent('Create', TYPE, props(statement('Mine', '222222222222'))));

  expect(puts()).toHaveLength(1);
  expect(puts()[0].revisionId).toBe('r1');
  expect(sids(puts()[0])).toEqual(['Theirs', 'Mine']);
});

test('an update replaces only the statements this resource wrote before', async () => {
  web.on(GetResourcePolicyCommand).resolves({ policy: policy(statement('Theirs', '333333333333'), statement('Old', '222222222222')), revisionId: 'r1' });
  web.on(PutResourcePolicyCommand).resolves({ revisionId: 'r2' });
  const event = cfnEvent('Update', TYPE, props(statement('New', '444444444444')), `${FunctionArn}/statements/Res`);
  (event as any).OldResourceProperties = props(statement('Old', '222222222222'));

  await handler(event);

  expect(sids(puts()[0])).toEqual(['Theirs', 'New']);
});

test('an update to another function only adds there: the old resource\'s Delete cleans up the old function', async () => {
  const other = 'arn:aws:lambda:us-east-1:111111111111:web-function/other';
  web.on(GetResourcePolicyCommand).resolves({ policy: policy(statement('Old', '222222222222')), revisionId: 'r1' });
  web.on(PutResourcePolicyCommand).resolves({ revisionId: 'r2' });
  const event = cfnEvent('Update', TYPE, { ...props(statement('Old', '222222222222')), FunctionArn: other }, `${FunctionArn}/statements/Res`);
  (event as any).OldResourceProperties = props(statement('Old', '222222222222'));

  const res = await handler(event);

  expect(puts()[0].resourceArn).toBe(other);
  expect(sids(puts()[0])).toEqual(['Old']); // the same statement already there is taken over, not duplicated
  expect(res.PhysicalResourceId).toBe(`${other}/statements/Res`);
});

test('delete removes its statements and keeps the others', async () => {
  web.on(GetResourcePolicyCommand).resolves({ policy: policy(statement('Theirs', '333333333333'), statement('Mine', '222222222222')), revisionId: 'r1' });
  web.on(PutResourcePolicyCommand).resolves({ revisionId: 'r2' });

  await handler(cfnEvent('Delete', TYPE, props(statement('Mine', '222222222222')), 'phys'));

  expect(sids(puts()[0])).toEqual(['Theirs']);
  expect(web.commandCalls(DeleteResourcePolicyCommand)).toHaveLength(0);
});

test('delete of the last statements deletes the policy, on the revision it read', async () => {
  web.on(GetResourcePolicyCommand).resolves({ policy: policy(statement('Mine', '222222222222')), revisionId: 'r1' });
  web.on(DeleteResourcePolicyCommand).resolves({});

  await handler(cfnEvent('Delete', TYPE, props(statement('Mine', '222222222222')), 'phys'));

  expect(web.commandCalls(DeleteResourcePolicyCommand).map((c) => c.args[0].input)).toEqual([{ resourceArn: FunctionArn, revisionId: 'r1' }]);
  expect(puts()).toEqual([]);
});

test('delete succeeds when the function or its policy is already gone', async () => {
  web.on(GetResourcePolicyCommand).rejects(notFound());
  await expect(handler(cfnEvent('Delete', TYPE, props(statement('Mine', '222222222222')), 'phys'))).resolves.toEqual({ PhysicalResourceId: 'phys' });

  web.reset();
  web.on(GetResourcePolicyCommand).resolves({ policy: policy(statement('Mine', '222222222222')), revisionId: 'r1' });
  web.on(DeleteResourcePolicyCommand).rejects(notFound());
  await expect(handler(cfnEvent('Delete', TYPE, props(statement('Mine', '222222222222')), 'phys'))).resolves.toEqual({ PhysicalResourceId: 'phys' });
});

test('another writer got in first: reads again and retries', async () => {
  web.on(GetResourcePolicyCommand)
    .resolvesOnce({ policy: policy(statement('Theirs', '333333333333')), revisionId: 'r1' })
    .resolves({ policy: policy(statement('Theirs', '333333333333'), statement('Late', '555555555555')), revisionId: 'r2' });
  web.on(PutResourcePolicyCommand).rejectsOnce(conflict()).resolves({ revisionId: 'r3' });

  await handler(cfnEvent('Create', TYPE, props(statement('Mine', '222222222222'))));

  expect(puts().map((p) => [p.revisionId, sids(p)])).toEqual([['r1', ['Theirs', 'Mine']], ['r2', ['Theirs', 'Late', 'Mine']]]);
});

test('another writer created the policy at the same time: writes again', async () => {
  web.on(GetResourcePolicyCommand)
    .rejectsOnce(notFound())
    .resolvesOnce({ policy: policy(statement('Theirs', '333333333333')), revisionId: 'r1' }) // the check: ours was overwritten
    .resolvesOnce({ policy: policy(statement('Theirs', '333333333333')), revisionId: 'r1' })
    .resolves({ policy: policy(statement('Theirs', '333333333333'), statement('Mine', '222222222222')), revisionId: 'r2' });
  web.on(PutResourcePolicyCommand).resolves({ revisionId: 'r2' });

  await handler(cfnEvent('Create', TYPE, props(statement('Mine', '222222222222'))));

  expect(puts().map((p) => [p.revisionId, sids(p)])).toEqual([[undefined, ['Mine']], ['r1', ['Theirs', 'Mine']]]);
});

test('gives up after repeated conflicts', async () => {
  web.on(GetResourcePolicyCommand).resolves({ policy: policy(statement('Theirs', '333333333333')), revisionId: 'r1' });
  web.on(PutResourcePolicyCommand).rejects(conflict());

  await expect(handler(cfnEvent('Create', TYPE, props(statement('Mine', '222222222222'))))).rejects.toThrow(/updated by another request/);
  expect(puts()).toHaveLength(retry.conflictAttempts);
});

test('a Sid another writer uses for different content fails; the same content is taken over', async () => {
  web.on(GetResourcePolicyCommand).resolves({ policy: policy(statement('Partner', '333333333333')), revisionId: 'r1' });
  await expect(handler(cfnEvent('Create', TYPE, props(statement('Partner', '222222222222')))))
    .rejects.toThrow(`The resource policy of ${FunctionArn} already has a statement with Sid 'Partner' that another stack or tool added`);
  expect(puts()).toEqual([]);

  web.reset();
  // As Lambda may return it: one-element lists, other key order.
  const stored = { Resource: [`${FunctionArn}/endpoint/*`], Action: ['lambda:InvokeWebFunctionEndpoint'], Principal: { AWS: ['arn:aws:iam::222222222222:root'] }, Effect: 'Allow', Sid: 'Partner' };
  web.on(GetResourcePolicyCommand).resolves({ policy: policy(stored), revisionId: 'r1' });
  web.on(PutResourcePolicyCommand).resolves({ revisionId: 'r2' });
  await handler(cfnEvent('Create', TYPE, props(statement('Partner', '222222222222'))));
  expect(sids(puts()[0])).toEqual(['Partner']);
});

test('on create, takes over a statement without a Sid that has exactly its content (from 0.1.5-0.1.6, kept with RETAIN)', async () => {
  web.on(GetResourcePolicyCommand).resolves({
    policy: policy(statement(undefined, '222222222222'), statement(undefined, '333333333333')), revisionId: 'r1',
  });
  web.on(PutResourcePolicyCommand).resolves({ revisionId: 'r2' });

  await handler(cfnEvent('Create', TYPE, props(statement('Cdk1234ABCD0', '222222222222'))));

  expect(sids(puts()[0])).toEqual(['(none)', 'Cdk1234ABCD0']);
  expect(puts()[0].policy.Statement[0].Principal.AWS).toBe('arn:aws:iam::333333333333:root');
});

test('waits for the provider\'s IAM grant to propagate', async () => {
  web.on(GetResourcePolicyCommand)
    .rejectsOnce(Object.assign(new Error('not authorized'), { name: 'AccessDeniedException' }))
    .resolves({ policy: policy(statement('Theirs', '333333333333')), revisionId: 'r1' });
  web.on(PutResourcePolicyCommand).resolves({ revisionId: 'r2' });

  await handler(cfnEvent('Create', TYPE, props(statement('Mine', '222222222222'))));

  expect(sids(puts()[0])).toEqual(['Theirs', 'Mine']);
});

test('a policy over Lambda\'s size limit fails with a clear error', async () => {
  web.on(GetResourcePolicyCommand).resolves({ policy: policy(statement('Theirs', '333333333333')), revisionId: 'r1' });
  const many = Array.from({ length: 120 }, (_, i) => statement(`S${i}`, String(222222222222 + i)));

  await expect(handler(cfnEvent('Create', TYPE, props(...many)))).rejects.toThrow(/would be \d+ characters, over Lambda's limit of 20480/);
  expect(puts()).toEqual([]);
});
