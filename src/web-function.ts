import { Annotations, Arn, ArnFormat, type CfnResource, Duration, type IResource, Lazy, Names, RemovalPolicy, Resource, Stack, Token, TokenComparison, Validations } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { WebFunctionAuthType, WebFunctionEndpointType } from './enums';
import { WebFunctionCode } from './private/code';
import { WebFunctionLogGroup } from './private/log-group';
import { DEFAULT_PERIOD, WEB_NAMESPACE } from './private/metrics';
import { acknowledgeIamFindings } from './private/nag';
import { injectProps } from './private/property-injection';
import { ResourcePolicyStatements } from './private/resource-policy-statements';
import { RevisionCleanup } from './private/revision-cleanup';
import { CFN_VALIDATE_UNKNOWN_TYPE, assertResourceName } from './private/validation';
import { WebFunctionEndpoint, type AddWebFunctionEndpointOptions, type WebFunctionEndpointOptions } from './web-function-endpoint';
import { WebFunctionGrants } from './web-function-grants';
import { WebFunctionRevision, type IWebFunctionRevision } from './web-function-revision';

/** Endpoints per function (service quota, not adjustable). */
const MAX_ENDPOINTS = 10;

/**
 * Options shared by `WebFunction` and `NodejsWebFunction`: everything except how the code is supplied.
 */
export interface WebFunctionOptions {
  /**
   * How callers of the endpoint are authenticated.
   */
  readonly authType: WebFunctionAuthType;

  /**
   * The default endpoint (`fn.endpoint`): where it serves from, its name and limits.
   * It serves the current revision; route it elsewhere with `fn.endpoint.routeTraffic()`.
   * Add more endpoints with `addEndpoint`.
   *
   * @default - a HOME_REGION endpoint serving the current revision
   */
  readonly endpoint?: WebFunctionEndpointOptions;

  /**
   * How many of the newest revisions to keep (1-50). Each deployment that changes the code or
   * configuration creates a revision; older ones stay available to roll back to or route traffic to,
   * and the oldest beyond this count are deleted after each deployment.
   *
   * Revisions that an endpoint routes to are never deleted, and neither are those the previous
   * deployment used (a rollback returns to them).
   *
   * @default 20
   */
  readonly revisionRetention?: number;

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
   * A customer managed KMS key for the function's revisions: their code and environment variables.
   *
   * A `PER_REGION` or `MULTI_REGION` endpoint needs a **multi-Region key** with a replica in every region it serves
   * from, and each replica's policy must allow Lambda to decrypt (see `encryptionKeyPolicyStatement()`). A key defined
   * in this app gets that statement added to its own policy.
   *
   * Changing the key creates a new revision. Earlier revisions, including the ones kept as rollback targets, still
   * need their key.
   * [disable-awslint:prefer-ref-interface]
   *
   * @default - an AWS owned key
   */
  readonly encryptionKey?: kms.IKey;

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
 * A Lambda Web Function, created in this app (`WebFunction`) or imported (`WebFunction.fromWebFunctionArn`).
 *
 * `addToResourcePolicy` adds to the function's resource policy (who else may call or manage it). Each stack writes
 * only its own statements into the function's single policy, so any stack in the function's account can add them,
 * including one that imports the function. From another account, nothing is added (`statementAdded: false`).
 */
export interface IWebFunction extends IResource, lambda.IWebFunctionRef, iam.IResourceWithPolicy {
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

  /**
   * Allows `grantee` to call the function's endpoint (`lambda:InvokeWebFunctionEndpoint`): the default endpoint
   * of a `WebFunction`; for an imported function, the endpoint named in its attributes, or every endpoint.
   *
   * A grantee in the function's account gets an IAM policy statement; another account or an AWS service also gets a
   * statement in the function's resource policy (not when the function itself is in another account than this stack).
   * [disable-awslint:no-grants]
   */
  grantInvoke(grantee: iam.IGrantable): iam.Grant;

  /**
   * A metric of the function's execution environments in `AWS/Lambda/Web` (dimension `FunctionName`).
   */
  metric(metricName: string, props?: cloudwatch.MetricOptions): cloudwatch.Metric;

  /** Time the execution environments were active (`EnvironmentActiveTime`). */
  metricActiveTime(props?: cloudwatch.MetricOptions): cloudwatch.Metric;

  /** CPU time the execution environments used (`EnvironmentCPUTime`). */
  metricCpuTime(props?: cloudwatch.MetricOptions): cloudwatch.Metric;

  /** Requests an execution environment handled at once (`EnvironmentConcurrentRequests`, maximum). */
  metricConcurrentRequests(props?: cloudwatch.MetricOptions): cloudwatch.Metric;

  /** Peak memory an execution environment used (`EnvironmentMaxMemoryUsage`, maximum). */
  metricMaxMemoryUsage(props?: cloudwatch.MetricOptions): cloudwatch.Metric;

  /** Bytes sent in responses (`ResponseBytes`). */
  metricResponseBytes(props?: cloudwatch.MetricOptions): cloudwatch.Metric;
}

/**
 * Attributes of an existing Web Function. Give its ARN or its name.
 */
export interface WebFunctionAttributes {
  /**
   * The function's ARN, e.g. `arn:aws:lambda:us-east-1:111122223333:web-function/orders`. It may be in another
   * region or account; across accounts, `grantInvoke` also needs the function's resource policy to allow the caller.
   * A token (e.g. from another stack) is taken to be in this stack's account and region.
   *
   * @default - built from `webFunctionName`, in this stack's account and region
   */
  readonly webFunctionArn?: string;

  /**
   * The function's name.
   *
   * @default - taken from `webFunctionArn`
   */
  readonly webFunctionName?: string;

  /**
   * The endpoint `grantInvoke` allows calling.
   *
   * @default - every endpoint of the function
   */
  readonly endpointName?: string;
}

/**
 * Permission for a principal outside this account, an AWS service or an organization to call a function's endpoints.
 */
export interface WebFunctionPermission {
  /**
   * Who may call: an account (`iam.AccountPrincipal`), a role or user (`iam.ArnPrincipal`), an AWS service
   * (`iam.ServicePrincipal`, with `sourceArn` or `sourceAccount`) or an organization (`iam.OrganizationPrincipal`).
   *
   * A principal in another account also needs `lambda:InvokeWebFunctionEndpoint` in its own IAM policy.
   */
  readonly principal: iam.IPrincipal;

  /**
   * The endpoint the principal may call. It must belong to this function.
   *
   * @default - every endpoint of the function, including ones added later
   */
  readonly endpoint?: WebFunctionEndpoint;

  /**
   * For an AWS service: the ARN of the resource calling on its behalf (condition `aws:SourceArn`, `ArnLike`),
   * e.g. a CloudFront distribution. Without it or `sourceAccount`, any account's use of the service could call the endpoint.
   *
   * @default - no condition
   */
  readonly sourceArn?: string;

  /**
   * For an AWS service: the account that owns the resource calling on its behalf (condition `aws:SourceAccount`).
   *
   * @default - no condition
   */
  readonly sourceAccount?: string;
}

/**
 * What `WebFunction` and imported functions have in common.
 */
export abstract class WebFunctionBase extends Resource implements IWebFunction {
  public abstract readonly webFunctionName: string;
  public abstract readonly webFunctionArn: string;

  /** A reference to this function, for APIs that accept `lambda.IWebFunctionRef`. */
  public get webFunctionRef(): lambda.WebFunctionReference {
    return { functionArn: this.webFunctionArn };
  }

  /**
   * Allows `grantee` to call the function's endpoint.
   * [disable-awslint:no-grants]
   */
  public abstract grantInvoke(grantee: iam.IGrantable): iam.Grant;

  /**
   * Adds a statement to the function's resource policy, e.g. to let another account manage the function.
   * For invoking, prefer `addPermission` or `grantInvoke`.
   *
   * The function has a single resource policy. Each stack writes only its own statements into it, through a custom
   * resource that merges them with every other stack's, and with statements added outside CloudFormation. From a
   * stack in another account than the function, nothing is added.
   */
  public addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult {
    return this._addToResourcePolicyFrom(this, statement);
  }

  /**
   * Adds a statement to the function's resource policy from `scope`'s stack, e.g. the stack of a CloudFront
   * distribution that uses the function.
   *
   * @internal
   */
  public _addToResourcePolicyFrom(scope: Construct, statement: iam.PolicyStatement): iam.AddToResourcePolicyResult {
    const from = Stack.of(scope);
    if (Token.compareStrings(from.account, this.env.account) === TokenComparison.DIFFERENT) {
      Annotations.of(this).addWarningV2('@cdk-lambda-web:resourcePolicyFromOtherAccount',
        `A statement for the resource policy of a function in account ${this.env.account} was not added: stack ${from.stackName} is in account ${from.account}. Add it in the function's account.`);
      return { statementAdded: false };
    }
    const writer = ResourcePolicyStatements.of(scope, this, this.webFunctionArn);
    writer.add(statement);
    return { statementAdded: true, policyDependable: writer.resource };
  }

  /**
   * A metric of this function's execution environments in `AWS/Lambda/Web` (dimension `FunctionName`), across all endpoints.
   * For request and error counts, use the endpoint's metrics (`fn.endpoint.metricRequests()`).
   *
   * Metrics are published in the region that served the request: pass `region` for another serving region.
   * An alarm can only use metrics from its own stack's region.
   *
   * @default - sum over 1 minute, in the function's home region
   */
  public metric(metricName: string, props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    // An imported function in another region publishes its metrics there.
    const region = !Token.isUnresolved(this.env.region) && this.env.region !== Stack.of(this).region ? this.env.region : undefined;
    return new cloudwatch.Metric({
      namespace: WEB_NAMESPACE,
      metricName,
      dimensionsMap: { FunctionName: this.webFunctionName },
      statistic: cloudwatch.Stats.SUM,
      period: DEFAULT_PERIOD,
      region,
      ...props,
    });
  }

  /** Time the execution environments were active (`EnvironmentActiveTime`). */
  public metricActiveTime(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this.metric('EnvironmentActiveTime', props);
  }

  /** CPU time the execution environments used (`EnvironmentCPUTime`). */
  public metricCpuTime(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this.metric('EnvironmentCPUTime', props);
  }

  /**
   * Requests an execution environment handled at once (`EnvironmentConcurrentRequests`), to compare with
   * `maxConcurrencyPerEnvironment`.
   *
   * @default - maximum over 1 minute
   */
  public metricConcurrentRequests(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this.metric('EnvironmentConcurrentRequests', { statistic: cloudwatch.Stats.MAXIMUM, ...props });
  }

  /**
   * Peak memory an execution environment used (`EnvironmentMaxMemoryUsage`); each environment has 2 GB.
   *
   * @default - maximum over 1 minute
   */
  public metricMaxMemoryUsage(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this.metric('EnvironmentMaxMemoryUsage', { statistic: cloudwatch.Stats.MAXIMUM, ...props });
  }

  /** Bytes sent in responses (`ResponseBytes`). */
  public metricResponseBytes(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this.metric('ResponseBytes', props);
  }
}

/**
 * A Node.js HTTP server running as an AWS Lambda Web Function, served from one or more regions.
 *
 * Creates the function, its current revision (code and configuration; any change creates a new one,
 * and the newest `revisionRetention` are kept), a default HTTPS endpoint, an execution role, and owns
 * the function's log groups in every region its endpoints serve from.
 *
 * Use `fromWebFunctionArn`, `fromWebFunctionName` or `fromWebFunctionAttributes` for a function defined elsewhere.
 *
 * @resource AWS::Lambda::WebFunction
 */
export class WebFunction extends WebFunctionBase implements iam.IGrantable {
  /**
   * Identifies this class to property injectors (`PropertyInjectors.of(scope).add(...)`), which can set default props for
   * every `WebFunction` under a scope. Injectors for `WebFunction` also apply to `NodejsWebFunction`.
   */
  public static readonly PROPERTY_INJECTION_ID: string = '@ashishpandeyone/cdk-lambda-web-function.WebFunction';

  /**
   * Imports an existing Web Function by its ARN (in any region or account).
   */
  public static fromWebFunctionArn(scope: Construct, id: string, webFunctionArn: string): IWebFunction {
    return WebFunction.fromWebFunctionAttributes(scope, id, { webFunctionArn });
  }

  /**
   * Imports an existing Web Function in this stack's account and region by its name.
   */
  public static fromWebFunctionName(scope: Construct, id: string, webFunctionName: string): IWebFunction {
    return WebFunction.fromWebFunctionAttributes(scope, id, { webFunctionName });
  }

  /**
   * Imports an existing Web Function: give its ARN or its name, and optionally the endpoint `grantInvoke` allows.
   */
  public static fromWebFunctionAttributes(scope: Construct, id: string, attrs: WebFunctionAttributes): IWebFunction {
    return new ImportedWebFunction(scope, id, attrs);
  }

  public readonly webFunctionName: string;
  public readonly webFunctionArn: string;

  /** The ID of the current revision. Same as `currentRevision.revisionId`. */
  public readonly revisionId: string;

  /** The revision built from the current code and configuration. */
  public readonly currentRevision: IWebFunctionRevision;

  /** The default endpoint. Add more with `addEndpoint`. */
  public readonly endpoint: WebFunctionEndpoint;

  /** Grants on the default endpoint (e.g. `grants.invoke(principal)`). Other endpoints have their own `grants`. */
  public readonly grants: WebFunctionGrants;

  /** The execution role. */
  public readonly role: iam.IRole;

  /** The customer managed key of the function's revisions, if any. */
  public readonly encryptionKey?: kms.IKey;

  /** The principal to grant permissions to (the execution role). */
  public readonly grantPrincipal: iam.IPrincipal;

  /**
   * The home-region log group that receives the logs of every region the function serves from.
   * Subscribe to this one only: each region's `.local` group holds a copy of the same events.
   */
  public readonly logGroup: logs.ILogGroup;

  private readonly environment: { [key: string]: string } = {};
  private readonly endpoints: WebFunctionEndpoint[] = [];
  private readonly remoteLogGroups = new Map<string, WebFunctionLogGroup>();
  private readonly logGroupName: string;
  private readonly logOptions: Pick<WebFunctionProps, 'logRetention' | 'logRemovalPolicy'>;
  private readonly resource: lambda.CfnWebFunction;
  private readonly revisionCleanup: RevisionCleanup;
  private readonly permissionIds = new Set<string>();

  constructor(scope: Construct, id: string, props: WebFunctionProps) {
    super(scope, id);
    props = injectProps(WebFunction.PROPERTY_INJECTION_ID, props, scope, id);

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
    const revisionRetention = props.revisionRetention ?? 20;
    if (!Token.isUnresolved(revisionRetention) && (!Number.isInteger(revisionRetention) || revisionRetention < 1 || revisionRetention > 50)) {
      throw new Error(`${this.node.path}: revisionRetention must be an integer from 1 to 50, got ${revisionRetention}`);
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

    const logGroupName = `/aws/lambda/web/${this.webFunctionName}`;
    this.role = props.role ?? this.createRole(logGroupName);
    this.grantPrincipal = this.role;

    // Log groups first: the service would otherwise create them without retention.
    this.logGroupName = logGroupName;
    this.logOptions = { logRetention: props.logRetention, logRemovalPolicy: props.logRemovalPolicy };
    const logGroups = this.createLogGroups(logGroupName);
    this.logGroup = logs.LogGroup.fromLogGroupName(this, 'LogGroup', logGroupName);

    const code = new WebFunctionCode(this, 'Code', props.code).location;

    const fn = new lambda.CfnWebFunction(this, 'Resource', { functionName: this.webFunctionName });
    // The function is deleted before its log groups, which then wait for late flushes.
    for (const group of logGroups) fn.node.addDependency(group.resource);
    Validations.of(fn).acknowledge(CFN_VALIDATE_UNKNOWN_TYPE);
    this.resource = fn;
    this.webFunctionArn = fn.attrFunctionArn;

    this.encryptionKey = props.encryptionKey;
    if (this.encryptionKey) {
      // Only a key defined in this app takes the statement (an imported key's policy is managed elsewhere).
      this.encryptionKey.addToResourcePolicy(this.encryptionKeyPolicyStatement());
      this.node.addValidation({ validate: () => this.validateEncryptionKey() });
    }

    const revision = new lambda.CfnWebFunctionRevision(this, 'Revision', {
      functionName: fn.attrFunctionArn,
      kmsKeyArn: this.encryptionKey?.keyArn,
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
    // Replaced revisions stay as rollback targets; RevisionCleanup deletes the oldest. Deleting the function deletes them all.
    revision.applyRemovalPolicy(RemovalPolicy.RETAIN);
    this.revisionId = revision.attrRevisionId;
    this.currentRevision = WebFunctionRevision._current(this, 'CurrentRevision', this, revision.attrRevisionId, revision.attrRevisionArn);

    this.revisionCleanup = new RevisionCleanup(this, 'RevisionCleanup', {
      functionName: this.webFunctionName,
      functionArn: fn.attrFunctionArn,
      keep: revisionRetention,
      revisionIds: () => [this.currentRevision.revisionId, ...this.endpoints.flatMap((e) => e._revisionIds())],
    });

    this.endpoint = this.createEndpoint('Endpoint', { ...props.endpoint, authType: props.authType }, 'default');
    this.grants = this.endpoint.grants;
  }

  /**
   * Adds an endpoint (up to 10 per function), e.g. a public one next to an IAM-only one, or one pinned to an
   * earlier revision. Each endpoint has its own URL, authentication, regions and limits.
   *
   * @param id the endpoint's construct ID, also used in its generated name (`<id>-<hash>`)
   */
  public addEndpoint(id: string, options: AddWebFunctionEndpointOptions): WebFunctionEndpoint {
    const prefix = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 55).replace(/-+$/, '') || 'endpoint';
    return this.createEndpoint(id, options, prefix, id);
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

  /**
   * Allows a principal in another account, an AWS service or an organization to call the function's endpoints,
   * through the function's resource policy. For a role in this account, use `grantInvoke`.
   *
   * @param id the statement ID (`Sid`): letters and digits, unique within the function
   */
  public addPermission(id: string, permission: WebFunctionPermission): void {
    if (!Token.isUnresolved(id) && !/^[A-Za-z0-9]+$/.test(id)) {
      throw new Error(`${this.node.path}: permission id '${id}' must be letters and digits only (it is the statement's Sid)`);
    }
    if (this.permissionIds.has(id)) {
      throw new Error(`${this.node.path}: there is already a permission with id '${id}'`);
    }
    const endpoint = permission.endpoint;
    if (endpoint !== undefined && !this.endpoints.includes(endpoint)) {
      throw new Error(`${this.node.path}: the endpoint ${endpoint.node.path} belongs to another function`);
    }
    this.permissionIds.add(id);
    const statement = new iam.PolicyStatement({
      sid: id,
      principals: [permission.principal],
      actions: ['lambda:InvokeWebFunctionEndpoint'],
      resources: [endpoint?.endpointArn ?? `${this.webFunctionArn}/endpoint/*`],
    });
    if (permission.sourceArn !== undefined) statement.addCondition('ArnLike', { 'aws:SourceArn': permission.sourceArn });
    if (permission.sourceAccount !== undefined) statement.addCondition('StringEquals', { 'aws:SourceAccount': permission.sourceAccount });
    this.addToResourcePolicy(statement);
  }

  /**
   * The key-policy statement Lambda needs to start this function's environments with `encryptionKey`: `kms:Decrypt` for
   * `lambda.amazonaws.com`, limited to this function's revisions (`aws:SourceArn` and the encryption context Lambda sets).
   *
   * It's added to `encryptionKey` when the key is defined in this app. Add it to every replica of a multi-Region key
   * yourself: replicas don't share their primary's policy.
   */
  public encryptionKeyPolicyStatement(): iam.PolicyStatement {
    const revisions = Stack.of(this).formatArn({
      service: 'lambda', resource: 'web-function', resourceName: `${this.webFunctionName}/revision/*`, arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });
    return new iam.PolicyStatement({
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
      actions: ['kms:Decrypt'],
      resources: ['*'],
      conditions: {
        StringLike: { 'aws:SourceArn': revisions, 'kms:EncryptionContext:aws:lambda:WebFunctionRevisionArn': revisions },
      },
    });
  }

  /** Regional and multi-region endpoints need a multi-Region key: otherwise their other regions fail to activate. */
  private validateEncryptionKey(): string[] {
    const multi = this.endpoints.filter((e) => e.endpointType !== WebFunctionEndpointType.HOME_REGION);
    if (multi.length === 0 || isMultiRegionKey(this.encryptionKey!) !== false) return [];
    const typeName = (t: WebFunctionEndpointType) => (t === WebFunctionEndpointType.MULTI_REGION ? 'MULTI_REGION' : 'PER_REGION');
    return [`encryptionKey must be a multi-Region key (with a replica in every serving region) for ${multi.map((e) => `${e.node.id} (${typeName(e.endpointType)})`).join(', ')}: with a single-Region key, the endpoint fails to activate in its other regions and the deployment rolls back`];
  }

  private createEndpoint(id: string, options: AddWebFunctionEndpointOptions, namePrefix: string, nameSeed?: string): WebFunctionEndpoint {
    if (this.endpoints.length >= MAX_ENDPOINTS) {
      throw new Error(`${this.node.path}: a Web Function can have at most ${MAX_ENDPOINTS} endpoints`);
    }
    const endpoint = WebFunctionEndpoint._create(this, id, {
      ...options,
      webFunction: this,
      currentRevision: this.currentRevision,
      namePrefix,
      nameSeed,
    });
    const clash = this.endpoints.find((e) => !Token.isUnresolved(e.endpointName) && e.endpointName === endpoint.endpointName);
    if (clash) {
      throw new Error(`${endpoint.node.path}: endpointName '${endpoint.endpointName}' is already used by ${clash.node.path}`);
    }
    this.endpoints.push(endpoint);
    // Revisions an endpoint stops routing to only become deletable once it's updated.
    this.revisionCleanup.node.addDependency(endpoint);
    // Each serving region's .local group must exist before traffic, and outlive the function.
    for (const region of endpoint.regions.slice(1)) {
      if (this.remoteLogGroups.has(region)) continue;
      const group = this.logGroupIn(`LocalLogs-${region}`, region, `${this.logGroupName}.local`);
      this.remoteLogGroups.set(region, group);
      this.resource.node.addDependency(group.resource);
    }
    return endpoint;
  }

  /**
   * The default execution role: write to the function's own log groups only (the home region's and every region's
   * `.local` copy), the minimum AWS documents for Web Functions. Not `AWSLambdaBasicExecutionRole`, whose
   * `logs:CreateLogGroup` on `*` lets environments still shutting down re-create a deleted or renamed group.
   */
  private createRole(logGroupName: string): iam.Role {
    const stack = Stack.of(this);
    const logGroupArn = (region: string, name: string) => stack.formatArn({
      service: 'logs', region, resource: 'log-group', resourceName: `${name}:*`, arnFormat: ArnFormat.COLON_RESOURCE_NAME,
    });
    const role = new iam.Role(this, 'ServiceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        Logs: new iam.PolicyDocument({
          statements: [new iam.PolicyStatement({
            actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: [logGroupArn(stack.region, logGroupName), logGroupArn('*', `${logGroupName}.local`)],
          })],
        }),
      },
    });
    acknowledgeIamFindings(role.node.defaultChild as CfnResource, 'Log streams of this function\'s own log groups, in every region it serves from');
    return role;
  }

  private createLogGroups(logGroupName: string): WebFunctionLogGroup[] {
    const home = Stack.of(this).region;
    return [
      this.logGroupIn('Logs', home, logGroupName),
      this.logGroupIn('LocalLogs', home, `${logGroupName}.local`),
    ];
  }

  private logGroupIn(id: string, region: string, name: string): WebFunctionLogGroup {
    return new WebFunctionLogGroup(this, id, {
      region,
      logGroupName: name,
      retention: this.logOptions.logRetention ?? logs.RetentionDays.ONE_MONTH,
      removalPolicy: this.logOptions.logRemovalPolicy ?? RemovalPolicy.RETAIN,
    });
  }
}

/** A Web Function defined outside this app. */
class ImportedWebFunction extends WebFunctionBase {
  public readonly webFunctionName: string;
  public readonly webFunctionArn: string;
  private readonly endpointName?: string;

  constructor(scope: Construct, id: string, attrs: WebFunctionAttributes) {
    const arn = importedArn(scope, id, attrs);
    // A token ARN (e.g. a WebFunction in another stack, or Fn.importValue) is taken to be in this stack's account and
    // region, as its metrics already are: a grant to a role of this account then stays identity-only.
    super(scope, id, Token.isUnresolved(arn) ? {} : { environmentFromArn: arn });
    this.webFunctionArn = arn;
    this.webFunctionName = attrs.webFunctionName ?? Arn.split(arn, ArnFormat.SLASH_RESOURCE_NAME).resourceName!;
    if (attrs.endpointName !== undefined) assertResourceName(this, 'endpointName', attrs.endpointName);
    this.endpointName = attrs.endpointName;
  }

  public grantInvoke(grantee: iam.IGrantable): iam.Grant {
    return WebFunctionGrants._forEndpointArns([`${this.webFunctionArn}/endpoint/${this.endpointName ?? '*'}`], this).invoke(grantee);
  }
}

/** Whether a key is multi-Region, when that can be told at synthesis: its L1 in this app, or an `mrk-` key ID in its ARN. */
function isMultiRegionKey(key: kms.IKey): boolean | undefined {
  const cfn = key.node.defaultChild;
  if (cfn instanceof kms.CfnKey) {
    const multiRegion = Stack.of(cfn).resolve(cfn.multiRegion);
    return typeof multiRegion === 'boolean' ? multiRegion : multiRegion === undefined ? false : undefined;
  }
  if (Token.isUnresolved(key.keyArn)) return undefined;
  return /:key\/mrk-/.test(key.keyArn);
}

function importedArn(scope: Construct, id: string, attrs: WebFunctionAttributes): string {
  const path = `${scope.node.path}/${id}`;
  if ((attrs.webFunctionArn === undefined) === (attrs.webFunctionName === undefined)) {
    throw new Error(`${path}: give either webFunctionArn or webFunctionName`);
  }
  if (attrs.webFunctionName !== undefined) {
    if (!Token.isUnresolved(attrs.webFunctionName)) {
      // Validated against the scope, before the import exists.
      assertResourceName(scope, 'webFunctionName', attrs.webFunctionName);
    }
    return Stack.of(scope).formatArn({
      service: 'lambda', resource: 'web-function', resourceName: attrs.webFunctionName, arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
    });
  }
  const arn = attrs.webFunctionArn!;
  if (!Token.isUnresolved(arn) && !/^arn:[^:]+:lambda:[a-z0-9-]+:\d{12}:web-function\/[A-Za-z0-9_-]{1,64}$/.test(arn)) {
    throw new Error(`${path}: '${arn}' is not a Web Function ARN (arn:<partition>:lambda:<region>:<account>:web-function/<name>)`);
  }
  return arn;
}
