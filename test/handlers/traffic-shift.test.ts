import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { GetWebFunctionEndpointCommand, LambdaWebClient, UpdateWebFunctionEndpointCommand } from '@aws-sdk/client-lambda-web';
import { mockClient } from 'aws-sdk-client-mock';
import { cfnEvent } from './events';
import { clock, isComplete, onEvent } from '../../handlers/web-function-deployment/index';
import { TRAFFIC_SHIFT_RESOURCE_TYPE, type TrafficShiftState } from '../../src/private/provider-protocol';

const web = mockClient(LambdaWebClient);
const cfn = mockClient(CloudFormationClient);
const cw = mockClient(CloudWatchClient);

const FunctionArn = 'arn:aws:lambda:ap-south-1:111111111111:web-function/api';
const ALARM = 'arn:aws:cloudwatch:ap-south-1:111111111111:alarm:api-errors';
const BASE_ID = `${FunctionArn}/endpoint/live/traffic-shift`;
const NOW = Date.UTC(2026, 9, 16, 12, 0, 0);
const canary = { FunctionArn, EndpointName: 'live', RevisionId: 'rev-2', Steps: '10,100', WaitSeconds: '300', AlarmArns: [ALARM], EndpointConfig: 'h' };
const linear = { ...canary, Steps: '20,40,60,80,100', WaitSeconds: '60' };

type W = [string, number][];
const weights = (ws: W) => ws.map(([revisionId, weight]) => ({ revisionId, weight }));
/** An endpoint with these weights; `regions` maps extra regions to their updateStatus. */
function endpoint(ws: W, opts: { status?: string; regions?: Record<string, string>; updatedAgoSeconds?: number; reason?: string } = {}) {
  const regional = Object.fromEntries(Object.entries({ 'ap-south-1': 'Successful', ...opts.regions })
    .map(([region, updateStatus]) => [region, { updateStatus, updateStatusReason: updateStatus === 'Failed' ? opts.reason : undefined, revisionWeights: weights(ws) }]));
  return {
    endpointName: 'live',
    revisionWeights: weights(ws),
    updateStatus: opts.status ?? 'Successful',
    regionalEndpoints: regional,
    updatedAt: new Date(NOW - (opts.updatedAgoSeconds ?? 0) * 1000),
  } as any;
}
const stackStatus = (status: string) => cfn.on(DescribeStacksCommand).resolves({ Stacks: [{ StackStatus: status } as any] });
const alarmState = (state: string, name = 'api-errors') => cw.on(DescribeAlarmsCommand).resolves({ MetricAlarms: [{ AlarmName: name, StateValue: state } as any] });
const written = () => web.commandCalls(UpdateWebFunctionEndpointCommand)
  .map((c) => c.args[0].input.revisionWeights!.map((w) => [w.revisionId, w.weight]));
const completeEvent = (props: Record<string, unknown>, data: TrafficShiftState, type: 'Create' | 'Update' | 'Delete' = 'Update') =>
  ({ ...cfnEvent(type, TRAFFIC_SHIFT_RESOURCE_TYPE, props, BASE_ID), Data: data }) as any;
const shifting = (previous: W) => ({ Action: 'shift' as const, PreviousWeights: JSON.stringify(weights(previous)) });

beforeEach(() => {
  web.reset();
  cfn.reset();
  cw.reset();
  stackStatus('UPDATE_IN_PROGRESS');
  alarmState('OK');
  web.on(UpdateWebFunctionEndpointCommand).resolves({});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(clock, 'now').mockReturnValue(NOW);
  jest.spyOn(clock, 'sleep').mockResolvedValue();
});

afterEach(() => jest.restoreAllMocks());

describe('onEvent', () => {
  test('first deploy: the endpoint does not exist yet, so CloudFormation creates it with all traffic on the revision', async () => {
    web.on(GetWebFunctionEndpointCommand).rejects(Object.assign(new Error('not found'), { name: 'ResourceNotFoundException' }));

    const res = await onEvent(cfnEvent('Create', TRAFFIC_SHIFT_RESOURCE_TYPE, canary));

    expect(res).toEqual({ PhysicalResourceId: BASE_ID, Data: { Action: 'none' } });
    expect(written()).toEqual([]);
  });

  test('starts a canary: the first step, from the revision the endpoint serves', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 100]]));

    const res = await onEvent(cfnEvent('Update', TRAFFIC_SHIFT_RESOURCE_TYPE, canary, BASE_ID));

    expect(written()).toEqual([[['rev-1', 90], ['rev-2', 10]]]);
    expect(res).toEqual({ PhysicalResourceId: BASE_ID, Data: { Action: 'shift', PreviousWeights: JSON.stringify(weights([['rev-1', 100]])) } });
    const update = web.commandCalls(UpdateWebFunctionEndpointCommand)[0].args[0].input;
    expect(update).toEqual({ functionName: FunctionArn, endpointName: 'live', revisionWeights: weights([['rev-1', 90], ['rev-2', 10]]) });
    expect(await web.call(0).thisValue.config.region()).toBe('ap-south-1');
  });

  test('on create, records the endpoint\'s weights in the physical ID (a rollback Delete restores them)', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-0', 70], ['rev-1', 30]]));

    const res = await onEvent(cfnEvent('Create', TRAFFIC_SHIFT_RESOURCE_TYPE, canary));

    expect(res.PhysicalResourceId).toBe(`${BASE_ID}#rev-0:70,rev-1:30`);
  });

  test('nothing to do when the endpoint already serves the revision (e.g. only alarms changed, or after a CLI switch)', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-2', 100]]));

    const res = await onEvent(cfnEvent('Update', TRAFFIC_SHIFT_RESOURCE_TYPE, canary, BASE_ID));

    expect(res.Data).toEqual({ Action: 'none' });
    expect(written()).toEqual([]);
  });

  test('out-of-band rollback before the deploy: shifts from what the endpoint serves now', async () => {
    // Someone ran update-web-function-endpoint to put rev-0 back; the template's previous revision was rev-1.
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-0', 100]]));

    await onEvent(cfnEvent('Update', TRAFFIC_SHIFT_RESOURCE_TYPE, canary, BASE_ID));

    expect(written()).toEqual([[['rev-0', 90], ['rev-2', 10]]]);
  });

  test('a split left by an interrupted deployment of the same revision resumes at the next step', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 70], ['rev-2', 30]]));

    await onEvent(cfnEvent('Update', TRAFFIC_SHIFT_RESOURCE_TYPE, linear, BASE_ID));

    expect(written()).toEqual([[['rev-1', 60], ['rev-2', 40]]]);
  });

  test('a split between two other revisions: shifts from the one with the most traffic', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-0', 30], ['rev-1', 70]]));

    await onEvent(cfnEvent('Update', TRAFFIC_SHIFT_RESOURCE_TYPE, canary, BASE_ID));

    expect(written()).toEqual([[['rev-1', 90], ['rev-2', 10]]]);
  });

  test('does not start while an alarm is in ALARM, and changes nothing', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 100]]));
    alarmState('ALARM');

    await expect(onEvent(cfnEvent('Update', TRAFFIC_SHIFT_RESOURCE_TYPE, canary, BASE_ID))).rejects.toThrow(/api-errors is already in ALARM. Nothing was changed/);
    expect(written()).toEqual([]);
    expect(cw.commandCalls(DescribeAlarmsCommand)[0].args[0].input).toEqual({ AlarmNames: ['api-errors'], AlarmTypes: ['MetricAlarm', 'CompositeAlarm'] });
  });

  test('fails when an alarm does not exist, rather than deploying unwatched', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 100]]));
    cw.on(DescribeAlarmsCommand).resolves({ MetricAlarms: [] });

    await expect(onEvent(cfnEvent('Update', TRAFFIC_SHIFT_RESOURCE_TYPE, canary, BASE_ID))).rejects.toThrow('Alarm api-errors not found in ap-south-1');
    expect(written()).toEqual([]);
  });

  test('reads alarms in their own regions, composite alarms included', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 100]]));
    const usAlarm = 'arn:aws:cloudwatch:us-east-1:111111111111:alarm:api-composite';
    cw.on(DescribeAlarmsCommand, { AlarmNames: ['api-composite'] }).resolves({ CompositeAlarms: [{ AlarmName: 'api-composite', StateValue: 'ALARM' } as any] });

    await expect(onEvent(cfnEvent('Update', TRAFFIC_SHIFT_RESOURCE_TYPE, { ...canary, AlarmArns: [ALARM, usAlarm] }, BASE_ID)))
      .rejects.toThrow('alarm api-composite (us-east-1) is already in ALARM');
    const regions = await Promise.all(cw.calls().map((c) => (c.thisValue as any).config.region()));
    expect(regions.sort()).toEqual(['ap-south-1', 'us-east-1']);
  });

  test('stack rollback when the endpoint never moved (the deployment failed before its shift): nothing to do', async () => {
    stackStatus('UPDATE_ROLLBACK_IN_PROGRESS');
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 100]]));

    const res = await onEvent(cfnEvent('Update', TRAFFIC_SHIFT_RESOURCE_TYPE, { ...canary, RevisionId: 'rev-1' }, BASE_ID));

    expect(res.Data).toEqual({ Action: 'none' });
    expect(written()).toEqual([]);
  });

  test('stack rollback: CloudFormation rolls the shift back before the endpoint, so it switches back at once, ignoring alarms', async () => {
    stackStatus('UPDATE_ROLLBACK_IN_PROGRESS');
    alarmState('ALARM');
    // The shift finished (rev-2 has everything); a later resource failed.
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-2', 100]]));

    const res = await onEvent(cfnEvent('Update', TRAFFIC_SHIFT_RESOURCE_TYPE, { ...canary, RevisionId: 'rev-1' }, BASE_ID));

    expect(written()).toEqual([[['rev-1', 100]]]);
    expect(res.Data).toEqual({ Action: 'switch', TargetWeights: JSON.stringify(weights([['rev-1', 100]])) });
    expect(cw.calls()).toHaveLength(0);
  });

  test('delete outside a rollback (deployment removed, endpoint replaced, stack deleted) changes nothing', async () => {
    const res = await onEvent(cfnEvent('Delete', TRAFFIC_SHIFT_RESOURCE_TYPE, canary, `${BASE_ID}#rev-1:100`));

    expect(res).toEqual({ PhysicalResourceId: `${BASE_ID}#rev-1:100`, Data: { Action: 'none' } });
    expect(web.calls()).toHaveLength(0);
  });

  test('delete during a rollback of the deployment that created it: restores the recorded weights', async () => {
    stackStatus('UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS');
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-2', 100]]));

    const res = await onEvent(cfnEvent('Delete', TRAFFIC_SHIFT_RESOURCE_TYPE, canary, `${BASE_ID}#rev-1:100`));

    expect(written()).toEqual([[['rev-1', 100]]]);
    expect(res.Data).toEqual({ Action: 'switch', TargetWeights: JSON.stringify(weights([['rev-1', 100]])) });
  });

  test('delete during a rollback when the endpoint already has the recorded weights, or none were recorded', async () => {
    stackStatus('UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS');
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 100]]));

    expect((await onEvent(cfnEvent('Delete', TRAFFIC_SHIFT_RESOURCE_TYPE, canary, `${BASE_ID}#rev-1:100`))).Data).toEqual({ Action: 'none' });
    expect((await onEvent(cfnEvent('Delete', TRAFFIC_SHIFT_RESOURCE_TYPE, canary, BASE_ID))).Data).toEqual({ Action: 'none' });
    expect(written()).toEqual([]);
  });
});

describe('isComplete', () => {
  test('nothing to wait for', async () => {
    expect(await isComplete(completeEvent(canary, { Action: 'none' }))).toEqual({ IsComplete: true });
    expect(web.calls()).toHaveLength(0);
  });

  test('waits while any region is still updating (MULTI_REGION / PER_REGION)', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 90], ['rev-2', 10]], { regions: { 'us-east-1': 'Successful', 'eu-west-1': 'InProgress' }, updatedAgoSeconds: 900 }));

    expect(await isComplete(completeEvent(canary, shifting([['rev-1', 100]])))).toEqual({ IsComplete: false });
    expect(written()).toEqual([]);
  });

  test('bakes: waits until the step has served for the wait time, counted from its update', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 90], ['rev-2', 10]], { updatedAgoSeconds: 299 }));

    expect(await isComplete(completeEvent(canary, shifting([['rev-1', 100]])))).toEqual({ IsComplete: false });
    expect(written()).toEqual([]);
    expect(cw.calls()).toHaveLength(1); // alarms are watched during the bake
  });

  test('after the bake, moves to the next step', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 90], ['rev-2', 10]], { updatedAgoSeconds: 300 }));

    expect(await isComplete(completeEvent(canary, shifting([['rev-1', 100]])))).toEqual({ IsComplete: false });
    expect(written()).toEqual([[['rev-2', 100]]]);
  });

  test('linear: each step adds the percentage', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 60], ['rev-2', 40]], { updatedAgoSeconds: 61 }));

    await isComplete(completeEvent(linear, shifting([['rev-1', 100]])));

    expect(written()).toEqual([[['rev-1', 40], ['rev-2', 60]]]);
  });

  test('complete once the revision has all traffic in every region and no alarm fired', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-2', 100]], { regions: { 'us-east-1': 'Successful' } }));

    expect(await isComplete(completeEvent(canary, shifting([['rev-1', 100]])))).toEqual({ IsComplete: true });
    expect(written()).toEqual([]);
  });

  test('an alarm in ALARM restores the previous weights, waits for them, then fails the deployment', async () => {
    web.on(GetWebFunctionEndpointCommand)
      .resolvesOnce(endpoint([['rev-1', 90], ['rev-2', 10]], { updatedAgoSeconds: 30 }))
      .resolvesOnce(endpoint([['rev-1', 100]], { status: 'InProgress' }))
      .resolves(endpoint([['rev-1', 100]]));
    alarmState('ALARM');

    await expect(isComplete(completeEvent(canary, shifting([['rev-1', 100]]))))
      .rejects.toThrow('Alarm api-errors went into ALARM with 10% of endpoint live on rev-2. Restored rev-1 100%.');
    expect(written()).toEqual([[['rev-1', 100]]]);
    expect(web.commandCalls(GetWebFunctionEndpointCommand)).toHaveLength(3);
  });

  test('the restore puts back a split the endpoint had before the deployment', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 40], ['rev-2', 60]]));
    alarmState('ALARM');

    await expect(isComplete(completeEvent(linear, shifting([['rev-0', 50], ['rev-1', 50]])))).rejects.toThrow(/Restored rev-0 50%, rev-1 50%/);
    expect(written()).toEqual([[['rev-0', 50], ['rev-1', 50]]]);
  });

  test('a region that failed to update restores the previous weights and fails', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 90], ['rev-2', 10]], { regions: { 'eu-west-1': 'Failed' }, reason: 'replication failed' }));

    await expect(isComplete(completeEvent(canary, shifting([['rev-1', 100]])))).rejects.toThrow('failed to update in eu-west-1: replication failed');
    expect(written()).toEqual([[['rev-1', 100]]]);
  });

  test('stops without writing when someone else changed the weights', async () => {
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 75], ['rev-2', 25]]));

    await expect(isComplete(completeEvent(canary, shifting([['rev-1', 100]])))).rejects.toThrow(/changed by someone else/);
    expect(written()).toEqual([]);
  });

  test('stops without writing once the stack is rolling back (its rollback Update takes over)', async () => {
    stackStatus('UPDATE_ROLLBACK_IN_PROGRESS');
    web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 90], ['rev-2', 10]], { updatedAgoSeconds: 600 }));

    await expect(isComplete(completeEvent(canary, shifting([['rev-1', 100]])))).rejects.toThrow(/Stack is rolling back/);
    expect(written()).toEqual([]);
  });

  describe('switch (rollback)', () => {
    const switching = { Action: 'switch' as const, TargetWeights: JSON.stringify(weights([['rev-1', 100]])) };

    test('complete once every region serves the target', async () => {
      web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 100]], { regions: { 'us-east-1': 'Successful' } }));
      expect(await isComplete(completeEvent({ ...canary, RevisionId: 'rev-1' }, switching))).toEqual({ IsComplete: true });
    });

    test('writes again when another writer got in between', async () => {
      web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 80], ['rev-2', 20]]));
      expect(await isComplete(completeEvent({ ...canary, RevisionId: 'rev-1' }, switching))).toEqual({ IsComplete: false });
      expect(written()).toEqual([[['rev-1', 100]]]);
    });

    test('fails when a region fails', async () => {
      web.on(GetWebFunctionEndpointCommand).resolves(endpoint([['rev-1', 100]], { regions: { 'us-east-1': 'Failed' }, reason: 'boom' }));
      await expect(isComplete(completeEvent({ ...canary, RevisionId: 'rev-1' }, switching))).rejects.toThrow('us-east-1: boom');
    });

    test('a delete whose endpoint is gone is complete', async () => {
      web.on(GetWebFunctionEndpointCommand).rejects(Object.assign(new Error('not found'), { name: 'ResourceNotFoundException' }));
      expect(await isComplete(completeEvent(canary, switching, 'Delete'))).toEqual({ IsComplete: true });
    });
  });
});
