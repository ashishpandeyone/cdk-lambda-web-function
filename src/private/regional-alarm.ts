import { ArnFormat, CustomResource, Stack } from 'aws-cdk-lib';
import type * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { webFunctionProvider } from './provider';
import { ALARM_NAME_PREFIX, REGIONAL_ALARM_RESOURCE_TYPE, type RegionalAlarmProperties } from './provider-protocol';

export { ALARM_NAME_PREFIX };

export interface RegionalAlarmProps {
  readonly region: string;
  /** Must start with `ALARM_NAME_PREFIX`. */
  readonly alarmName: string;
  readonly alarmDescription: string;
  /** PutMetricAlarm's `Metrics` (MetricDataQuery list). */
  readonly metrics: unknown[];
  readonly threshold: number;
  readonly evaluationPeriods: number;
  readonly comparisonOperator: cloudwatch.ComparisonOperator;
  readonly treatMissingData: cloudwatch.TreatMissingData;
}

/** A metric alarm in another region, owned through the provider. */
export class RegionalAlarm extends Construct {
  public readonly alarmArn: string;
  public readonly resource: CustomResource;

  constructor(scope: Construct, id: string, props: RegionalAlarmProps) {
    super(scope, id);
    if (!props.alarmName.startsWith(ALARM_NAME_PREFIX)) {
      throw new Error(`${this.node.path}: alarm names must start with ${ALARM_NAME_PREFIX}`);
    }
    const stack = Stack.of(this);
    // The provider may manage this library's alarms in any region (granted with the provider, see webFunctionProvider).
    const provider = webFunctionProvider(this);

    const properties: RegionalAlarmProperties = {
      Region: props.region,
      AlarmName: props.alarmName,
      AlarmDescription: props.alarmDescription,
      Metrics: JSON.stringify(props.metrics),
      Threshold: String(props.threshold),
      EvaluationPeriods: String(props.evaluationPeriods),
      ComparisonOperator: props.comparisonOperator,
      TreatMissingData: props.treatMissingData,
    };
    this.resource = new CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      resourceType: REGIONAL_ALARM_RESOURCE_TYPE,
      properties: { ...properties },
    });
    this.alarmArn = stack.formatArn({ service: 'cloudwatch', region: props.region, resource: 'alarm', resourceName: props.alarmName, arnFormat: ArnFormat.COLON_RESOURCE_NAME });
  }
}
