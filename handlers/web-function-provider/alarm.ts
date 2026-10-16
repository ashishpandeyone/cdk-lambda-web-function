import { CloudWatchClient, DeleteAlarmsCommand, PutMetricAlarmCommand, type ComparisonOperator } from '@aws-sdk/client-cloudwatch';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import type { HandlerResponse } from './index';
import type { RegionalAlarmProperties } from '../../src/private/provider-protocol';

export const retry = { delaySeconds: 15, attempts: 8 };

const clients = new Map<string, CloudWatchClient>();
function cloudwatchIn(region: string): CloudWatchClient {
  let client = clients.get(region);
  if (!client) {
    client = new CloudWatchClient({ region });
    clients.set(region, client);
  }
  return client;
}

/**
 * Owns one metric alarm in one region. Physical id = `<region>:<name>`, so a new name or region is a replacement
 * and CloudFormation deletes the old alarm in its cleanup phase; anything else updates the alarm in place.
 */
export async function handleRegionalAlarm(event: CloudFormationCustomResourceEvent): Promise<HandlerResponse> {
  const props = event.ResourceProperties as unknown as RegionalAlarmProperties;

  if (event.RequestType === 'Delete') {
    const [region, ...name] = event.PhysicalResourceId.split(':');
    // DeleteAlarms succeeds for alarms that don't exist.
    if (name.length > 0) await cloudwatchIn(region).send(new DeleteAlarmsCommand({ AlarmNames: [name.join(':')] }));
    return { PhysicalResourceId: event.PhysicalResourceId };
  }

  const put = new PutMetricAlarmCommand({
    AlarmName: props.AlarmName,
    AlarmDescription: props.AlarmDescription,
    Metrics: JSON.parse(props.Metrics),
    Threshold: Number(props.Threshold),
    EvaluationPeriods: Number(props.EvaluationPeriods),
    ComparisonOperator: props.ComparisonOperator as ComparisonOperator,
    TreatMissingData: props.TreatMissingData,
    ActionsEnabled: false,
  });
  // The provider's alarm permission can arrive in the same deployment (upgrading from an earlier version), and IAM
  // takes a while to propagate.
  for (let attempt = 1; ; attempt++) {
    try {
      await cloudwatchIn(props.Region).send(put);
      break;
    } catch (e) {
      if (!/AccessDenied/.test((e as Error).name) || attempt >= retry.attempts) throw e;
      await new Promise((r) => setTimeout(r, retry.delaySeconds * 1000));
    }
  }
  return { PhysicalResourceId: `${props.Region}:${props.AlarmName}` };
}
