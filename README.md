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

[AWS Lambda Web Functions](https://aws.amazon.com/lambda/) run an ordinary Node.js HTTP server (Express, Fastify, Hono, `node:http`) on Lambda and give it an HTTPS endpoint, optionally served from several regions. `WebFunction` deploys one, following the conventions of `aws-cdk-lib/aws-lambda` where the two services overlap.

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

## Writing the server

1. Listen on the host and port in **`AWS_LAMBDA_HTTP_ENDPOINT`** (`0.0.0.0:3000` today). `PORT` is not set.
2. Start listening within **about 9 seconds**, or initialisation fails with `Application.TimeoutListenError`.
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

Each `WebFunction` has one endpoint, `fn.endpoint`:

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

### Changing regions or the endpoint type

An endpoint's type and regions can't change in place: a change creates a **new endpoint with a new URL**, and the old one is deleted once the new one is live. Two endpoints of one function can't share a name, so:

| `endpointName` | Physical name | Changing `regions` or `endpointType` |
|---|---|---|
| omitted (recommended) | `default-<hash of type and regions>` | works: new endpoint, new URL |
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

The grant is on the endpoint's home-region ARN, which IAM evaluates in every region the endpoint serves from, including the global URL.

| Endpoint | How to sign |
|---|---|
| `HOME_REGION` | SigV4 for the home region |
| `PER_REGION` | SigV4 for the hostname's region, or SigV4a |
| `MULTI_REGION` | **SigV4a with region set `*`**: you can't know which region will serve the request |

```js
import { SignatureV4a } from '@smithy/signature-v4a';
import { Sha256 } from '@aws-crypto/sha256-js';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

const signer = new SignatureV4a({ service: 'lambda', region: '*', sha256: Sha256, credentials: fromNodeProviderChain() });
const signed = await signer.sign(
  { method: 'GET', protocol: 'https:', hostname: host, path: '/', headers: { host } },
  { signingRegion: '*' },
);
const response = await fetch(`https://${host}/`, { headers: signed.headers });
```

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

Lambda Web Functions download code as the `lambda.amazonaws.com` service principal, from a **versioned** bucket, and the CDK bootstrap bucket allows neither. So each stack gets a small code bucket, and the code is copied into it on deploy.

### Updates

Any change to code or configuration creates a new **revision**. The endpoint switches to it once it's ready, and the old revision is deleted after the deployment succeeds; a failed deployment rolls back to it. If nothing changed, nothing is deployed.

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

**Query `fn.logGroup`**, the home-region group that receives every region's logs. The service would create missing groups without retention and never delete them, so the construct creates and owns all of them: both home-region groups, and `<group>.local` in every other region of the endpoint.

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

- One endpoint per function; no traffic splitting between revisions.
- Not yet supported: importing existing functions, VPC access (network connectors), resource-policy permissions, KMS encryption, metrics helpers, tracing, and a CloudFront origin.
- `cdk deploy --hotswap` and `cdk watch` don't support Web Functions.
- Quotas per account and region: 50 revisions and 10 endpoints per function, 200 Arm vCPUs, 10,000 requests per second.
- The stack's custom resource provider Lambda keeps its own log group after the stack is deleted, as with other CDK custom resources.

## Development

Tooling is pinned in `mise.toml` (Node 24, AWS CDK CLI). Personal settings, such as the AWS profile for the live end-to-end tests, go in a git-ignored `mise.local.toml`.

```bash
mise install
npx projen build      # compile, unit tests, lint, API docs
npx projen e2e        # deploy, verify and destroy real stacks in three regions (needs AWS credentials)
```
