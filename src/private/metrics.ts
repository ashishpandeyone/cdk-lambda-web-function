import { Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

/** Per-function and per-endpoint metrics, published in the region that served the request. */
export const WEB_NAMESPACE = 'AWS/Lambda/Web';
/** Endpoint usage and throttling, with an `ExecutionRegion` dimension. */
export const USAGE_NAMESPACE = 'AWS/Lambda/Web/Usage';

export const REQUESTS = 'ExecutedRequests';
export const CLIENT_ERRORS = 'HTTPResponseStatusClass4XX';
export const SERVER_ERRORS = 'HTTPResponseStatusClass5XX';

/** How often CloudWatch receives these metrics; shorter periods have gaps. */
export const DEFAULT_PERIOD = Duration.minutes(1);

/**
 * A rate in percent: `errors` per `requests`. Error metrics only exist once they're non-zero, so missing error
 * data points count as 0; periods with fewer than `minimumRequests` requests count as 0 too.
 */
export function rateExpression(minimumRequests: number): string {
  const rate = '100 * FILL(errors, 0) / requests';
  return minimumRequests > 1 ? `IF(requests >= ${minimumRequests}, ${rate}, 0)` : rate;
}

export interface EndpointMetricIds {
  readonly functionName: string;
  readonly endpointName: string;
}

export function endpointDimensions(ids: EndpointMetricIds): cloudwatch.DimensionsMap {
  return { FunctionName: ids.functionName, EndpointName: ids.endpointName };
}

/** `requests` and `errors` metrics, plus the rate expression, as a PutMetricAlarm `Metrics` list (for alarms in other regions). */
export function rateAlarmQueries(ids: EndpointMetricIds, errorMetric: string, period: Duration, minimumRequests: number): unknown[] {
  const stat = (id: string, metricName: string) => ({
    Id: id,
    MetricStat: {
      Metric: {
        Namespace: WEB_NAMESPACE,
        MetricName: metricName,
        Dimensions: Object.entries(endpointDimensions(ids)).map(([Name, Value]) => ({ Name, Value })),
      },
      Period: period.toSeconds(),
      Stat: 'Sum',
    },
    ReturnData: false,
  });
  return [
    stat('requests', REQUESTS),
    stat('errors', errorMetric),
    { Id: 'rate', Expression: rateExpression(minimumRequests), Label: `${errorMetric} rate (%)`, ReturnData: true },
  ];
}
