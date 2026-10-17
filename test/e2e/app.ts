/**
 * CDK app for the live end-to-end tests (see run.ts). Built from the library source.
 * Context: scenario, endpointType (HOME_REGION | MULTI_REGION | PER_REGION), regions (JSON), auth (AWS_IAM | NONE), version (v1 | v2),
 * kind (web | nodejs: NodejsWebFunction bundling test/fixtures/nodejs/server.ts), bundling (local | docker: forceDockerBundling),
 * appVersion (APP_VERSION, default: version), retention (revisionRetention), endpoints (many: adds Public and Global endpoints),
 * stable (revision ID for a Stable endpoint), split (revision ID that keeps 50% of the default endpoint),
 * deployment (progressive: canary on the default endpoint watching the ForcedErrors alarm, and a linear Public endpoint;
 * rollbackOn: a 50% canary that rolls back on the endpoint's own 5XX rate), fail (true: the v1 server answers 500),
 * permissions (on: a caller allowed by the resource policy alone, plus CloudFront statements; none: the caller role without them),
 * cdn (true: a CloudFront distribution in a second stack in us-east-1, WebFnE2E-<scenario>-Cdn, with WebFunctionOrigin: / → the default
 * PER_REGION endpoint in us-east-1, /home/* → its home region, /global/* → a MULTI_REGION endpoint).
 */
import * as path from 'node:path';
import { App, CfnOutput, CfnResource, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import {
  NodejsWebFunction, WebFunction, WebFunctionAuthType, WebFunctionDeployment, WebFunctionEndpointType, WebFunctionOrigin, WebFunctionRevision,
  type WebFunctionOptions,
} from '../../src';

export const HOME_REGION = 'ap-south-1';

const app = new App();
const ctx = (key: string, fallback?: string): string | undefined => app.node.tryGetContext(key) ?? fallback;
const scenario = ctx('scenario');
const endpointType = WebFunctionEndpointType[ctx('endpointType', 'HOME_REGION') as keyof typeof WebFunctionEndpointType];
const regions: string[] = JSON.parse(ctx('regions', '[]')!);
const version = ctx('version', 'v1')!;
const retention = ctx('retention');

const stack = new Stack(app, `WebFnE2E-${scenario}`, { env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: HOME_REGION } });

// The test forces a rollback by publishing a data point to this metric during a canary.
const progressive = ctx('deployment') === 'progressive';
const rollbackOn = ctx('deployment') === 'rollbackOn';
const forcedErrors = progressive ? new cloudwatch.Alarm(stack, 'ForcedErrors', {
  metric: new cloudwatch.Metric({ namespace: `WebFnE2E/${scenario}`, metricName: 'ForcedErrors', statistic: 'Maximum', period: Duration.minutes(1) }),
  threshold: 1,
  evaluationPeriods: 1,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
}) : undefined;

const options: WebFunctionOptions = {
  authType: WebFunctionAuthType[ctx('auth', 'AWS_IAM') as keyof typeof WebFunctionAuthType],
  endpoint: {
    endpointType,
    regions,
    deployment: forcedErrors ? WebFunctionDeployment.canary({ percent: 20, bake: Duration.minutes(2), alarms: [forcedErrors] })
      : rollbackOn ? WebFunctionDeployment.canary({
        percent: 50, bake: Duration.minutes(8), rollbackOn: { serverErrorRate: 10, minimumRequests: 5, evaluationPeriods: 1 },
      })
        : undefined,
  },
  environment: { APP_VERSION: ctx('appVersion', version)!, ...(ctx('fail') === 'true' ? { FAIL: 'true' } : {}) },
  revisionRetention: retention ? Number(retention) : undefined,
  logRetention: logs.RetentionDays.ONE_WEEK,
  logRemovalPolicy: RemovalPolicy.DESTROY,
};
const fn = ctx('kind', 'web') === 'nodejs'
  ? new NodejsWebFunction(stack, 'Api', {
    ...options,
    entry: path.join(__dirname, '..', 'fixtures', 'nodejs', 'server.ts'),
    bundling: { forceDockerBundling: ctx('bundling', 'local') === 'docker' },
  })
  : new WebFunction(stack, 'Api', {
    ...options,
    runtime: lambda.Runtime.NODEJS_24_X,
    code: lambda.Code.fromAsset(path.join(__dirname, '..', 'fixtures', 'e2e', version)),
  });

// A caller with the grant, and one without (negative control).
const consumer = new iam.Role(stack, 'Consumer', { assumedBy: new iam.AccountRootPrincipal() });
fn.grants.invoke(consumer);
const outsider = new iam.Role(stack, 'Outsider', { assumedBy: new iam.AccountRootPrincipal() });
// A caller granted through an import of the same function (every endpoint).
const importer = new iam.Role(stack, 'Importer', { assumedBy: new iam.AccountRootPrincipal() });
WebFunction.fromWebFunctionArn(stack, 'Imported', fn.webFunctionArn).grantInvoke(importer);

const out = (id: string, value: string) => new CfnOutput(stack, id, { value });
out('FunctionName', fn.webFunctionName);
out('LogGroupName', fn.logGroup.logGroupName);
out('EndpointName', fn.endpoint.endpointName);
out('Url', fn.endpoint.url);
out('Regions', JSON.stringify(fn.endpoint.regions));
out('RevisionId', fn.revisionId);
out('ConsumerRoleArn', consumer.roleArn);
out('OutsiderRoleArn', outsider.roleArn);
out('ImporterRoleArn', importer.roleArn);
if (endpointType === WebFunctionEndpointType.PER_REGION) {
  for (const region of fn.endpoint.regions) out(`Url${region.replace(/-/g, '')}`, fn.endpoint.regionalUrl(region));
}

if (ctx('endpoints') === 'many') {
  const pub = fn.addEndpoint('Public', { authType: WebFunctionAuthType.NONE, rateLimit: 100, description: 'public' });
  const global = fn.addEndpoint('Global', {
    authType: WebFunctionAuthType.AWS_IAM, endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1'], maxEnvironments: 4,
  });
  global.grantInvoke(consumer);
  out('PublicUrl', pub.url);
  out('GlobalUrl', global.url);
  out('GlobalEndpointName', global.endpointName);

  const stable = ctx('stable');
  if (stable) {
    const revision = WebFunctionRevision.fromRevisionAttributes(stack, 'StableRevision', { webFunction: fn, revisionId: stable });
    out('StableUrl', fn.addEndpoint('Stable', { authType: WebFunctionAuthType.NONE, revision }).url);
  }
  const split = ctx('split');
  if (split) {
    const previous = WebFunctionRevision.fromRevisionAttributes(stack, 'SplitRevision', { webFunction: fn, revisionId: split });
    fn.endpoint.routeTraffic(previous, [{ revision: fn.currentRevision, weight: 0.5 }]);
  }
}

if (forcedErrors) {
  const pub = fn.addEndpoint('Public', {
    authType: WebFunctionAuthType.NONE,
    deployment: WebFunctionDeployment.linear({ percent: 50, interval: Duration.minutes(1) }),
  });
  out('PublicUrl', pub.url);
  out('PublicEndpointName', pub.endpointName);
  out('AlarmName', forcedErrors.alarmName);
}

if (rollbackOn) out('HomeRollbackAlarm', fn.endpoint.rollbackAlarms[0].alarmName);

if (ctx('cdn') === 'true') {
  const global = fn.addEndpoint('Global', {
    authType: WebFunctionAuthType.AWS_IAM, endpointType: WebFunctionEndpointType.MULTI_REGION, regions: ['us-east-1'],
  });
  // Its own stack, in another region (us-east-1, where CloudFront needs ACM certificates): it writes its statements into
  // the function's resource policy in the home region, and reads the endpoint through CDK's cross-region references.
  const cdnStack = new Stack(app, `WebFnE2E-${scenario}-Cdn`, { env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' } });
  const forwardAuthorization = new cloudfront.CachePolicy(cdnStack, 'ForwardAuthorization', {
    headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Authorization'),
    minTtl: Duration.seconds(0),
    defaultTtl: Duration.seconds(0),
    maxTtl: Duration.seconds(1),
  });
  const behavior = (origin: cloudfront.IOrigin): cloudfront.BehaviorOptions => ({
    origin,
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
    cachePolicy: forwardAuthorization,
    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
  });
  const cdn = new cloudfront.Distribution(cdnStack, 'Cdn', {
    defaultBehavior: behavior(WebFunctionOrigin.withOriginAccessControl(fn.endpoint, { region: 'us-east-1' })),
    additionalBehaviors: {
      '/home/*': behavior(WebFunctionOrigin.withOriginAccessControl(fn.endpoint)),
      '/global/*': behavior(WebFunctionOrigin.withOriginAccessControl(global)),
    },
  });
  new CfnOutput(cdnStack, 'CdnUrl', { value: `https://${cdn.distributionDomainName}` });
  out('GlobalUrl', global.url);
}

// A caller with no IAM policy of its own, allowed by the function's resource policy only (same account).
const permissions = ctx('permissions');
if (permissions) {
  const policyCaller = new iam.Role(stack, 'PolicyCaller', { assumedBy: new iam.AccountRootPrincipal() });
  out('PolicyCallerRoleArn', policyCaller.roleArn);
  if (permissions === 'on') {
    fn.addPermission('E2eCaller', { principal: new iam.ArnPrincipal(policyCaller.roleArn) });
    fn.addPermission('Cdn', {
      principal: new iam.ServicePrincipal('cloudfront.amazonaws.com'),
      endpoint: fn.endpoint,
      sourceArn: `arn:aws:cloudfront::${stack.account}:distribution/*`,
    });
    // A grant to a service principal: a resource-policy statement without a Sid.
    fn.grantInvoke(new iam.ServicePrincipal('cloudfront.amazonaws.com').withConditions({ StringEquals: { 'aws:SourceAccount': stack.account } }));
  }
}

// failDeploy=true: a resource that fails about a minute after the function, forcing the update to roll back.
if (ctx('failDeploy') === 'true') {
  const handle = new CfnResource(stack, 'FailHandle', { type: 'AWS::CloudFormation::WaitConditionHandle' });
  const wait = new CfnResource(stack, 'Fail', { type: 'AWS::CloudFormation::WaitCondition', properties: { Handle: handle.ref, Timeout: '1', Count: 1 } });
  wait.node.addDependency(fn);
}
