import { ArnFormat, CustomResource, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { grantToProvider, webFunctionProvider } from './provider';
import { LOG_GROUP_RESOURCE_TYPE, type LogGroupProperties } from './provider-protocol';

/** Seconds to wait before deleting a group; verified against late flushes in every region. */
export const FLUSH_WAIT_SECONDS = 75;
const RECHECK_WAIT_SECONDS = 30;

export interface WebFunctionLogGroupProps {
  readonly region: string;
  readonly logGroupName: string;
  readonly retention: logs.RetentionDays;
  readonly removalPolicy: RemovalPolicy;
}

/** One Web Function log group in one (possibly remote) region, owned through the provider. */
export class WebFunctionLogGroup extends Construct {
  public readonly region: string;
  public readonly logGroupName: string;
  public readonly resource: CustomResource;

  constructor(scope: Construct, id: string, props: WebFunctionLogGroupProps) {
    super(scope, id);
    if (props.removalPolicy !== RemovalPolicy.RETAIN && props.removalPolicy !== RemovalPolicy.DESTROY) {
      throw new Error(`${this.node.path}: logRemovalPolicy must be RETAIN or DESTROY, got ${props.removalPolicy}`);
    }
    this.region = props.region;
    this.logGroupName = props.logGroupName;

    const stack = Stack.of(this);
    const provider = webFunctionProvider(this);
    // Stable grant (see grantToProvider): Web Function log groups of this account, in any region. Per-name or
    // per-region grants break when a region is removed (CloudFormation reverts or updates the role first).
    const webLogGroups = stack.formatArn({ service: 'logs', region: '*', resource: 'log-group', resourceName: '/aws/lambda/web/*', arnFormat: ArnFormat.COLON_RESOURCE_NAME });
    grantToProvider(provider, {
      Action: ['logs:CreateLogGroup', 'logs:PutRetentionPolicy', 'logs:DeleteRetentionPolicy', 'logs:DeleteLogGroup'],
      Resource: webLogGroups,
    });
    grantToProvider(provider, {
      Action: 'logs:DescribeLogGroups',
      Resource: stack.formatArn({ service: 'logs', region: '*', resource: 'log-group', resourceName: '*', arnFormat: ArnFormat.COLON_RESOURCE_NAME }),
    });

    const properties: LogGroupProperties = {
      Region: props.region,
      LogGroupName: props.logGroupName,
      RetentionInDays: props.retention === logs.RetentionDays.INFINITE ? 'Infinite' : String(props.retention),
      RemovalPolicy: props.removalPolicy === RemovalPolicy.DESTROY ? 'destroy' : 'retain',
      FlushWaitSeconds: String(FLUSH_WAIT_SECONDS),
      RecheckWaitSeconds: String(RECHECK_WAIT_SECONDS),
    };
    this.resource = new CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      resourceType: LOG_GROUP_RESOURCE_TYPE,
      properties: { ...properties },
    });
  }
}
