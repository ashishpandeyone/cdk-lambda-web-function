import {
  CloudWatchLogsClient, CreateLogGroupCommand, DeleteLogGroupCommand, DeleteRetentionPolicyCommand,
  DescribeLogGroupsCommand, PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { mockClient } from 'aws-sdk-client-mock';
import { cfnEvent } from './events';
import { handler } from '../../handlers/web-function-provider/index';
import { sleep } from '../../handlers/web-function-provider/log-group';
import { LOG_GROUP_RESOURCE_TYPE } from '../../src/private/provider-protocol';

const logs = mockClient(CloudWatchLogsClient);
const props = {
  Region: 'eu-west-1',
  LogGroupName: '/aws/lambda/web/api.local',
  RetentionInDays: '30',
  RemovalPolicy: 'retain',
  FlushWaitSeconds: '75',
  RecheckWaitSeconds: '30',
};
const named = (name: string) => Object.assign(new Error(name), { name });
let waits: number[];

beforeEach(() => {
  logs.reset();
  waits = [];
  jest.spyOn(sleep, 'seconds').mockImplementation(async (s) => { waits.push(s); });
});

test('creates the group with retention', async () => {
  const res = await handler(cfnEvent('Create', LOG_GROUP_RESOURCE_TYPE, props));

  expect(res).toEqual({ PhysicalResourceId: 'eu-west-1:/aws/lambda/web/api.local' });
  expect(logs.commandCalls(CreateLogGroupCommand)[0].args[0].input).toEqual({ logGroupName: '/aws/lambda/web/api.local' });
  expect(logs.commandCalls(PutRetentionPolicyCommand)[0].args[0].input).toEqual({ logGroupName: '/aws/lambda/web/api.local', retentionInDays: 30 });
});

test('adopts a group that already exists (e.g. created by the service, or retained by a previous stack)', async () => {
  logs.on(CreateLogGroupCommand).rejects(named('ResourceAlreadyExistsException'));

  await handler(cfnEvent('Create', LOG_GROUP_RESOURCE_TYPE, props));

  expect(logs.commandCalls(PutRetentionPolicyCommand)).toHaveLength(1);
});

test('removes retention when it is Infinite', async () => {
  await handler(cfnEvent('Update', LOG_GROUP_RESOURCE_TYPE, { ...props, RetentionInDays: 'Infinite' }));

  expect(logs.commandCalls(DeleteRetentionPolicyCommand)).toHaveLength(1);
  expect(logs.commandCalls(PutRetentionPolicyCommand)).toHaveLength(0);
});

test('surfaces other errors', async () => {
  logs.on(CreateLogGroupCommand).rejects(named('AccessDeniedException'));

  await expect(handler(cfnEvent('Create', LOG_GROUP_RESOURCE_TYPE, props))).rejects.toThrow('AccessDeniedException');
});

test('keeps the group on delete when the removal policy is retain', async () => {
  const res = await handler(cfnEvent('Delete', LOG_GROUP_RESOURCE_TYPE, props, 'eu-west-1:/aws/lambda/web/api.local'));

  expect(res).toEqual({ PhysicalResourceId: 'eu-west-1:/aws/lambda/web/api.local' });
  expect(logs.calls()).toHaveLength(0);
  expect(waits).toEqual([]);
});

test('waits for late flushes, deletes, and deletes again if the service re-created the group', async () => {
  logs.on(DescribeLogGroupsCommand).resolves({ logGroups: [{ logGroupName: '/aws/lambda/web/api.local' }] });

  await handler(cfnEvent('Delete', LOG_GROUP_RESOURCE_TYPE, { ...props, RemovalPolicy: 'destroy' }));

  expect(waits).toEqual([75, 30]);
  expect(logs.commandCalls(DeleteLogGroupCommand)).toHaveLength(2);
});

test('deletes once when the group stays gone, and tolerates it already being gone', async () => {
  logs.on(DeleteLogGroupCommand).rejects(named('ResourceNotFoundException'));
  logs.on(DescribeLogGroupsCommand).resolves({ logGroups: [{ logGroupName: '/aws/lambda/web/api.local.other' }] });

  await handler(cfnEvent('Delete', LOG_GROUP_RESOURCE_TYPE, { ...props, RemovalPolicy: 'destroy' }));

  expect(logs.commandCalls(DeleteLogGroupCommand)).toHaveLength(1);
});
