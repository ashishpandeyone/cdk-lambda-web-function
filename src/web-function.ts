import { Duration, type IResource, Lazy, Names, RemovalPolicy, Resource, Stack, Token, Validations } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { WebFunctionAuthType } from './enums';
import { WebFunctionCode } from './private/code';
import { WebFunctionLogGroup } from './private/log-group';
import { CFN_VALIDATE_UNKNOWN_TYPE, assertResourceName } from './private/validation';
import { WebFunctionEndpoint, type WebFunctionEndpointOptions } from './web-function-endpoint';
import { WebFunctionGrants } from './web-function-grants';

/**
 * Options shared by `WebFunction` and `NodejsWebFunction`: everything except how the code is supplied.
 */
export interface WebFunctionOptions {
  /**
   * How callers of the endpoint are authenticated.
   */
  readonly authType: WebFunctionAuthType;

  /**
   * The endpoint: where it serves from, and its name.
   *
   * @default - a HOME_REGION endpoint
   */
  readonly endpoint?: WebFunctionEndpointOptions;

  /**
   * The function's name. Renaming a function replaces it, and its endpoint gets a new URL.
   *
   * @default - a unique name generated from the construct path (moving the construct changes it)
   */
  readonly webFunctionName?: string;

  /**
   * A description of the function's code and configuration.
   *
   * @default - no description
   */
  readonly description?: string;

  /**
   * The execution role.
   *
   * An `iam.IRole` (not `IRoleRef`) because the function adds statements to it and grants through it.
   * [disable-awslint:prefer-ref-interface]
   *
   * @default - a role trusting `lambda.amazonaws.com` with `AWSLambdaBasicExecutionRole`
   */
  readonly role?: iam.IRole;

  /**
   * Environment variables. Names starting with `AWS_` are reserved.
   *
   * @default - none
   */
  readonly environment?: { [key: string]: string };

  /**
   * How long a single request may run.
   *
   * @default Duration.seconds(30)
   */
  readonly timeout?: Duration;

  /**
   * How many requests one execution environment handles at the same time (1-128).
   * Requests share module-level state, so handlers must be concurrency-safe.
   *
   * @default 64
   */
  readonly maxConcurrencyPerEnvironment?: number;

  /**
   * Retention for every log group of the function, in every region it serves from.
   *
   * @default logs.RetentionDays.ONE_MONTH
   */
  readonly logRetention?: logs.RetentionDays;

  /**
   * What happens to the log groups when the function is removed: RETAIN or DESTROY.
   * With DESTROY, deletion waits about a minute for environments to flush their last lines.
   *
   * @default RemovalPolicy.RETAIN
   */
  readonly logRemovalPolicy?: RemovalPolicy;

  /**
   * The minimum level of application logs to keep.
   *
   * @default lambda.ApplicationLogLevel.INFO
   */
  readonly applicationLogLevelV2?: lambda.ApplicationLogLevel;

  /**
   * The minimum level of platform logs to keep (DEBUG, INFO or WARN).
   *
   * @default lambda.SystemLogLevel.INFO
   */
  readonly systemLogLevelV2?: lambda.SystemLogLevel;
}

/**
 * Properties for a `WebFunction`.
 */
export interface WebFunctionProps extends WebFunctionOptions {
  /**
   * The Node.js runtime, e.g. `lambda.Runtime.NODEJS_24_X`.
   */
  readonly runtime: lambda.Runtime;

  /**
   * The code: a zip in S3 (`Code.fromAsset`, `Code.fromBucket`, `Code.fromCustomCommand`, `Code.fromDockerBuild`).
   * Inline code and container images aren't supported.
   *
   * The code is copied into the stack's code bucket, which Lambda Web Functions can read.
   */
  readonly code: lambda.Code;

  /**
   * The file that starts your server, relative to the root of the code.
   *
   * @default 'index.js'
   */
  readonly entrypoint?: string;

}

/**
 * A Lambda Web Function.
 */
export interface IWebFunction extends IResource, lambda.IWebFunctionRef {
  /**
   * The function's name.
   *
   * @attribute
   */
  readonly webFunctionName: string;

  /**
   * The function's ARN.
   *
   * @attribute
   */
  readonly webFunctionArn: string;
}

/**
 * A Node.js HTTP server running as an AWS Lambda Web Function, served from one or more regions.
 *
 * Creates the function, its current revision (code and configuration; any change replaces it),
 * an HTTPS endpoint, an execution role, and owns the function's log groups in every region.
 *
 * Importing existing functions (`fromXxx` methods) is planned after 0.1.
 *
 * @resource AWS::Lambda::WebFunction
 */
export class WebFunction extends Resource implements IWebFunction, iam.IGrantable {
  public readonly webFunctionName: string;
  public readonly webFunctionArn: string;

  /** The ID of the current revision. */
  public readonly revisionId: string;

  /** The function's endpoint. */
  public readonly endpoint: WebFunctionEndpoint;

  /** Grants on the function (e.g. `grants.invoke(principal)`). */
  public readonly grants: WebFunctionGrants;

  /** The execution role. */
  public readonly role: iam.IRole;

  /** The principal to grant permissions to (the execution role). */
  public readonly grantPrincipal: iam.IPrincipal;

  /**
   * The home-region log group that receives the logs of every region the function serves from.
   * Subscribe to this one only: each region's `.local` group holds a copy of the same events.
   */
  public readonly logGroup: logs.ILogGroup;

  private readonly environment: { [key: string]: string } = {};

  /** A reference to this function, for APIs that accept `lambda.IWebFunctionRef`. */
  public get webFunctionRef(): lambda.WebFunctionReference {
    return { functionArn: this.webFunctionArn };
  }

  constructor(scope: Construct, id: string, props: WebFunctionProps) {
    super(scope, id);

    if (props.runtime.family !== lambda.RuntimeFamily.NODEJS) {
      throw new Error(`${this.node.path}: Lambda Web Functions run Node.js only, got ${props.runtime.name}`);
    }
    const timeout = props.timeout?.toSeconds() ?? 30;
    if (!Token.isUnresolved(timeout) && (timeout < 3 || timeout > 900)) {
      throw new Error(`${this.node.path}: timeout must be between 3 seconds and 15 minutes, got ${timeout}s`);
    }
    const maxConcurrency = props.maxConcurrencyPerEnvironment;
    const validConcurrency = (n: number) => Number.isInteger(n) && n >= 1 && n <= 128;
    if (maxConcurrency !== undefined && !Token.isUnresolved(maxConcurrency) && !validConcurrency(maxConcurrency)) {
      throw new Error(`${this.node.path}: maxConcurrencyPerEnvironment must be an integer from 1 to 128, got ${maxConcurrency}`);
    }
    const systemLogLevels = [lambda.SystemLogLevel.DEBUG, lambda.SystemLogLevel.INFO, lambda.SystemLogLevel.WARN];
    if (props.systemLogLevelV2 !== undefined && !systemLogLevels.includes(props.systemLogLevelV2)) {
      throw new Error(`${this.node.path}: systemLogLevelV2 must be DEBUG, INFO or WARN for Lambda Web Functions`);
    }

    this.webFunctionName = props.webFunctionName ?? Names.uniqueResourceName(this, { maxLength: 64, separator: '-' });
    assertResourceName(this, 'webFunctionName', this.webFunctionName);

    for (const [key, value] of Object.entries(props.environment ?? {})) {
      this.addEnvironment(key, value);
    }
    if (props.entrypoint !== undefined) {
      this.environment.AWS_LAMBDA_NODEJS_ENTRYPOINT = props.entrypoint;
    }

    this.role = props.role ?? new iam.Role(this, 'ServiceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
    });
    this.grantPrincipal = this.role;

    // Log groups first: the service would otherwise create them without retention.
    const logGroupName = `/aws/lambda/web/${this.webFunctionName}`;
    const logGroups = this.createLogGroups(logGroupName, props);
    this.logGroup = logs.LogGroup.fromLogGroupName(this, 'LogGroup', logGroupName);

    const code = new WebFunctionCode(this, 'Code', props.code).location;

    const fn = new lambda.CfnWebFunction(this, 'Resource', { functionName: this.webFunctionName });
    // The function is deleted before its log groups, which then wait for late flushes.
    for (const group of logGroups) fn.node.addDependency(group.resource);
    Validations.of(fn).acknowledge(CFN_VALIDATE_UNKNOWN_TYPE);
    this.webFunctionArn = fn.attrFunctionArn;

    const revision = new lambda.CfnWebFunctionRevision(this, 'Revision', {
      functionName: fn.attrFunctionArn,
      description: props.description,
      buildConfig: {
        codeConfig: { s3Object: { bucket: code.bucketName, key: code.objectKey, versionId: code.objectVersion } },
        runtimeConfig: { runtime: props.runtime.name },
      },
      serviceConfig: {
        executionRoleArn: this.role.roleArn,
        environmentVariables: Lazy.any({ produce: () => (Object.keys(this.environment).length > 0 ? { ...this.environment } : undefined) }),
        timeoutSeconds: timeout,
        maxConcurrencyPerEnvironment: maxConcurrency,
        telemetryConfig: {
          loggingConfig: {
            logGroup: logGroupName,
            applicationLogLevel: props.applicationLogLevelV2,
            systemLogLevel: props.systemLogLevelV2,
          },
        },
      },
    });
    // Wait for the role's policies, so the first environment starts with its permissions.
    revision.node.addDependency(this.role);
    Validations.of(revision).acknowledge(CFN_VALIDATE_UNKNOWN_TYPE);
    this.revisionId = revision.attrRevisionId;

    this.endpoint = WebFunctionEndpoint._create(this, 'Endpoint', {
      ...props.endpoint,
      functionName: this.webFunctionName,
      functionArn: fn.attrFunctionArn,
      revisionId: revision.attrRevisionId,
      authType: props.authType,
    });

    this.grants = WebFunctionGrants._forEndpoint(this.endpoint);

    // Remote regions' .local groups can only be created once the regions are known.
    for (const group of this.createRemoteLogGroups(logGroupName, props)) fn.node.addDependency(group.resource);
  }

  /**
   * Adds an environment variable. Names starting with `AWS_` are reserved.
   */
  public addEnvironment(key: string, value: string): WebFunction {
    if (key.startsWith('AWS_')) {
      throw new Error(`${this.node.path}: environment variable ${key} is reserved (names starting with AWS_ are set by the runtime)${key === 'AWS_LAMBDA_NODEJS_ENTRYPOINT' ? '; use the entrypoint property' : ''}`);
    }
    this.environment[key] = value;
    return this;
  }

  /**
   * Adds a statement to the execution role's policy.
   */
  public addToRolePolicy(statement: iam.PolicyStatement): void {
    this.role.addToPrincipalPolicy(statement);
  }

  /**
   * Allows `grantee` to call the endpoint. Shortcut for `grants.invoke(grantee)`, as on `lambda.Function`.
   * [disable-awslint:no-grants]
   */
  public grantInvoke(grantee: iam.IGrantable): iam.Grant {
    return this.grants.invoke(grantee);
  }

  private createLogGroups(logGroupName: string, props: WebFunctionProps): WebFunctionLogGroup[] {
    const home = Stack.of(this).region;
    return [
      this.logGroupIn('Logs', home, logGroupName, props),
      this.logGroupIn('LocalLogs', home, `${logGroupName}.local`, props),
    ];
  }

  private createRemoteLogGroups(logGroupName: string, props: WebFunctionProps): WebFunctionLogGroup[] {
    return this.endpoint.regions.slice(1).map((region) => this.logGroupIn(`LocalLogs-${region}`, region, `${logGroupName}.local`, props));
  }

  private logGroupIn(id: string, region: string, name: string, props: WebFunctionProps): WebFunctionLogGroup {
    return new WebFunctionLogGroup(this, id, {
      region,
      logGroupName: name,
      retention: props.logRetention ?? logs.RetentionDays.ONE_MONTH,
      removalPolicy: props.logRemovalPolicy ?? RemovalPolicy.RETAIN,
    });
  }
}
