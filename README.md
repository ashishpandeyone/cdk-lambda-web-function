# CDK constructs for AWS Lambda Web Functions

<!--BEGIN STABILITY BANNER-->

---

![cdk-constructs: Experimental](https://img.shields.io/badge/cdk--constructs-experimental-important.svg?style=for-the-badge)

> The APIs of higher level constructs in this module are experimental and under active development.
> They are subject to non-backward compatible changes or removal in any future version. These are
> not subject to the [Semantic Versioning](https://semver.org/) model and breaking changes will be
> announced in the release notes. This means that while you may use them, you may need to update
> your source code when upgrading to a newer version of this package.

---

<!--END STABILITY BANNER-->

[AWS Lambda Web Functions](https://docs.aws.amazon.com/lambda/latest/dg/web-functions.html) run an ordinary Node.js HTTP server (Express, Fastify, Hono, `node:http`) on Lambda and give it an HTTPS endpoint, optionally served from several regions. `WebFunction` deploys one, following the conventions of `aws-cdk-lib/aws-lambda` where the two services overlap.

```ts fixture=bare
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { WebFunction, WebFunctionAuthType, WebFunctionEndpointType } from '@ashishpandeyone/cdk-lambda-web-function';

const fn = new WebFunction(this, 'Api', {
  runtime: lambda.Runtime.NODEJS_24_X,
  code: lambda.Code.fromAsset('dist'),
  authType: WebFunctionAuthType.AWS_IAM,
  endpoint: {
    endpointType: WebFunctionEndpointType.MULTI_REGION,
    regions: ['us-east-1', 'eu-west-1'],
  },
});

new CfnOutput(this, 'Url', { value: fn.endpoint.url }); // https://<id>.lambda-web.global.on.aws
```

The stack's region is the function's **home region**. Multi-region endpoints need a stack with an explicit `env.region`.

## Installation

```bash
npm install @ashishpandeyone/cdk-lambda-web-function
```

It needs `aws-cdk-lib` 2.273.0 or later and `constructs` 10.5.1 or later (peer dependencies), and Node.js 22 or later. The package is published for TypeScript and JavaScript only.

## Writing the server

1. Listen on the host and port in **`AWS_LAMBDA_HTTP_ENDPOINT`** (`0.0.0.0:3000` today). `PORT` is not set.
2. Start listening within **10 seconds**, or initialisation fails with `Application.TimeoutListenError`.
3. Put the entry file at the root of your bundle as **`index.js`**, or set `entrypoint`.
4. The runtime has **no AWS SDK**: bundle the clients you import.
5. Code runs on **arm64**.

```js
const express = require('express');

const app = express();
app.get('/', (req, res) => res.json({ hello: 'world', region: process.env.AWS_REGION }));

const [host, port] = process.env.AWS_LAMBDA_HTTP_ENDPOINT.split(':');
app.listen(Number(port), host);
```

Requests carry `lambda-web-request-id` and `lambda-web-endpoint-name` headers.

## Regions and endpoints

Each `WebFunction` has a default endpoint, `fn.endpoint`, configured with the `endpoint` property. [Add more](#more-endpoints) with `fn.addEndpoint()`.

| `endpointType` | URL | Routing |
|---|---|---|
| `HOME_REGION` (default) | `https://<id>.<cell>.lambda-web.<home>.on.aws` | home region only |
| `MULTI_REGION` | one global `https://<id>.lambda-web.global.on.aws` | nearest region |
| `PER_REGION` | one URL per region, from `fn.endpoint.regionalUrl(region)` | the region in the hostname |

```ts
const perRegion = new WebFunction(this, 'Api', {
  runtime: lambda.Runtime.NODEJS_24_X,
  code: lambda.Code.fromAsset('dist'),
  authType: WebFunctionAuthType.AWS_IAM,
  endpoint: {
    endpointType: WebFunctionEndpointType.PER_REGION,
    regions: ['us-east-1', 'eu-west-1'],
  },
});

new CfnOutput(this, 'UsEast1Url', { value: perRegion.endpoint.regionalUrl('us-east-1') });
// perRegion.endpoint.regions is ['<home region>', 'eu-west-1', 'us-east-1']
```

- `MULTI_REGION` and `PER_REGION` need at least one region besides the home region; `HOME_REGION` takes none.
- A MultiRegion endpoint takes about a minute to create.
- Lambda routes a `MULTI_REGION` endpoint by latency, not by health: it doesn't fail over when a region has problems.

### More endpoints

A function can have up to 10 endpoints, each with its own URL, authentication, regions and limits. For example, a public endpoint next to an IAM-only global one:

```ts
const api = new WebFunction(this, 'Api', {
  runtime: lambda.Runtime.NODEJS_24_X,
  code: lambda.Code.fromAsset('dist'),
  authType: WebFunctionAuthType.NONE,              // the default endpoint is public
  endpoint: { rateLimit: 1000 },                   // requests per second
});

const internal = api.addEndpoint('Internal', {
  authType: WebFunctionAuthType.AWS_IAM,
  endpointType: WebFunctionEndpointType.MULTI_REGION,
  regions: ['us-east-1', 'eu-west-1'],
  description: 'Service-to-service traffic',
  maxEnvironments: 50,
});
internal.grantInvoke(consumerRole);
new CfnOutput(this, 'InternalUrl', { value: internal.url });
```

- `rateLimit` takes 0 (blocks all traffic), 100–1,000 in steps of 100, or 2,000–10,000 in steps of 1,000; excess requests get HTTP 429. `maxEnvironments` takes 2–10,000.
- **Both limits apply separately in each region** an endpoint serves from: a 3-region endpoint with `rateLimit: 1000` accepts up to 1,000 requests per second in each region.
- Endpoints can serve the same regions. The construct owns one `.local` log group per region, whichever endpoints serve it.

### Changing regions or the endpoint type

An endpoint's type and regions can't change in place: a change creates a **new endpoint with a new URL**, and the old one is deleted once the new one is live. Two endpoints of one function can't share a name, so:

| `endpointName` | Physical name | Changing `regions` or `endpointType` |
|---|---|---|
| omitted (recommended) | `default-<hash>` for `fn.endpoint`, `<id>-<hash>` for added endpoints; the hash covers the type and regions | works: new endpoint, new URL |
| set, e.g. `'live'` | `live` | also change the name in the same deployment, or it fails with *The endpoint live already exists* (the stack rolls back and the old endpoint keeps serving) |

The construct warns at synth time when `endpointName` is set.

## Authentication and invoking

| `authType` | Meaning |
|---|---|
| `AWS_IAM` | Callers sign requests (SigV4 or SigV4a, signing name `lambda`) and need `lambda:InvokeWebFunctionEndpoint` |
| `NONE` | **Public**: Lambda does no authentication; your application does (JWT, sessions). The `Authorization` header reaches your application untouched. The construct warns at synth time |

```ts
fn.grants.invoke(consumerRole); // or fn.grantInvoke(consumerRole), as on lambda.Function
```

The grant is on the endpoint's home-region ARN, which IAM evaluates in every region the endpoint serves from, including the global URL. `fn.grants` covers the default endpoint only; grant other endpoints with their own `grantInvoke()` or `grants.invoke()`.

| Endpoint | How to sign |
|---|---|
| `HOME_REGION` | SigV4 for the home region |
| `PER_REGION` | SigV4 for the hostname's region, or SigV4a |
| `MULTI_REGION` | **SigV4a with region set `*`**: you can't know which region will serve the request |

```js
import { SignatureV4a } from '@smithy/signature-v4a';
import { Sha256 } from '@aws-crypto/sha256-js';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

const host = new URL(url).hostname; // url: the endpoint's URL
const signer = new SignatureV4a({ service: 'lambda', region: '*', sha256: Sha256, credentials: fromNodeProviderChain() });
const signed = await signer.sign(
  { method: 'GET', protocol: 'https:', hostname: host, path: '/', headers: { host } },
  { signingRegion: '*' },
);
const response = await fetch(`https://${host}/`, { headers: signed.headers });
```

### Other accounts and AWS services

A caller in another account needs permission twice: in its own IAM policy, and in the function's **resource policy**. `grantInvoke` handles the function's side: a role in the function's account only gets an IAM policy statement, while a principal in another account or an AWS service also gets a statement in the resource policy.

```ts
fn.grantInvoke(iam.Role.fromRoleArn(this, 'Partner', 'arn:aws:iam::444455556666:role/caller'));
```

For principals you can't grant to (a whole account, an organization, an AWS service with conditions), use `addPermission`. The `id` becomes the statement's `Sid`:

```ts
fn.addPermission('PartnerAccount', { principal: new iam.AccountPrincipal('444455556666') });
fn.addPermission('MyOrg', { principal: new iam.OrganizationPrincipal('o-a1b2c3d4e5'), endpoint: fn.endpoint });
fn.addPermission('Cdn', {
  principal: new iam.ServicePrincipal('cloudfront.amazonaws.com'),
  sourceArn: `arn:aws:cloudfront::${this.account}:distribution/EDFDVBD6EXAMPLE`,
});
```

`addPermission` allows calling every endpoint unless you pass `endpoint`. For other actions, such as letting another account create revisions, use `fn.addToResourcePolicy(statement)`. Statements use the endpoint ARN for invoking and the function ARN for actions on the function.

- **One resource policy per function, written by the function's stack.** The construct creates it (`AWS::Lambda::ResourcePolicy`) with the first statement. CloudFormation can't attach a second one: another stack, or a `CfnResourcePolicy` of your own on the function, fails at change-set validation with "already exists". If you attached one yourself, move its statements into `addPermission` or `addToResourcePolicy`. Each update of the policy replaces any statements added outside CloudFormation.
- **Public policies are rejected.** Lambda refuses a policy that lets anyone call the function, and the construct fails synthesis first. A `*` principal is only accepted with a condition that pins the caller, such as `aws:PrincipalOrgID` (`iam.OrganizationPrincipal`) or `aws:SourceAccount`. For a public endpoint, use `authType: NONE`.
- **Scope AWS services to your resource.** Lambda accepts a service principal with no condition, which would let that service call the endpoint on behalf of any account. The construct warns unless you give `sourceArn` or `sourceAccount` (or an `aws:SourceArn`, `aws:SourceAccount`, `aws:SourceOrgID` or `aws:SourceOrgPaths` condition).
- Lambda copies the policy to every region the function's endpoints serve from. The copy is eventually consistent, and in tests changes applied in every region within seconds.

### CloudFront

Put a CloudFront distribution (`aws-cdk-lib/aws-cloudfront`) in front of an `AWS_IAM` endpoint to serve the public with a custom domain, caching and AWS WAF. Viewers don't sign anything, and only your distribution may call the endpoint:

```ts
new cloudfront.Distribution(this, 'Cdn', {
  defaultBehavior: {
    origin: WebFunctionOrigin.withOriginAccessControl(fn.endpoint),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
  },
});
```

`withOriginAccessControl` adds:
- an origin access control (origin type `lambda`, signing behavior `always-amz-auth`, the only one CloudFront accepts for Web Function origins), one per stack and signing protocol: SigV4 for a regional domain, SigV4a for a `MULTI_REGION` endpoint's global domain;
- a statement in the function's resource policy that allows `cloudfront.amazonaws.com` to call this endpoint on behalf of this distribution only (`aws:SourceArn`).

Some things to know:
- **Forward everything except `Host`.** The endpoint answers 404 when `Host` is the distribution's domain, so use `ALL_VIEWER_EXCEPT_HOST_HEADER` (not `ALL_VIEWER`), or a policy of your own without `Host`.
- **Your application can still authenticate viewers.** CloudFront signs in its own headers and passes the viewer's `Authorization` header (a JWT, for example) through unchanged, but only when `Authorization` is in the cache policy. CloudFront drops it from `GET` and `HEAD` requests otherwise:

  ```ts
  const forwardAuthorization = new cloudfront.CachePolicy(this, 'ForwardAuthorization', {
    headerBehavior: cloudfront.CacheHeaderBehavior.allowList('Authorization'),
    minTtl: Duration.seconds(0),
    defaultTtl: Duration.seconds(0),
    maxTtl: Duration.seconds(1), // a cache key with headers needs caching enabled; 0/0/1 keeps it off in practice
  });
  ```
- Request bodies work without clients sending `x-amz-content-sha256`: CloudFront signs `POST`, `PUT` and `PATCH` requests with an unsigned payload.
- A `PER_REGION` endpoint's origin calls one region: the home region, or the one you pass as `region`. Use one origin per region, for example in an origin group.
- A `MULTI_REGION` endpoint can't include opt-in regions (such as `me-central-1`), because CloudFront can't sign for them. The construct fails synthesis.
- The distribution must be in the function's stack. Lambda@Edge origin-request and origin-response triggers aren't supported on behaviors with this origin.
- The endpoint stays reachable at its own domain for signed requests your policies allow. Until a new distribution finishes deploying, requests through it can get a transient 403.
- `new WebFunctionOrigin(endpoint)` is for a public (`NONE`) endpoint, for example behind AWS WAF. Lambda doesn't authenticate those requests, so the endpoint's own domain stays public too.

### Functions defined elsewhere

Import a Web Function defined in another stack or app to grant access to it, read its metrics, or reference its revisions:

```ts
const orders = WebFunction.fromWebFunctionArn(this, 'Orders', 'arn:aws:lambda:us-east-1:111122223333:web-function/orders');
orders.grantInvoke(consumerRole);             // every endpoint of the function

const live = WebFunction.fromWebFunctionAttributes(this, 'Live', {
  webFunctionName: 'orders',                  // in this stack's account and region
  endpointName: 'live',                       // grantInvoke allows this endpoint only
});
live.metricConcurrentRequests().createAlarm(this, 'Busy', { threshold: 60, evaluationPeriods: 3 });
```

An imported function's metrics default to its own region. Its endpoints, revisions and log groups stay with the stack that defines it.

An imported function's `grantInvoke` adds to the caller's IAM policy only, which is all a caller in the function's account needs. A caller in another account also needs the function's resource policy to allow it, which only the function's own stack can change: `addToResourcePolicy` on an imported function adds nothing and warns.

## Configuration

```ts
const api = new WebFunction(this, 'Api', {
  runtime: lambda.Runtime.NODEJS_24_X,
  code: lambda.Code.fromAsset('build'),
  authType: WebFunctionAuthType.AWS_IAM,
  entrypoint: 'server.js',               // default index.js
  webFunctionName: 'orders-api',         // default: generated from the construct path
  description: 'Orders HTTP API',
  environment: { TABLE_NAME: table.tableName },
  timeout: Duration.seconds(60),         // per request: 3 seconds to 15 minutes, default 30 seconds
  maxConcurrencyPerEnvironment: 32,      // requests per environment at once: 1-128, default 64
});

api.addEnvironment('FEATURE_FLAG', 'on');
table.grantReadWriteData(api);           // the default role trusts lambda.amazonaws.com
```

- **Each execution environment has 2 vCPUs and 2 GB of memory.** There's no memory setting as on Lambda functions; scale with `maxConcurrencyPerEnvironment` and more environments instead.
- Requests handled by one environment share module-level state, so keep handlers concurrency-safe.
- Environment variable names starting with `AWS_` are reserved.
- **Renaming the function replaces it and changes its URL.** A generated name depends on the construct path, so moving the construct renames it too.

### Bundling TypeScript with `NodejsWebFunction`

`NodejsWebFunction` is a `WebFunction` that bundles your server from a TypeScript or JavaScript entry file with esbuild, like `NodejsFunction` does for Lambda functions:

```ts
new NodejsWebFunction(this, 'Api', {
  entry: 'src/server.ts',
  authType: WebFunctionAuthType.AWS_IAM,
  bundling: {
    minify: true,                                       // default true
    sourceMap: true,                                    // default true
    format: lambdaNodejs.OutputFormat.ESM,              // default ESM (index.mjs); CJS gives index.js
    externalModules: [],                                // default: bundle everything you import
  },
});
```

- **Defaults:** `runtime` is `NODEJS_24_X`, and the esbuild target follows the runtime (`node24`). The project root is the directory of the nearest lock file above `entry` (override it with `depsLockFilePath` or `projectRoot`).
- **It also sets what a `lambda.Code` can't:** the entry point that matches the bundle, and `NODE_OPTIONS=--enable-source-maps` when source maps are on, appended to any `NODE_OPTIONS` you set, so stack traces point at your `.ts` files (e.g. `/var/task/src/server.ts:22:12`). Source map paths are relative to the project root, so no build-machine paths are deployed.
- **ESM bundles include a `require` shim**, so CommonJS dependencies that load Node.js built-ins (Express, for example) work.
- **The AWS SDK is bundled like any other dependency**, since the runtime has none. Only the clients you import are included.
- **Bundling runs locally** when esbuild is installed in your project, and otherwise in Docker (an arm64 AWS SAM build image; set `forceDockerBundling` to always use Docker).
- **Not yet supported:** installing native modules next to the bundle (`nodeModules`) and command hooks. For native dependencies, use `WebFunction` with `Code.fromAsset(..., { bundling: { image, command } })`.

### Code

`code` takes any `lambda.Code` that produces a zip in S3: `fromAsset`, `fromBucket`/`fromBucketV2`, `fromCustomCommand`, `fromDockerBuild`. Inline code and container images fail at synth time.

Lambda Web Functions download code as the `lambda.amazonaws.com` service principal, from a **versioned** bucket, and the CDK bootstrap bucket allows neither. So each stack gets a small code bucket, and the code is copied into it on deploy. The bucket is emptied and deleted with the stack.

Copying code, managing the function's log groups in every region, looking up regional URLs, cleaning up old revisions, creating rollback alarms in other regions and emptying the code bucket all run in one custom resource Lambda per stack. Its logs go to a log group the stack owns, kept for a month and deleted with the stack.

## Revisions

Any change to code or configuration creates a new **revision** (`fn.currentRevision`), and endpoints switch to it once it's ready. A failed deployment rolls back to the previous revision. If nothing changed, nothing is deployed.

Earlier revisions are kept, so you can roll back or route traffic to them. After each deployment, the construct deletes the oldest beyond `revisionRetention` (default 20, up to 50). It never deletes a revision an endpoint routes to, or one the previous deployment used, which a rollback returns to.

```ts
new WebFunction(this, 'Api', {
  runtime: lambda.Runtime.NODEJS_24_X,
  code: lambda.Code.fromAsset('dist'),
  authType: WebFunctionAuthType.AWS_IAM,
  revisionRetention: 5,
});
```

### Routing to earlier revisions

Reference an earlier revision by its ID (for example from a `CfnOutput` of `fn.currentRevision.revisionId`, or `aws lambda-web list-web-function-revisions`). Then pin an endpoint to it, or split traffic between two revisions:

```ts
const previous = WebFunctionRevision.fromRevisionAttributes(this, 'Previous', {
  webFunction: fn,
  revisionId: 'rev-a1b2c',
});

// Keep the default endpoint on the previous revision, and send 10% to the new one:
fn.endpoint.routeTraffic(previous, [{ revision: fn.currentRevision, weight: 0.1 }]);

// Or a second endpoint that stays on the previous revision while fn.endpoint moves on:
fn.addEndpoint('Stable', { authType: WebFunctionAuthType.AWS_IAM, revision: previous });
```

- An endpoint routes to at most two revisions. The additional revision's `weight` is a whole percentage, from 0.01 to 0.99.
- To promote, remove `routeTraffic` (or `revision`) and deploy: the endpoint serves the current revision again.
- Lambda Web Function metrics have no revision dimension. To compare a split's revisions, log a version you control (for example an environment variable) from your application.

### Canary and linear deployments

By default an endpoint moves all its traffic to a new revision at once. With `deployment`, it moves in steps instead, watching CloudWatch alarms: if one goes into ALARM, the endpoint goes back to the revision it served before and the deployment fails, so CloudFormation rolls the stack back.

```ts
const api = new WebFunction(this, 'Api', {
  runtime: lambda.Runtime.NODEJS_24_X,
  code: lambda.Code.fromAsset('dist'),
  authType: WebFunctionAuthType.AWS_IAM,
  endpoint: {
    // 10% of the traffic for 10 minutes, then all of it; back if more than 2% of requests get a 5XX.
    deployment: WebFunctionDeployment.canary({ percent: 10, bake: Duration.minutes(10), rollbackOn: { serverErrorRate: 2 } }),
  },
});

// 25% more every 5 minutes, watching an alarm of your own. Each endpoint has its own deployment.
// errorRate: any cloudwatch.IAlarm, e.g. on a metric your application publishes.
api.addEndpoint('Public', {
  authType: WebFunctionAuthType.NONE,
  deployment: WebFunctionDeployment.linear({ percent: 25, interval: Duration.minutes(5), alarms: [errorRate] }),
});
```

| | Steps | Limits |
|---|---|---|
| `allAtOnce()` (default) | 100% | |
| `canary({ percent, bake })` | `percent`, then 100% after `bake` | `percent` 1–99, `bake` 1–45 minutes |
| `linear({ percent, interval })` | `percent` more every `interval` | `percent` 5–50, `interval` from 1 minute, at most 45 minutes in all |

How it works:

- Each deployment that creates a revision (code or configuration) moves the traffic from the revision the endpoint serves at that moment, which is also what it goes back to. If someone switched the endpoint outside CloudFormation, the deployment starts from there.
- Each step waits until every region of a `MULTI_REGION` or `PER_REGION` endpoint has applied it (usually about 15 seconds), and if a region fails to update, the endpoint goes back as for an alarm. The bake or interval counts from the start of the step.
- Alarms are checked before the first step (an alarm already in ALARM stops the deployment before any traffic moves), throughout every step, and once the new revision has all the traffic. They can be in any region, and composite alarms work. `INSUFFICIENT_DATA` doesn't stop a deployment.
- A rollback of the stack, for any reason, moves the traffic back at once, without waiting or checking alarms.
- A stack's first deployment, and a new endpoint (including one renamed by a region change), serve the revision at once: there's nothing to move from.
- A deployment can take up to an hour: CloudFormation waits for it before it updates the endpoint. Deployments of different endpoints run in parallel.
- A canary or linear endpoint always moves to the current revision, so it can't also use `revision`, `additionalRevisions` or `routeTraffic()`. Use `allAtOnce()` to deploy a fix immediately, for example while an alarm is in ALARM.

#### Rollback alarms

`rollbackOn` makes the endpoint create alarms on its own error rates, and the deployment watches them alongside any `alarms` you pass:

| `rollbackOn` | Default | |
|---|---|---|
| `serverErrorRate` | none | roll back when more than this % of requests get a 5XX |
| `clientErrorRate` | none | the same for 4XX (including 429s from `rateLimit` and `maxEnvironments`) |
| `minimumRequests` | 10 | periods with fewer requests don't count, so one failed request out of two doesn't roll back |
| `period`, `evaluationPeriods` | 1 minute, 2 | consecutive periods over the threshold before rolling back |

- **One alarm per threshold in every region the endpoint serves from.** Metrics are published in the region that served the request, and an alarm can only watch metrics in its own region. The home region's alarm is a normal CloudFormation alarm; the others are created and deleted with the endpoint by a custom resource, and named `LambdaWeb-<function>-<endpoint>-5xx-rate` (or `-4xx-rate`). `endpoint.rollbackAlarms` lists them all, e.g. to add notifications to the home region's.
- **The alarms see the whole endpoint.** Lambda Web Function metrics have no revision dimension, so at 10% a new revision's errors are about a tenth of the endpoint's: set the threshold low enough to notice that, or alarm on metrics your application publishes with its version.
- **5XX includes the platform's 503s** while the endpoint scales up for a sudden burst, not only your application's errors.
- **A step should outlast the alarm.** CloudWatch needs `period` × `evaluationPeriods`, plus a couple of minutes of delay, to fire; the construct warns when a canary's bake or a linear interval is shorter.

The deployment runs in a few resources per stack, created on first use: two Lambda functions, a Step Functions state machine that calls them every 15 seconds, and a log group.

## Metrics

Endpoints and functions have helpers for their CloudWatch metrics (namespace `AWS/Lambda/Web`), like `lambda.Function`'s:

```ts
fn.endpoint.metricServerErrorRate().createAlarm(this, 'ErrorRate', { threshold: 1, evaluationPeriods: 3 });
fn.endpoint.metricRequestThrottles().createAlarm(this, 'Throttled', { threshold: 10, evaluationPeriods: 3 });
fn.metricConcurrentRequests().createAlarm(this, 'Saturated', { threshold: 60, evaluationPeriods: 3 });
```

| Endpoint | Metric |
|---|---|
| `metricRequests()` | `ExecutedRequests` (there's no separate 2XX count) |
| `metricClientErrors()`, `metricServerErrors()` | `HTTPResponseStatusClass4XX`, `HTTPResponseStatusClass5XX` |
| `metricClientErrorRate()`, `metricServerErrorRate()` | 4XX or 5XX as a % of requests (math expression) |
| `metricActiveEnvironments()` | `EndpointActiveEnvironments`, to compare with `maxEnvironments` |
| `metricRequestThrottles()`, `metricEnvironmentThrottles()` | 429s from `rateLimit` and from `maxEnvironments` |

| Function | Metric |
|---|---|
| `metricConcurrentRequests()` | `EnvironmentConcurrentRequests` (maximum), to compare with `maxConcurrencyPerEnvironment` |
| `metricMaxMemoryUsage()` | `EnvironmentMaxMemoryUsage` (maximum) |
| `metricActiveTime()`, `metricCpuTime()`, `metricResponseBytes()` | `EnvironmentActiveTime`, `EnvironmentCPUTime`, `ResponseBytes` |

- **Metrics stay in the region that served the request**; unlike logs, they aren't copied to the home region. Every helper takes `region`. Dashboards can show any region, but an alarm can only use metrics from its own stack's region.
- 4XX, 5XX and the throttle metrics only exist once they're non-zero: alarm on them with `treatMissingData: NOT_BREACHING`. The rate helpers count missing errors as 0.
- There's no latency metric. Publish one from your application (e.g. with the CloudWatch embedded metric format).

## Logs in every region

Web Functions log in two tiers:

```text
 every serving region               home region
 ┌──────────────────┐              ┌──────────────────────────────────────────┐
 │ <group>.local    │── copied ───►│ <group>   every region's logs            │
 │ (that region's   │  (seconds)   │ streams …[rev]<instance>-<acct>-<region> │
 │  environments)   │              │ <group>.local  (home-region traffic)     │
 └──────────────────┘              └──────────────────────────────────────────┘
```

**Query `fn.logGroup`**, the home-region group that receives every region's logs. The service would create missing groups without retention and never delete them, so the construct creates and owns all of them: both home-region groups, and `<group>.local` in every other region any of its endpoints serves from.

```ts
new WebFunction(this, 'Api', {
  runtime: lambda.Runtime.NODEJS_24_X,
  code: lambda.Code.fromAsset('dist'),
  authType: WebFunctionAuthType.AWS_IAM,
  logRetention: logs.RetentionDays.THREE_MONTHS,    // default ONE_MONTH, every group in every region
  logRemovalPolicy: RemovalPolicy.DESTROY,           // default RETAIN
  applicationLogLevelV2: lambda.ApplicationLogLevel.WARN,
  systemLogLevelV2: lambda.SystemLogLevel.INFO,      // DEBUG, INFO or WARN
});
```

- The default group is `/aws/lambda/web/<function name>`. Log lines are JSON; application lines carry `requestId`, `endpointName` and `region`.
- Every event is stored twice (`.local` plus the home-region copy), so expect about double log ingestion, plus cross-region transfer.
- With `DESTROY`, deletion waits about a minute after the function is gone, because environments flush their last lines late.
- Subscribe only to `fn.logGroup`: subscribing to the `.local` groups as well delivers every event twice.

## Limitations

- Not yet supported: VPC access (network connectors), KMS encryption, and tracing.
- **Hotswap skips Web Functions without a warning.** `cdk deploy --hotswap` and `cdk watch`, which hotswaps by default, report `(no changes)` for a code or configuration change and the endpoint keeps serving the old revision. Use `cdk watch --hotswap-fallback` (or `cdk deploy --hotswap-fallback`): it deploys Web Function changes through CloudFormation, in about 40 seconds for a home-region endpoint.
- Fixed limits: 512 MB of code (unzipped) and 32 KB of environment variables per revision, 512 MB of `/tmp` per execution environment, and 128 KiB of headers per request.
- Quotas: 10 endpoints and about 50 revisions per function (Lambda cleans up older revisions automatically), and 10,000 requests per second per endpoint. Per account and region: 100,000 requests per second and 2,000 Arm64 vCPUs (each execution environment uses 2). The account quotas are adjustable, and new accounts start lower. See [Lambda quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html).

## Development

Tooling is pinned in `mise.toml` (Node 24, AWS CDK CLI). Personal settings, such as the AWS profile for the live end-to-end tests, go in a git-ignored `mise.local.toml`.

```bash
mise install
npx projen build      # compile, unit tests, lint, API docs
npx projen e2e        # deploy, verify and destroy real stacks in three regions (needs AWS credentials)
```
