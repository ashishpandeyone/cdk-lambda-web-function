import {
  CloudWatchLogsClient, CreateLogGroupCommand, DeleteLogGroupCommand, DeleteRetentionPolicyCommand,
  DescribeLogGroupsCommand, PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import type { HandlerResponse } from './index';
import type { LogGroupProperties } from '../../src/private/provider-protocol';

const clients = new Map<string, CloudWatchLogsClient>();
function logsIn(region: string): CloudWatchLogsClient {
  let client = clients.get(region);
  if (!client) {
    client = new CloudWatchLogsClient({ region });
    clients.set(region, client);
  }
  return client;
}

export const sleep = { seconds: (s: number) => new Promise<void>((r) => setTimeout(r, s * 1000)) };

/**
 * Owns one Web Function log group in one region.
 *
 * The service creates any missing group itself, without retention, and never deletes it.
 * Creating (or adopting) the group first means retention applies from the first log line,
 * and a redeploy after `cdk destroy` never fails with "already exists".
 *
 * Physical id = `<region>:<name>`, so a renamed function or a removed region becomes a
 * replacement, and CloudFormation deletes the old group in its cleanup phase.
 */
export async function handleLogGroup(event: CloudFormationCustomResourceEvent): Promise<HandlerResponse> {
  const props = event.ResourceProperties as unknown as LogGroupProperties;
  const physicalResourceId = `${props.Region}:${props.LogGroupName}`;

  if (event.RequestType === 'Delete') {
    if (props.RemovalPolicy === 'destroy') {
      await deleteAfterFlush(props);
    }
    return { PhysicalResourceId: event.PhysicalResourceId };
  }

  await ensure(props);
  return { PhysicalResourceId: physicalResourceId };
}

async function ensure(props: LogGroupProperties): Promise<void> {
  const logs = logsIn(props.Region);
  try {
    await logs.send(new CreateLogGroupCommand({ logGroupName: props.LogGroupName }));
  } catch (e) {
    if ((e as { name?: string }).name !== 'ResourceAlreadyExistsException') throw e;
  }
  if (props.RetentionInDays === 'Infinite') {
    await logs.send(new DeleteRetentionPolicyCommand({ logGroupName: props.LogGroupName }));
  } else {
    await logs.send(new PutRetentionPolicyCommand({ logGroupName: props.LogGroupName, retentionInDays: Number(props.RetentionInDays) }));
  }
}

/**
 * Environments that are shutting down flush their last log lines (and the home region's
 * aggregate copy lags behind) after the function or endpoint is gone; deleting too early
 * lets the service re-create the group without retention. Tests showed 75s is enough.
 */
async function deleteAfterFlush(props: LogGroupProperties): Promise<void> {
  await sleep.seconds(Number(props.FlushWaitSeconds));
  await deleteIfExists(props);
  await sleep.seconds(Number(props.RecheckWaitSeconds));
  if (await exists(props)) {
    await deleteIfExists(props);
  }
}

async function deleteIfExists(props: LogGroupProperties): Promise<void> {
  try {
    await logsIn(props.Region).send(new DeleteLogGroupCommand({ logGroupName: props.LogGroupName }));
  } catch (e) {
    if ((e as { name?: string }).name !== 'ResourceNotFoundException') throw e;
  }
}

async function exists(props: LogGroupProperties): Promise<boolean> {
  const res = await logsIn(props.Region).send(new DescribeLogGroupsCommand({ logGroupNamePrefix: props.LogGroupName }));
  return (res.logGroups ?? []).some((g) => g.logGroupName === props.LogGroupName);
}
