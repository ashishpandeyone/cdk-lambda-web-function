import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import {
  GetWebFunctionEndpointCommand, LambdaWebClient, UpdateWebFunctionEndpointCommand,
  type GetWebFunctionEndpointResponse, type RevisionWeight,
} from '@aws-sdk/client-lambda-web';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import type { TrafficShiftProperties, TrafficShiftState } from '../../src/private/provider-protocol';

/**
 * Canary and linear deployments of a Web Function endpoint, run by the CDK Provider framework:
 * `onEvent` reads the endpoint and starts the shift, then `isComplete` (called every few seconds, for up to an hour)
 * waits for each step to reach every region, bakes, watches the alarms, and moves to the next step.
 *
 * The endpoint's CloudFormation resource depends on this one, so only one writer changes the weights at a time:
 * when the shift is done, CloudFormation writes the same weights again (a no-op).
 *
 * Everything `isComplete` needs is in the endpoint itself (the weights say which step it's on, `updatedAt` when that step
 * started) and in what `onEvent` returned, since the framework calls it with the same event every time.
 */

type Weights = { revisionId: string; weight: number }[];

export interface OnEventResponse {
  readonly PhysicalResourceId: string;
  readonly Data: TrafficShiftState & Record<string, string>;
}

export interface IsCompleteResponse {
  readonly IsComplete: boolean;
}

/** How long a restore (after an alarm or a failed region) waits for every region before failing anyway. */
const RESTORE_WAIT_MS = 5 * 60_000;
/** Overridable in tests. */
export const clock = {
  now: () => Date.now(),
  sleep: (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
};

export async function onEvent(event: CloudFormationCustomResourceEvent): Promise<OnEventResponse> {
  const props = parseProps(event);
  const web = new LambdaWebClient({ region: props.region });
  const physicalResourceId = event.RequestType === 'Create' ? physicalId(props) : event.PhysicalResourceId;
  const none = { PhysicalResourceId: physicalResourceId, Data: { Action: 'none' as const } };

  if (event.RequestType === 'Delete') {
    // A shift created by a deployment that's rolling back: CloudFormation never wrote the endpoint, so put back what was there.
    const recorded = recordedWeights(event.PhysicalResourceId);
    if (!recorded || !(await rollingBack(event.StackId))) return none;
    const endpoint = await getEndpoint(web, props);
    if (!endpoint || sameWeights(endpoint.revisionWeights, recorded)) return none;
    log('rollback: restoring the weights from before this deployment', { endpoint: props.endpointName, weights: recorded });
    await write(web, props, recorded);
    return { PhysicalResourceId: physicalResourceId, Data: { Action: 'switch', TargetWeights: JSON.stringify(recorded) } };
  }

  const endpoint = await getEndpoint(web, props);
  if (!endpoint) {
    log('endpoint does not exist yet: CloudFormation creates it with all traffic on the revision', { endpoint: props.endpointName });
    return none;
  }
  const live = weightsOf(endpoint);
  const createId = event.RequestType === 'Create' ? physicalId(props, live) : physicalResourceId;
  const target: Weights = [{ revisionId: props.revisionId, weight: 100 }];
  if (sameWeights(live, target)) {
    log('endpoint already serves the revision', { endpoint: props.endpointName, revisionId: props.revisionId });
    return { PhysicalResourceId: createId, Data: { Action: 'none' } };
  }

  if (await rollingBack(event.StackId)) {
    log('stack is rolling back: switching all at once, without alarms', { endpoint: props.endpointName, from: live, to: target });
    await write(web, props, target);
    return { PhysicalResourceId: createId, Data: { Action: 'switch', TargetWeights: JSON.stringify(target) } };
  }

  const firing = await alarmsInAlarm(props.alarmArns);
  if (firing.length > 0) {
    throw new Error(`Not deploying ${props.revisionId} to endpoint ${props.endpointName}: alarm ${firing.join(', ')} is already in ALARM. Nothing was changed.`);
  }

  const current = live.find((w) => w.revisionId === props.revisionId)?.weight ?? 0;
  const previous = previousRevision(live, props.revisionId);
  // Resume a split that already gives the revision some traffic (e.g. left by an interrupted deployment).
  const first = current > 0 ? props.steps.find((s) => s >= current)! : props.steps[0];
  if (live.length > 2 || (live.length === 2 && current === 0)) {
    log('endpoint routes to revisions other than the new one; the first step leaves only the one with the most traffic', { live, previous });
  }
  log('starting deployment', { endpoint: props.endpointName, from: live, revisionId: props.revisionId, steps: props.steps, waitSeconds: props.waitSeconds });
  await write(web, props, step(previous, props.revisionId, first));
  return { PhysicalResourceId: createId, Data: { Action: 'shift', PreviousWeights: JSON.stringify(live) } };
}

export async function isComplete(event: CloudFormationCustomResourceEvent & { Data?: TrafficShiftState }): Promise<IsCompleteResponse> {
  const state = event.Data ?? { Action: 'none' };
  if (state.Action === 'none') return { IsComplete: true };

  const props = parseProps(event);
  const web = new LambdaWebClient({ region: props.region });
  const endpoint = await getEndpoint(web, props);
  if (!endpoint) {
    if (event.RequestType === 'Delete') return { IsComplete: true };
    throw new Error(`Endpoint ${props.endpointName} was deleted during the deployment`);
  }
  if (inProgress(endpoint)) return { IsComplete: false };
  const live = weightsOf(endpoint);

  if (state.Action === 'switch') {
    const target = JSON.parse(state.TargetWeights!) as Weights;
    const failed = failedRegions(endpoint);
    if (failed.length > 0) throw new Error(`Endpoint ${props.endpointName} failed to update in ${failed.join('; ')}`);
    if (sameWeights(live, target)) return { IsComplete: true };
    // Another writer got in between (e.g. an earlier deployment's last step): write again.
    log('weights differ from the rollback target; writing them again', { live, target });
    await write(web, props, target);
    return { IsComplete: false };
  }

  const previousWeights = JSON.parse(state.PreviousWeights!) as Weights;
  if (await rollingBack(event.StackId)) {
    // CloudFormation stopped waiting for this deployment; its rollback Update moves the endpoint back.
    throw new Error(`Stack is rolling back: stopped deploying ${props.revisionId} to endpoint ${props.endpointName}`);
  }
  const current = live.find((w) => w.revisionId === props.revisionId)?.weight ?? 0;
  if (!props.steps.includes(current) || live.length > 2) {
    throw new Error(`Endpoint ${props.endpointName} was changed by someone else during the deployment (weights ${format(live)}); stopped without changing it`);
  }

  const failed = failedRegions(endpoint);
  if (failed.length > 0) {
    await restore(web, props, previousWeights);
    throw new Error(`Endpoint ${props.endpointName} failed to update in ${failed.join('; ')}. Restored ${format(previousWeights)}.`);
  }
  const firing = await alarmsInAlarm(props.alarmArns);
  if (firing.length > 0) {
    await restore(web, props, previousWeights);
    throw new Error(`Alarm ${firing.join(', ')} went into ALARM with ${current}% of endpoint ${props.endpointName} on ${props.revisionId}. Restored ${format(previousWeights)}.`);
  }
  if (current === 100) {
    log('deployment complete', { endpoint: props.endpointName, revisionId: props.revisionId });
    return { IsComplete: true };
  }

  const startedAt = endpoint.updatedAt?.getTime() ?? 0;
  const remaining = startedAt + props.waitSeconds * 1000 - clock.now();
  if (remaining > 0) return { IsComplete: false };
  const next = props.steps.find((s) => s > current)!;
  log('next step', { endpoint: props.endpointName, revisionId: props.revisionId, from: current, to: next });
  await write(web, props, step(previousRevision(live, props.revisionId), props.revisionId, next));
  return { IsComplete: false };
}

interface Props {
  readonly region: string;
  readonly functionArn: string;
  readonly endpointName: string;
  readonly revisionId: string;
  readonly steps: number[];
  readonly waitSeconds: number;
  readonly alarmArns: string[];
}

function parseProps(event: CloudFormationCustomResourceEvent): Props {
  const p = event.ResourceProperties as unknown as TrafficShiftProperties;
  return {
    region: p.FunctionArn.split(':')[3],
    functionArn: p.FunctionArn,
    endpointName: p.EndpointName,
    revisionId: p.RevisionId,
    steps: p.Steps.split(',').map(Number),
    waitSeconds: Number(p.WaitSeconds),
    alarmArns: p.AlarmArns ?? [],
  };
}

/**
 * `<function ARN>/endpoint/<name>/traffic-shift`, plus the weights the endpoint had when the shift was created
 * (`#rev-a:90,rev-b:10`): a Delete during a rollback puts them back.
 */
function physicalId(props: Props, weights?: Weights): string {
  const base = `${props.functionArn}/endpoint/${props.endpointName}/traffic-shift`;
  return weights ? `${base}#${weights.map((w) => `${w.revisionId}:${w.weight}`).join(',')}` : base;
}

function recordedWeights(physicalResourceId: string): Weights | undefined {
  const recorded = physicalResourceId.split('#')[1];
  if (!recorded) return undefined;
  return recorded.split(',').map((pair) => {
    const [revisionId, weight] = pair.split(':');
    return { revisionId, weight: Number(weight) };
  });
}

async function getEndpoint(web: LambdaWebClient, props: Props): Promise<GetWebFunctionEndpointResponse | undefined> {
  try {
    return await web.send(new GetWebFunctionEndpointCommand({ functionName: props.functionArn, endpointName: props.endpointName }));
  } catch (e) {
    if ((e as Error).name === 'ResourceNotFoundException') return undefined;
    throw e;
  }
}

async function write(web: LambdaWebClient, props: Props, weights: Weights): Promise<void> {
  const { functionArn: functionName, endpointName } = props;
  await web.send(new UpdateWebFunctionEndpointCommand({ functionName, endpointName, revisionWeights: weights }));
}

/** Writes `weights` and waits (a few minutes at most) for every region, so the endpoint is back before the deployment fails. */
async function restore(web: LambdaWebClient, props: Props, weights: Weights): Promise<void> {
  log('restoring the previous weights', { endpoint: props.endpointName, weights });
  await write(web, props, weights);
  const end = clock.now() + RESTORE_WAIT_MS;
  while (clock.now() < end) {
    await clock.sleep(5000);
    const endpoint = await getEndpoint(web, props);
    if (endpoint && !inProgress(endpoint)) {
      const failed = failedRegions(endpoint);
      if (failed.length > 0) log('restore failed in some regions', { failed });
      return;
    }
  }
  log('restore still in progress; not waiting any longer', { endpoint: props.endpointName });
}

function weightsOf(endpoint: GetWebFunctionEndpointResponse): Weights {
  return (endpoint.revisionWeights ?? []).map((w: RevisionWeight) => ({ revisionId: w.revisionId!, weight: w.weight! }));
}

function sameWeights(a: RevisionWeight[] | undefined, b: Weights): boolean {
  const key = (ws: RevisionWeight[]) => ws.filter((w) => w.weight! > 0).map((w) => `${w.revisionId}:${w.weight}`).sort().join(',');
  return key(a ?? []) === key(b);
}

/** The revision to share traffic with: the one (other than the new revision) with the most traffic. */
function previousRevision(live: Weights, revisionId: string): string {
  const others = live.filter((w) => w.revisionId !== revisionId).sort((a, b) => b.weight - a.weight);
  return others[0].revisionId;
}

function step(previous: string, revisionId: string, percent: number): Weights {
  return percent >= 100 ? [{ revisionId, weight: 100 }] : [{ revisionId: previous, weight: 100 - percent }, { revisionId, weight: percent }];
}

/** Whether the endpoint, or any of its regions, is still applying an update. */
function inProgress(endpoint: GetWebFunctionEndpointResponse): boolean {
  return endpoint.updateStatus === 'InProgress' || Object.values(endpoint.regionalEndpoints ?? {}).some((r) => r.updateStatus === 'InProgress');
}

function failedRegions(endpoint: GetWebFunctionEndpointResponse): string[] {
  const failed = Object.entries(endpoint.regionalEndpoints ?? {})
    .filter(([, r]) => r.updateStatus === 'Failed')
    .map(([region, r]) => `${region}: ${r.updateStatusReason ?? 'no reason given'}`);
  if (failed.length === 0 && endpoint.updateStatus === 'Failed') failed.push(endpoint.updateStatusReason ?? 'no reason given');
  return failed;
}

/** Whether CloudFormation is rolling the stack back (`UPDATE_ROLLBACK_IN_PROGRESS`, `..._CLEANUP_IN_PROGRESS`, `ROLLBACK_IN_PROGRESS`). */
async function rollingBack(stackId: string): Promise<boolean> {
  const cfn = new CloudFormationClient({ region: stackId.split(':')[3] });
  const r = await cfn.send(new DescribeStacksCommand({ StackName: stackId }));
  return /ROLLBACK/.test(r.Stacks?.[0]?.StackStatus ?? '');
}

/** Names of the alarms in ALARM. An alarm that doesn't exist is an error: the deployment would otherwise run unwatched. */
async function alarmsInAlarm(alarmArns: string[]): Promise<string[]> {
  const byRegion = new Map<string, string[]>();
  for (const arn of alarmArns) {
    const parts = arn.split(':');
    byRegion.set(parts[3], [...(byRegion.get(parts[3]) ?? []), parts.slice(6).join(':')]);
  }
  const firing: string[] = [];
  for (const [region, names] of byRegion) {
    const cw = new CloudWatchClient({ region });
    const found = new Map<string, string>();
    for (let i = 0; i < names.length; i += 100) {
      const r = await cw.send(new DescribeAlarmsCommand({ AlarmNames: names.slice(i, i + 100), AlarmTypes: ['MetricAlarm', 'CompositeAlarm'] }));
      for (const a of [...(r.MetricAlarms ?? []), ...(r.CompositeAlarms ?? [])]) found.set(a.AlarmName!, a.StateValue!);
    }
    const missing = names.filter((n) => !found.has(n));
    if (missing.length > 0) throw new Error(`Alarm ${missing.join(', ')} not found in ${region}`);
    firing.push(...names.filter((n) => found.get(n) === 'ALARM').map((n) => (byRegion.size > 1 ? `${n} (${region})` : n)));
  }
  return firing;
}

function format(weights: Weights): string {
  return weights.map((w) => `${w.revisionId} ${w.weight}%`).join(', ');
}

function log(msg: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ msg, ...fields }));
}
