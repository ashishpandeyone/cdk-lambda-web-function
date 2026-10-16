import { createHash } from 'node:crypto';
import * as path from 'node:path';
import { ArnFormat, CustomResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { TRAFFIC_SHIFT_RESOURCE_TYPE, type TrafficShiftProperties } from './provider-protocol';
import type { WebFunctionDeployment } from '../web-function-deployment';

/** The Provider framework gives up after this long and fails the deployment (with a message), before CloudFormation's own 1-hour limit. */
const TOTAL_TIMEOUT = Duration.minutes(55);
const PROVIDER_ID = 'LambdaWebDeploymentProvider';

/**
 * The stack's deployment provider: a CDK Provider framework (a Step Functions waiter) around `onEvent` and `isComplete`
 * from `handlers/web-function-deployment`, because a canary or linear deployment can run for up to an hour.
 * One per stack, shared by every endpoint that deploys in steps.
 */
class DeploymentProvider extends Construct {
  public static of(scope: Construct): DeploymentProvider {
    const stack = Stack.of(scope);
    return (stack.node.tryFindChild(PROVIDER_ID) as DeploymentProvider | undefined) ?? new DeploymentProvider(stack, PROVIDER_ID);
  }

  public readonly serviceToken: string;
  private readonly role: iam.Role;
  private readonly granted = new Set<string>();

  private constructor(scope: Construct, id: string) {
    super(scope, id);
    this.role = new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
    });
    // Rollback detection: is the stack rolling back? (the provider's own stack only).
    this.grant({ actions: ['cloudformation:DescribeStacks'], resources: [Stack.of(this).stackId] });
    // Composite alarms are only returned with DescribeAlarms on '*'.
    this.grant({ actions: ['cloudwatch:DescribeAlarms'], resources: ['*'] });

    const logGroup = new logs.LogGroup(this, 'Logs', { retention: logs.RetentionDays.ONE_MONTH, removalPolicy: RemovalPolicy.DESTROY });
    const handler = (name: string, handlerName: string, description: string) => new lambda.Function(this, name, {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'assets', 'web-function-deployment')),
      handler: `index.${handlerName}`,
      role: this.role,
      // isComplete waits up to 5 minutes for a restore to reach every region before failing the deployment.
      timeout: Duration.minutes(7),
      memorySize: 256,
      logGroup,
      description,
    });
    const provider = new cr.Provider(this, 'Provider', {
      onEventHandler: handler('OnEvent', 'onEvent', 'Starts canary and linear deployments of Lambda Web Function endpoints'),
      isCompleteHandler: handler('IsComplete', 'isComplete', 'Moves Lambda Web Function endpoint traffic step by step and watches alarms'),
      queryInterval: Duration.seconds(15),
      totalTimeout: TOTAL_TIMEOUT,
      logGroup,
    });
    this.serviceToken = provider.serviceToken;
  }

  /**
   * Adds a statement to the handlers' role, once. Like the shared provider's grants, they must be stable across
   * updates (prefixes, not names that change) and never reference attributes of resources that use the provider.
   */
  public grant(statement: { actions: string[]; resources: string[] }): void {
    const key = JSON.stringify(Stack.of(this).resolve(statement));
    if (this.granted.has(key)) return;
    this.granted.add(key);
    this.role.addToPrincipalPolicy(new iam.PolicyStatement(statement));
  }
}

export interface TrafficShiftProps {
  /** Literal function name, for stable IAM grants. */
  readonly functionName: string;
  readonly functionArn: string;
  readonly endpointName: string;
  readonly revisionId: string;
  readonly deployment: WebFunctionDeployment;
  /** The endpoint's other settings: any change makes the shift run, so it can re-check the traffic before CloudFormation writes it. */
  readonly endpointConfig: unknown;
}

/**
 * Moves an endpoint's traffic to `revisionId` in steps before CloudFormation updates the endpoint (which must depend on it).
 */
export class TrafficShift extends Construct {
  public readonly resource: CustomResource;

  constructor(scope: Construct, id: string, props: TrafficShiftProps) {
    super(scope, id);
    const stack = Stack.of(this);
    const provider = DeploymentProvider.of(this);
    const functionArn = stack.formatArn({
      service: 'lambda', resource: 'web-function', resourceName: props.functionName, arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });
    // Stable grant (see grantToProvider): every endpoint and revision of the function.
    provider.grant({
      actions: ['lambda:GetWebFunctionEndpoint', 'lambda:UpdateWebFunctionEndpoint'],
      resources: [functionArn, `${functionArn}/endpoint/*`, `${functionArn}/revision/*`],
    });

    const deployment = props.deployment;
    const properties: TrafficShiftProperties = {
      FunctionArn: props.functionArn,
      EndpointName: props.endpointName,
      RevisionId: props.revisionId,
      Steps: deployment._steps.join(','),
      WaitSeconds: String(deployment._waitSeconds),
      AlarmArns: deployment._alarms.length > 0 ? deployment._alarms.map((a) => a.alarmArn) : undefined,
      EndpointConfig: createHash('sha256').update(JSON.stringify(stack.resolve(props.endpointConfig))).digest('hex').slice(0, 16),
    };
    this.resource = new CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      resourceType: TRAFFIC_SHIFT_RESOURCE_TYPE,
      properties: { ...properties },
      // CloudFormation's maximum; the provider fails the deployment itself after 55 minutes.
      serviceTimeout: Duration.hours(1),
    });
  }
}
