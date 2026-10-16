import { CloudWatchClient, DeleteAlarmsCommand, PutMetricAlarmCommand } from '@aws-sdk/client-cloudwatch';
import { mockClient } from 'aws-sdk-client-mock';
import { cfnEvent } from './events';
import { retry } from '../../handlers/web-function-provider/alarm';
import { handler } from '../../handlers/web-function-provider/index';
import { REGIONAL_ALARM_RESOURCE_TYPE } from '../../src/private/provider-protocol';

const cw = mockClient(CloudWatchClient);
const metrics = [{ Id: 'rate', Expression: '100 * FILL(errors, 0) / requests', ReturnData: true }];
const props = {
  Region: 'us-east-1',
  AlarmName: 'LambdaWeb-orders-live-5xx-rate',
  AlarmDescription: 'Rolls back deployments',
  Metrics: JSON.stringify(metrics),
  Threshold: '2',
  EvaluationPeriods: '3',
  ComparisonOperator: 'GreaterThanThreshold',
  TreatMissingData: 'notBreaching',
};

beforeEach(() => {
  cw.reset();
  retry.delaySeconds = 0;
});

test.each(['Create', 'Update'] as const)('%s puts the alarm in its region', async (requestType) => {
  const res = await handler(cfnEvent(requestType, REGIONAL_ALARM_RESOURCE_TYPE, props));

  expect(res).toEqual({ PhysicalResourceId: 'us-east-1:LambdaWeb-orders-live-5xx-rate' });
  expect(cw.commandCalls(PutMetricAlarmCommand)[0].args[0].input).toEqual({
    AlarmName: 'LambdaWeb-orders-live-5xx-rate',
    AlarmDescription: 'Rolls back deployments',
    Metrics: metrics,
    Threshold: 2,
    EvaluationPeriods: 3,
    ComparisonOperator: 'GreaterThanThreshold',
    TreatMissingData: 'notBreaching',
    ActionsEnabled: false,
  });
  expect(await cw.call(0).thisValue.config.region()).toBe('us-east-1');
});

test('delete removes the alarm named by the physical id, in its region', async () => {
  const res = await handler(cfnEvent('Delete', REGIONAL_ALARM_RESOURCE_TYPE, props, 'eu-west-1:LambdaWeb-old-name'));

  expect(res).toEqual({ PhysicalResourceId: 'eu-west-1:LambdaWeb-old-name' });
  expect(cw.commandCalls(DeleteAlarmsCommand)[0].args[0].input).toEqual({ AlarmNames: ['LambdaWeb-old-name'] });
  expect(await cw.call(0).thisValue.config.region()).toBe('eu-west-1');
});

test('delete of a resource that never got created does nothing', async () => {
  await handler(cfnEvent('Delete', REGIONAL_ALARM_RESOURCE_TYPE, props, 'failed-create-id'));
  expect(cw.calls()).toHaveLength(0);
});

test('retries while the provider\'s permission propagates, then gives up', async () => {
  const denied = Object.assign(new Error('not authorized'), { name: 'AccessDenied' });
  cw.on(PutMetricAlarmCommand).rejectsOnce(denied).rejectsOnce(denied).resolves({});
  await handler(cfnEvent('Create', REGIONAL_ALARM_RESOURCE_TYPE, props));
  expect(cw.commandCalls(PutMetricAlarmCommand)).toHaveLength(3);

  cw.reset();
  cw.on(PutMetricAlarmCommand).rejects(denied);
  await expect(handler(cfnEvent('Create', REGIONAL_ALARM_RESOURCE_TYPE, props))).rejects.toThrow('not authorized');
  expect(cw.commandCalls(PutMetricAlarmCommand)).toHaveLength(retry.attempts);

  cw.reset();
  cw.on(PutMetricAlarmCommand).rejects(Object.assign(new Error('bad'), { name: 'ValidationError' }));
  await expect(handler(cfnEvent('Create', REGIONAL_ALARM_RESOURCE_TYPE, props))).rejects.toThrow('bad');
  expect(cw.commandCalls(PutMetricAlarmCommand)).toHaveLength(1);
});
