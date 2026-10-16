# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### NodejsWebFunction <a name="NodejsWebFunction" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction"></a>

A `WebFunction` whose code is bundled from a TypeScript or JavaScript entry file with esbuild, like `NodejsFunction` for Lambda functions.

Besides bundling, it sets what a `lambda.Code` alone can't: the entry point that matches the
bundle, and `NODE_OPTIONS=--enable-source-maps` when source maps are on.

#### Initializers <a name="Initializers" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.Initializer"></a>

```typescript
import { NodejsWebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

new NodejsWebFunction(scope: Construct, id: string, props: NodejsWebFunctionProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.Initializer.parameter.props">props</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps">NodejsWebFunctionProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.Initializer.parameter.props"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps">NodejsWebFunctionProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.with">with</a></code> | Applies one or more mixins to this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.applyCrossStackReferenceStrength">applyCrossStackReferenceStrength</a></code> | Override the cross-stack reference strength for this resource. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addToResourcePolicy">addToResourcePolicy</a></code> | Adds a statement to the function's resource policy, e.g. to let another account manage the function. For invoking, prefer `addPermission` or `grantInvoke`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.grantInvoke">grantInvoke</a></code> | Allows `grantee` to call the endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metric">metric</a></code> | A metric of this function's execution environments in `AWS/Lambda/Web` (dimension `FunctionName`), across all endpoints. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricActiveTime">metricActiveTime</a></code> | Time the execution environments were active (`EnvironmentActiveTime`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricConcurrentRequests">metricConcurrentRequests</a></code> | Requests an execution environment handled at once (`EnvironmentConcurrentRequests`), to compare with `maxConcurrencyPerEnvironment`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricCpuTime">metricCpuTime</a></code> | CPU time the execution environments used (`EnvironmentCPUTime`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricMaxMemoryUsage">metricMaxMemoryUsage</a></code> | Peak memory an execution environment used (`EnvironmentMaxMemoryUsage`); |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricResponseBytes">metricResponseBytes</a></code> | Bytes sent in responses (`ResponseBytes`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addEndpoint">addEndpoint</a></code> | Adds an endpoint (up to 10 per function), e.g. a public one next to an IAM-only one, or one pinned to an earlier revision. Each endpoint has its own URL, authentication, regions and limits. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addEnvironment">addEnvironment</a></code> | Adds an environment variable. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addPermission">addPermission</a></code> | Allows a principal in another account, an AWS service or an organization to call the function's endpoints, through the function's resource policy. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addToRolePolicy">addToRolePolicy</a></code> | Adds a statement to the execution role's policy. |

---

##### `toString` <a name="toString" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

---

##### `applyCrossStackReferenceStrength` <a name="applyCrossStackReferenceStrength" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.applyCrossStackReferenceStrength"></a>

```typescript
public applyCrossStackReferenceStrength(strength: ReferenceStrength): void
```

Override the cross-stack reference strength for this resource.

When set, any cross-stack reference to this resource will use the specified
mechanism instead of the global default determined by the
`@aws-cdk/core:defaultCrossStackReferences` context key. This is useful for
selectively weakening specific references to avoid the "deadly embrace" problem
without changing the app-wide default.

###### `strength`<sup>Required</sup> <a name="strength" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.applyCrossStackReferenceStrength.parameter.strength"></a>

- *Type:* aws-cdk-lib.ReferenceStrength

The reference strength to use for this resource.

---

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.applyRemovalPolicy"></a>

```typescript
public applyRemovalPolicy(policy: RemovalPolicy): void
```

Apply the given removal policy to this resource.

The Removal Policy controls what happens to this resource when it stops
being managed by CloudFormation, either because you've removed it from the
CDK application or because you've made a change that requires the resource
to be replaced.

The resource can be deleted (`RemovalPolicy.DESTROY`), or left in your AWS
account for data recovery and cleanup later (`RemovalPolicy.RETAIN`).

###### `policy`<sup>Required</sup> <a name="policy" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `addToResourcePolicy` <a name="addToResourcePolicy" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addToResourcePolicy"></a>

```typescript
public addToResourcePolicy(statement: PolicyStatement): AddToResourcePolicyResult
```

Adds a statement to the function's resource policy, e.g. to let another account manage the function. For invoking, prefer `addPermission` or `grantInvoke`.

The function has one resource policy (`AWS::Lambda::ResourcePolicy`), created on the first statement. This stack
is its only writer: another stack or template can't also attach one, and changes made outside CloudFormation
are overwritten by the next update of the policy.

###### `statement`<sup>Required</sup> <a name="statement" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addToResourcePolicy.parameter.statement"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

---

##### `grantInvoke` <a name="grantInvoke" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.grantInvoke"></a>

```typescript
public grantInvoke(grantee: IGrantable): Grant
```

Allows `grantee` to call the endpoint.

Shortcut for `grants.invoke(grantee)`, as on `lambda.Function`.
[disable-awslint:no-grants]

###### `grantee`<sup>Required</sup> <a name="grantee" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.grantInvoke.parameter.grantee"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

##### `metric` <a name="metric" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metric"></a>

```typescript
public metric(metricName: string, props?: MetricOptions): Metric
```

A metric of this function's execution environments in `AWS/Lambda/Web` (dimension `FunctionName`), across all endpoints.

For request and error counts, use the endpoint's metrics (`fn.endpoint.metricRequests()`).

Metrics are published in the region that served the request: pass `region` for another serving region.
An alarm can only use metrics from its own stack's region.

###### `metricName`<sup>Required</sup> <a name="metricName" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metric.parameter.metricName"></a>

- *Type:* string

---

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metric.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricActiveTime` <a name="metricActiveTime" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricActiveTime"></a>

```typescript
public metricActiveTime(props?: MetricOptions): Metric
```

Time the execution environments were active (`EnvironmentActiveTime`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricActiveTime.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricConcurrentRequests` <a name="metricConcurrentRequests" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricConcurrentRequests"></a>

```typescript
public metricConcurrentRequests(props?: MetricOptions): Metric
```

Requests an execution environment handled at once (`EnvironmentConcurrentRequests`), to compare with `maxConcurrencyPerEnvironment`.

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricConcurrentRequests.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricCpuTime` <a name="metricCpuTime" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricCpuTime"></a>

```typescript
public metricCpuTime(props?: MetricOptions): Metric
```

CPU time the execution environments used (`EnvironmentCPUTime`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricCpuTime.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricMaxMemoryUsage` <a name="metricMaxMemoryUsage" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricMaxMemoryUsage"></a>

```typescript
public metricMaxMemoryUsage(props?: MetricOptions): Metric
```

Peak memory an execution environment used (`EnvironmentMaxMemoryUsage`);

each environment has 2 GB.

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricMaxMemoryUsage.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricResponseBytes` <a name="metricResponseBytes" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricResponseBytes"></a>

```typescript
public metricResponseBytes(props?: MetricOptions): Metric
```

Bytes sent in responses (`ResponseBytes`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.metricResponseBytes.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `addEndpoint` <a name="addEndpoint" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addEndpoint"></a>

```typescript
public addEndpoint(id: string, options: AddWebFunctionEndpointOptions): WebFunctionEndpoint
```

Adds an endpoint (up to 10 per function), e.g. a public one next to an IAM-only one, or one pinned to an earlier revision. Each endpoint has its own URL, authentication, regions and limits.

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addEndpoint.parameter.id"></a>

- *Type:* string

the endpoint's construct ID, also used in its generated name (`<id>-<hash>`).

---

###### `options`<sup>Required</sup> <a name="options" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addEndpoint.parameter.options"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions">AddWebFunctionEndpointOptions</a>

---

##### `addEnvironment` <a name="addEnvironment" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addEnvironment"></a>

```typescript
public addEnvironment(key: string, value: string): WebFunction
```

Adds an environment variable.

Names starting with `AWS_` are reserved.

###### `key`<sup>Required</sup> <a name="key" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addEnvironment.parameter.key"></a>

- *Type:* string

---

###### `value`<sup>Required</sup> <a name="value" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addEnvironment.parameter.value"></a>

- *Type:* string

---

##### `addPermission` <a name="addPermission" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addPermission"></a>

```typescript
public addPermission(id: string, permission: WebFunctionPermission): void
```

Allows a principal in another account, an AWS service or an organization to call the function's endpoints, through the function's resource policy.

For a role in this account, use `grantInvoke`.

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addPermission.parameter.id"></a>

- *Type:* string

the statement ID (`Sid`): letters and digits, unique within the function.

---

###### `permission`<sup>Required</sup> <a name="permission" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addPermission.parameter.permission"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission">WebFunctionPermission</a>

---

##### `addToRolePolicy` <a name="addToRolePolicy" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addToRolePolicy"></a>

```typescript
public addToRolePolicy(statement: PolicyStatement): void
```

Adds a statement to the execution role's policy.

###### `statement`<sup>Required</sup> <a name="statement" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addToRolePolicy.parameter.statement"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isResource">isResource</a></code> | Check whether the given construct is a Resource. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionArn">fromWebFunctionArn</a></code> | Imports an existing Web Function by its ARN (in any region or account). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionAttributes">fromWebFunctionAttributes</a></code> | Imports an existing Web Function: give its ARN or its name, and optionally the endpoint `grantInvoke` allows. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionName">fromWebFunctionName</a></code> | Imports an existing Web Function in this stack's account and region by its name. |

---

##### `isConstruct` <a name="isConstruct" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isConstruct"></a>

```typescript
import { NodejsWebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

NodejsWebFunction.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isOwnedResource` <a name="isOwnedResource" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isOwnedResource"></a>

```typescript
import { NodejsWebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

NodejsWebFunction.isOwnedResource(construct: IConstruct)
```

Returns true if the construct was created by CDK, and false otherwise.

###### `construct`<sup>Required</sup> <a name="construct" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isOwnedResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `isResource` <a name="isResource" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isResource"></a>

```typescript
import { NodejsWebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

NodejsWebFunction.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `fromWebFunctionArn` <a name="fromWebFunctionArn" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionArn"></a>

```typescript
import { NodejsWebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

NodejsWebFunction.fromWebFunctionArn(scope: Construct, id: string, webFunctionArn: string)
```

Imports an existing Web Function by its ARN (in any region or account).

###### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionArn.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionArn.parameter.id"></a>

- *Type:* string

---

###### `webFunctionArn`<sup>Required</sup> <a name="webFunctionArn" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionArn.parameter.webFunctionArn"></a>

- *Type:* string

---

##### `fromWebFunctionAttributes` <a name="fromWebFunctionAttributes" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionAttributes"></a>

```typescript
import { NodejsWebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

NodejsWebFunction.fromWebFunctionAttributes(scope: Construct, id: string, attrs: WebFunctionAttributes)
```

Imports an existing Web Function: give its ARN or its name, and optionally the endpoint `grantInvoke` allows.

###### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionAttributes.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionAttributes.parameter.id"></a>

- *Type:* string

---

###### `attrs`<sup>Required</sup> <a name="attrs" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionAttributes.parameter.attrs"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAttributes">WebFunctionAttributes</a>

---

##### `fromWebFunctionName` <a name="fromWebFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionName"></a>

```typescript
import { NodejsWebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

NodejsWebFunction.fromWebFunctionName(scope: Construct, id: string, webFunctionName: string)
```

Imports an existing Web Function in this stack's account and region by its name.

###### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionName.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionName.parameter.id"></a>

- *Type:* string

---

###### `webFunctionName`<sup>Required</sup> <a name="webFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.fromWebFunctionName.parameter.webFunctionName"></a>

- *Type:* string

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.env">env</a></code> | <code>aws-cdk-lib.interfaces.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.webFunctionArn">webFunctionArn</a></code> | <code>string</code> | The function's ARN. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.webFunctionName">webFunctionName</a></code> | <code>string</code> | The function's name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.webFunctionRef">webFunctionRef</a></code> | <code>aws-cdk-lib.interfaces.aws_lambda.WebFunctionReference</code> | A reference to this function, for APIs that accept `lambda.IWebFunctionRef`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.currentRevision">currentRevision</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a></code> | The revision built from the current code and configuration. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a></code> | The default endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.grantPrincipal">grantPrincipal</a></code> | <code>aws-cdk-lib.aws_iam.IPrincipal</code> | The principal to grant permissions to (the execution role). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.grants">grants</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants">WebFunctionGrants</a></code> | Grants on the default endpoint (e.g. `grants.invoke(principal)`). Other endpoints have their own `grants`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.logGroup">logGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The home-region log group that receives the logs of every region the function serves from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.revisionId">revisionId</a></code> | <code>string</code> | The ID of the current revision. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.role">role</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The execution role. |

---

##### `node`<sup>Required</sup> <a name="node" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.env"></a>

```typescript
public readonly env: ResourceEnvironment;
```

- *Type:* aws-cdk-lib.interfaces.ResourceEnvironment

The environment this resource belongs to.

For resources that are created and managed in a Stack (those created by
creating new class instances like `new Role()`, `new Bucket()`, etc.), this
is always the same as the environment of the stack they belong to.

For referenced resources (those obtained from referencing methods like
`Role.fromRoleArn()`, `Bucket.fromBucketName()`, etc.), they might be
different than the stack they were imported into.

---

##### `stack`<sup>Required</sup> <a name="stack" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `webFunctionArn`<sup>Required</sup> <a name="webFunctionArn" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.webFunctionArn"></a>

```typescript
public readonly webFunctionArn: string;
```

- *Type:* string

The function's ARN.

---

##### `webFunctionName`<sup>Required</sup> <a name="webFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.webFunctionName"></a>

```typescript
public readonly webFunctionName: string;
```

- *Type:* string

The function's name.

---

##### `webFunctionRef`<sup>Required</sup> <a name="webFunctionRef" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.webFunctionRef"></a>

```typescript
public readonly webFunctionRef: WebFunctionReference;
```

- *Type:* aws-cdk-lib.interfaces.aws_lambda.WebFunctionReference

A reference to this function, for APIs that accept `lambda.IWebFunctionRef`.

---

##### `currentRevision`<sup>Required</sup> <a name="currentRevision" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.currentRevision"></a>

```typescript
public readonly currentRevision: IWebFunctionRevision;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a>

The revision built from the current code and configuration.

---

##### `endpoint`<sup>Required</sup> <a name="endpoint" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.endpoint"></a>

```typescript
public readonly endpoint: WebFunctionEndpoint;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a>

The default endpoint.

Add more with `addEndpoint`.

---

##### `grantPrincipal`<sup>Required</sup> <a name="grantPrincipal" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.grantPrincipal"></a>

```typescript
public readonly grantPrincipal: IPrincipal;
```

- *Type:* aws-cdk-lib.aws_iam.IPrincipal

The principal to grant permissions to (the execution role).

---

##### `grants`<sup>Required</sup> <a name="grants" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.grants"></a>

```typescript
public readonly grants: WebFunctionGrants;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants">WebFunctionGrants</a>

Grants on the default endpoint (e.g. `grants.invoke(principal)`). Other endpoints have their own `grants`.

---

##### `logGroup`<sup>Required</sup> <a name="logGroup" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.logGroup"></a>

```typescript
public readonly logGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The home-region log group that receives the logs of every region the function serves from.

Subscribe to this one only: each region's `.local` group holds a copy of the same events.

---

##### `revisionId`<sup>Required</sup> <a name="revisionId" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.revisionId"></a>

```typescript
public readonly revisionId: string;
```

- *Type:* string

The ID of the current revision.

Same as `currentRevision.revisionId`.

---

##### `role`<sup>Required</sup> <a name="role" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.role"></a>

```typescript
public readonly role: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The execution role.

---


### WebFunction <a name="WebFunction" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction"></a>

- *Implements:* aws-cdk-lib.aws_iam.IGrantable

A Node.js HTTP server running as an AWS Lambda Web Function, served from one or more regions.

Creates the function, its current revision (code and configuration; any change creates a new one,
and the newest `revisionRetention` are kept), a default HTTPS endpoint, an execution role, and owns
the function's log groups in every region its endpoints serve from.

Use `fromWebFunctionArn`, `fromWebFunctionName` or `fromWebFunctionAttributes` for a function defined elsewhere.

#### Initializers <a name="Initializers" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.Initializer"></a>

```typescript
import { WebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

new WebFunction(scope: Construct, id: string, props: WebFunctionProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.Initializer.parameter.props">props</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps">WebFunctionProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.Initializer.parameter.props"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps">WebFunctionProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.with">with</a></code> | Applies one or more mixins to this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.applyCrossStackReferenceStrength">applyCrossStackReferenceStrength</a></code> | Override the cross-stack reference strength for this resource. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.addToResourcePolicy">addToResourcePolicy</a></code> | Adds a statement to the function's resource policy, e.g. to let another account manage the function. For invoking, prefer `addPermission` or `grantInvoke`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.grantInvoke">grantInvoke</a></code> | Allows `grantee` to call the endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.metric">metric</a></code> | A metric of this function's execution environments in `AWS/Lambda/Web` (dimension `FunctionName`), across all endpoints. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricActiveTime">metricActiveTime</a></code> | Time the execution environments were active (`EnvironmentActiveTime`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricConcurrentRequests">metricConcurrentRequests</a></code> | Requests an execution environment handled at once (`EnvironmentConcurrentRequests`), to compare with `maxConcurrencyPerEnvironment`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricCpuTime">metricCpuTime</a></code> | CPU time the execution environments used (`EnvironmentCPUTime`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricMaxMemoryUsage">metricMaxMemoryUsage</a></code> | Peak memory an execution environment used (`EnvironmentMaxMemoryUsage`); |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricResponseBytes">metricResponseBytes</a></code> | Bytes sent in responses (`ResponseBytes`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.addEndpoint">addEndpoint</a></code> | Adds an endpoint (up to 10 per function), e.g. a public one next to an IAM-only one, or one pinned to an earlier revision. Each endpoint has its own URL, authentication, regions and limits. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.addEnvironment">addEnvironment</a></code> | Adds an environment variable. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.addPermission">addPermission</a></code> | Allows a principal in another account, an AWS service or an organization to call the function's endpoints, through the function's resource policy. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.addToRolePolicy">addToRolePolicy</a></code> | Adds a statement to the execution role's policy. |

---

##### `toString` <a name="toString" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

---

##### `applyCrossStackReferenceStrength` <a name="applyCrossStackReferenceStrength" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.applyCrossStackReferenceStrength"></a>

```typescript
public applyCrossStackReferenceStrength(strength: ReferenceStrength): void
```

Override the cross-stack reference strength for this resource.

When set, any cross-stack reference to this resource will use the specified
mechanism instead of the global default determined by the
`@aws-cdk/core:defaultCrossStackReferences` context key. This is useful for
selectively weakening specific references to avoid the "deadly embrace" problem
without changing the app-wide default.

###### `strength`<sup>Required</sup> <a name="strength" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.applyCrossStackReferenceStrength.parameter.strength"></a>

- *Type:* aws-cdk-lib.ReferenceStrength

The reference strength to use for this resource.

---

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.applyRemovalPolicy"></a>

```typescript
public applyRemovalPolicy(policy: RemovalPolicy): void
```

Apply the given removal policy to this resource.

The Removal Policy controls what happens to this resource when it stops
being managed by CloudFormation, either because you've removed it from the
CDK application or because you've made a change that requires the resource
to be replaced.

The resource can be deleted (`RemovalPolicy.DESTROY`), or left in your AWS
account for data recovery and cleanup later (`RemovalPolicy.RETAIN`).

###### `policy`<sup>Required</sup> <a name="policy" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `addToResourcePolicy` <a name="addToResourcePolicy" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addToResourcePolicy"></a>

```typescript
public addToResourcePolicy(statement: PolicyStatement): AddToResourcePolicyResult
```

Adds a statement to the function's resource policy, e.g. to let another account manage the function. For invoking, prefer `addPermission` or `grantInvoke`.

The function has one resource policy (`AWS::Lambda::ResourcePolicy`), created on the first statement. This stack
is its only writer: another stack or template can't also attach one, and changes made outside CloudFormation
are overwritten by the next update of the policy.

###### `statement`<sup>Required</sup> <a name="statement" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addToResourcePolicy.parameter.statement"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

---

##### `grantInvoke` <a name="grantInvoke" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.grantInvoke"></a>

```typescript
public grantInvoke(grantee: IGrantable): Grant
```

Allows `grantee` to call the endpoint.

Shortcut for `grants.invoke(grantee)`, as on `lambda.Function`.
[disable-awslint:no-grants]

###### `grantee`<sup>Required</sup> <a name="grantee" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.grantInvoke.parameter.grantee"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

##### `metric` <a name="metric" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metric"></a>

```typescript
public metric(metricName: string, props?: MetricOptions): Metric
```

A metric of this function's execution environments in `AWS/Lambda/Web` (dimension `FunctionName`), across all endpoints.

For request and error counts, use the endpoint's metrics (`fn.endpoint.metricRequests()`).

Metrics are published in the region that served the request: pass `region` for another serving region.
An alarm can only use metrics from its own stack's region.

###### `metricName`<sup>Required</sup> <a name="metricName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metric.parameter.metricName"></a>

- *Type:* string

---

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metric.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricActiveTime` <a name="metricActiveTime" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricActiveTime"></a>

```typescript
public metricActiveTime(props?: MetricOptions): Metric
```

Time the execution environments were active (`EnvironmentActiveTime`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricActiveTime.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricConcurrentRequests` <a name="metricConcurrentRequests" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricConcurrentRequests"></a>

```typescript
public metricConcurrentRequests(props?: MetricOptions): Metric
```

Requests an execution environment handled at once (`EnvironmentConcurrentRequests`), to compare with `maxConcurrencyPerEnvironment`.

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricConcurrentRequests.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricCpuTime` <a name="metricCpuTime" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricCpuTime"></a>

```typescript
public metricCpuTime(props?: MetricOptions): Metric
```

CPU time the execution environments used (`EnvironmentCPUTime`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricCpuTime.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricMaxMemoryUsage` <a name="metricMaxMemoryUsage" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricMaxMemoryUsage"></a>

```typescript
public metricMaxMemoryUsage(props?: MetricOptions): Metric
```

Peak memory an execution environment used (`EnvironmentMaxMemoryUsage`);

each environment has 2 GB.

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricMaxMemoryUsage.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricResponseBytes` <a name="metricResponseBytes" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricResponseBytes"></a>

```typescript
public metricResponseBytes(props?: MetricOptions): Metric
```

Bytes sent in responses (`ResponseBytes`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.metricResponseBytes.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `addEndpoint` <a name="addEndpoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addEndpoint"></a>

```typescript
public addEndpoint(id: string, options: AddWebFunctionEndpointOptions): WebFunctionEndpoint
```

Adds an endpoint (up to 10 per function), e.g. a public one next to an IAM-only one, or one pinned to an earlier revision. Each endpoint has its own URL, authentication, regions and limits.

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addEndpoint.parameter.id"></a>

- *Type:* string

the endpoint's construct ID, also used in its generated name (`<id>-<hash>`).

---

###### `options`<sup>Required</sup> <a name="options" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addEndpoint.parameter.options"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions">AddWebFunctionEndpointOptions</a>

---

##### `addEnvironment` <a name="addEnvironment" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addEnvironment"></a>

```typescript
public addEnvironment(key: string, value: string): WebFunction
```

Adds an environment variable.

Names starting with `AWS_` are reserved.

###### `key`<sup>Required</sup> <a name="key" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addEnvironment.parameter.key"></a>

- *Type:* string

---

###### `value`<sup>Required</sup> <a name="value" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addEnvironment.parameter.value"></a>

- *Type:* string

---

##### `addPermission` <a name="addPermission" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addPermission"></a>

```typescript
public addPermission(id: string, permission: WebFunctionPermission): void
```

Allows a principal in another account, an AWS service or an organization to call the function's endpoints, through the function's resource policy.

For a role in this account, use `grantInvoke`.

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addPermission.parameter.id"></a>

- *Type:* string

the statement ID (`Sid`): letters and digits, unique within the function.

---

###### `permission`<sup>Required</sup> <a name="permission" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addPermission.parameter.permission"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission">WebFunctionPermission</a>

---

##### `addToRolePolicy` <a name="addToRolePolicy" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addToRolePolicy"></a>

```typescript
public addToRolePolicy(statement: PolicyStatement): void
```

Adds a statement to the execution role's policy.

###### `statement`<sup>Required</sup> <a name="statement" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addToRolePolicy.parameter.statement"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.isResource">isResource</a></code> | Check whether the given construct is a Resource. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionArn">fromWebFunctionArn</a></code> | Imports an existing Web Function by its ARN (in any region or account). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionAttributes">fromWebFunctionAttributes</a></code> | Imports an existing Web Function: give its ARN or its name, and optionally the endpoint `grantInvoke` allows. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionName">fromWebFunctionName</a></code> | Imports an existing Web Function in this stack's account and region by its name. |

---

##### `isConstruct` <a name="isConstruct" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.isConstruct"></a>

```typescript
import { WebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunction.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isOwnedResource` <a name="isOwnedResource" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.isOwnedResource"></a>

```typescript
import { WebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunction.isOwnedResource(construct: IConstruct)
```

Returns true if the construct was created by CDK, and false otherwise.

###### `construct`<sup>Required</sup> <a name="construct" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.isOwnedResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `isResource` <a name="isResource" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.isResource"></a>

```typescript
import { WebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunction.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `fromWebFunctionArn` <a name="fromWebFunctionArn" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionArn"></a>

```typescript
import { WebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunction.fromWebFunctionArn(scope: Construct, id: string, webFunctionArn: string)
```

Imports an existing Web Function by its ARN (in any region or account).

###### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionArn.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionArn.parameter.id"></a>

- *Type:* string

---

###### `webFunctionArn`<sup>Required</sup> <a name="webFunctionArn" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionArn.parameter.webFunctionArn"></a>

- *Type:* string

---

##### `fromWebFunctionAttributes` <a name="fromWebFunctionAttributes" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionAttributes"></a>

```typescript
import { WebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunction.fromWebFunctionAttributes(scope: Construct, id: string, attrs: WebFunctionAttributes)
```

Imports an existing Web Function: give its ARN or its name, and optionally the endpoint `grantInvoke` allows.

###### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionAttributes.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionAttributes.parameter.id"></a>

- *Type:* string

---

###### `attrs`<sup>Required</sup> <a name="attrs" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionAttributes.parameter.attrs"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAttributes">WebFunctionAttributes</a>

---

##### `fromWebFunctionName` <a name="fromWebFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionName"></a>

```typescript
import { WebFunction } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunction.fromWebFunctionName(scope: Construct, id: string, webFunctionName: string)
```

Imports an existing Web Function in this stack's account and region by its name.

###### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionName.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionName.parameter.id"></a>

- *Type:* string

---

###### `webFunctionName`<sup>Required</sup> <a name="webFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.fromWebFunctionName.parameter.webFunctionName"></a>

- *Type:* string

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.env">env</a></code> | <code>aws-cdk-lib.interfaces.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.webFunctionArn">webFunctionArn</a></code> | <code>string</code> | The function's ARN. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.webFunctionName">webFunctionName</a></code> | <code>string</code> | The function's name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.webFunctionRef">webFunctionRef</a></code> | <code>aws-cdk-lib.interfaces.aws_lambda.WebFunctionReference</code> | A reference to this function, for APIs that accept `lambda.IWebFunctionRef`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.currentRevision">currentRevision</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a></code> | The revision built from the current code and configuration. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a></code> | The default endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.grantPrincipal">grantPrincipal</a></code> | <code>aws-cdk-lib.aws_iam.IPrincipal</code> | The principal to grant permissions to (the execution role). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.grants">grants</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants">WebFunctionGrants</a></code> | Grants on the default endpoint (e.g. `grants.invoke(principal)`). Other endpoints have their own `grants`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.logGroup">logGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The home-region log group that receives the logs of every region the function serves from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.revisionId">revisionId</a></code> | <code>string</code> | The ID of the current revision. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.role">role</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The execution role. |

---

##### `node`<sup>Required</sup> <a name="node" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.env"></a>

```typescript
public readonly env: ResourceEnvironment;
```

- *Type:* aws-cdk-lib.interfaces.ResourceEnvironment

The environment this resource belongs to.

For resources that are created and managed in a Stack (those created by
creating new class instances like `new Role()`, `new Bucket()`, etc.), this
is always the same as the environment of the stack they belong to.

For referenced resources (those obtained from referencing methods like
`Role.fromRoleArn()`, `Bucket.fromBucketName()`, etc.), they might be
different than the stack they were imported into.

---

##### `stack`<sup>Required</sup> <a name="stack" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `webFunctionArn`<sup>Required</sup> <a name="webFunctionArn" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.webFunctionArn"></a>

```typescript
public readonly webFunctionArn: string;
```

- *Type:* string

The function's ARN.

---

##### `webFunctionName`<sup>Required</sup> <a name="webFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.webFunctionName"></a>

```typescript
public readonly webFunctionName: string;
```

- *Type:* string

The function's name.

---

##### `webFunctionRef`<sup>Required</sup> <a name="webFunctionRef" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.webFunctionRef"></a>

```typescript
public readonly webFunctionRef: WebFunctionReference;
```

- *Type:* aws-cdk-lib.interfaces.aws_lambda.WebFunctionReference

A reference to this function, for APIs that accept `lambda.IWebFunctionRef`.

---

##### `currentRevision`<sup>Required</sup> <a name="currentRevision" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.currentRevision"></a>

```typescript
public readonly currentRevision: IWebFunctionRevision;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a>

The revision built from the current code and configuration.

---

##### `endpoint`<sup>Required</sup> <a name="endpoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.endpoint"></a>

```typescript
public readonly endpoint: WebFunctionEndpoint;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a>

The default endpoint.

Add more with `addEndpoint`.

---

##### `grantPrincipal`<sup>Required</sup> <a name="grantPrincipal" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.grantPrincipal"></a>

```typescript
public readonly grantPrincipal: IPrincipal;
```

- *Type:* aws-cdk-lib.aws_iam.IPrincipal

The principal to grant permissions to (the execution role).

---

##### `grants`<sup>Required</sup> <a name="grants" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.grants"></a>

```typescript
public readonly grants: WebFunctionGrants;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants">WebFunctionGrants</a>

Grants on the default endpoint (e.g. `grants.invoke(principal)`). Other endpoints have their own `grants`.

---

##### `logGroup`<sup>Required</sup> <a name="logGroup" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.logGroup"></a>

```typescript
public readonly logGroup: ILogGroup;
```

- *Type:* aws-cdk-lib.aws_logs.ILogGroup

The home-region log group that receives the logs of every region the function serves from.

Subscribe to this one only: each region's `.local` group holds a copy of the same events.

---

##### `revisionId`<sup>Required</sup> <a name="revisionId" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.revisionId"></a>

```typescript
public readonly revisionId: string;
```

- *Type:* string

The ID of the current revision.

Same as `currentRevision.revisionId`.

---

##### `role`<sup>Required</sup> <a name="role" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.role"></a>

```typescript
public readonly role: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The execution role.

---


### WebFunctionBase <a name="WebFunctionBase" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase"></a>

- *Implements:* <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction">IWebFunction</a>

What `WebFunction` and imported functions have in common.

#### Initializers <a name="Initializers" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.Initializer"></a>

```typescript
import { WebFunctionBase } from '@ashishpandeyone/cdk-lambda-web-function'

new WebFunctionBase(scope: Construct, id: string, props?: ResourceProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.Initializer.parameter.props">props</a></code> | <code>aws-cdk-lib.ResourceProps</code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.Initializer.parameter.props"></a>

- *Type:* aws-cdk-lib.ResourceProps

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.with">with</a></code> | Applies one or more mixins to this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.applyCrossStackReferenceStrength">applyCrossStackReferenceStrength</a></code> | Override the cross-stack reference strength for this resource. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.addToResourcePolicy">addToResourcePolicy</a></code> | Adds a statement to the function's resource policy (not added for an imported function). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.grantInvoke">grantInvoke</a></code> | Allows `grantee` to call the function's endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metric">metric</a></code> | A metric of this function's execution environments in `AWS/Lambda/Web` (dimension `FunctionName`), across all endpoints. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricActiveTime">metricActiveTime</a></code> | Time the execution environments were active (`EnvironmentActiveTime`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricConcurrentRequests">metricConcurrentRequests</a></code> | Requests an execution environment handled at once (`EnvironmentConcurrentRequests`), to compare with `maxConcurrencyPerEnvironment`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricCpuTime">metricCpuTime</a></code> | CPU time the execution environments used (`EnvironmentCPUTime`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricMaxMemoryUsage">metricMaxMemoryUsage</a></code> | Peak memory an execution environment used (`EnvironmentMaxMemoryUsage`); |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricResponseBytes">metricResponseBytes</a></code> | Bytes sent in responses (`ResponseBytes`). |

---

##### `toString` <a name="toString" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

---

##### `applyCrossStackReferenceStrength` <a name="applyCrossStackReferenceStrength" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.applyCrossStackReferenceStrength"></a>

```typescript
public applyCrossStackReferenceStrength(strength: ReferenceStrength): void
```

Override the cross-stack reference strength for this resource.

When set, any cross-stack reference to this resource will use the specified
mechanism instead of the global default determined by the
`@aws-cdk/core:defaultCrossStackReferences` context key. This is useful for
selectively weakening specific references to avoid the "deadly embrace" problem
without changing the app-wide default.

###### `strength`<sup>Required</sup> <a name="strength" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.applyCrossStackReferenceStrength.parameter.strength"></a>

- *Type:* aws-cdk-lib.ReferenceStrength

The reference strength to use for this resource.

---

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.applyRemovalPolicy"></a>

```typescript
public applyRemovalPolicy(policy: RemovalPolicy): void
```

Apply the given removal policy to this resource.

The Removal Policy controls what happens to this resource when it stops
being managed by CloudFormation, either because you've removed it from the
CDK application or because you've made a change that requires the resource
to be replaced.

The resource can be deleted (`RemovalPolicy.DESTROY`), or left in your AWS
account for data recovery and cleanup later (`RemovalPolicy.RETAIN`).

###### `policy`<sup>Required</sup> <a name="policy" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `addToResourcePolicy` <a name="addToResourcePolicy" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.addToResourcePolicy"></a>

```typescript
public addToResourcePolicy(statement: PolicyStatement): AddToResourcePolicyResult
```

Adds a statement to the function's resource policy (not added for an imported function).

###### `statement`<sup>Required</sup> <a name="statement" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.addToResourcePolicy.parameter.statement"></a>

- *Type:* aws-cdk-lib.aws_iam.PolicyStatement

---

##### `grantInvoke` <a name="grantInvoke" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.grantInvoke"></a>

```typescript
public grantInvoke(grantee: IGrantable): Grant
```

Allows `grantee` to call the function's endpoint.

[disable-awslint:no-grants]

###### `grantee`<sup>Required</sup> <a name="grantee" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.grantInvoke.parameter.grantee"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

##### `metric` <a name="metric" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metric"></a>

```typescript
public metric(metricName: string, props?: MetricOptions): Metric
```

A metric of this function's execution environments in `AWS/Lambda/Web` (dimension `FunctionName`), across all endpoints.

For request and error counts, use the endpoint's metrics (`fn.endpoint.metricRequests()`).

Metrics are published in the region that served the request: pass `region` for another serving region.
An alarm can only use metrics from its own stack's region.

###### `metricName`<sup>Required</sup> <a name="metricName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metric.parameter.metricName"></a>

- *Type:* string

---

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metric.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricActiveTime` <a name="metricActiveTime" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricActiveTime"></a>

```typescript
public metricActiveTime(props?: MetricOptions): Metric
```

Time the execution environments were active (`EnvironmentActiveTime`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricActiveTime.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricConcurrentRequests` <a name="metricConcurrentRequests" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricConcurrentRequests"></a>

```typescript
public metricConcurrentRequests(props?: MetricOptions): Metric
```

Requests an execution environment handled at once (`EnvironmentConcurrentRequests`), to compare with `maxConcurrencyPerEnvironment`.

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricConcurrentRequests.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricCpuTime` <a name="metricCpuTime" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricCpuTime"></a>

```typescript
public metricCpuTime(props?: MetricOptions): Metric
```

CPU time the execution environments used (`EnvironmentCPUTime`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricCpuTime.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricMaxMemoryUsage` <a name="metricMaxMemoryUsage" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricMaxMemoryUsage"></a>

```typescript
public metricMaxMemoryUsage(props?: MetricOptions): Metric
```

Peak memory an execution environment used (`EnvironmentMaxMemoryUsage`);

each environment has 2 GB.

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricMaxMemoryUsage.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricResponseBytes` <a name="metricResponseBytes" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricResponseBytes"></a>

```typescript
public metricResponseBytes(props?: MetricOptions): Metric
```

Bytes sent in responses (`ResponseBytes`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.metricResponseBytes.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.isResource">isResource</a></code> | Check whether the given construct is a Resource. |

---

##### `isConstruct` <a name="isConstruct" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.isConstruct"></a>

```typescript
import { WebFunctionBase } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunctionBase.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isOwnedResource` <a name="isOwnedResource" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.isOwnedResource"></a>

```typescript
import { WebFunctionBase } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunctionBase.isOwnedResource(construct: IConstruct)
```

Returns true if the construct was created by CDK, and false otherwise.

###### `construct`<sup>Required</sup> <a name="construct" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.isOwnedResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

##### `isResource` <a name="isResource" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.isResource"></a>

```typescript
import { WebFunctionBase } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunctionBase.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.env">env</a></code> | <code>aws-cdk-lib.interfaces.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.webFunctionArn">webFunctionArn</a></code> | <code>string</code> | The function's ARN. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.webFunctionName">webFunctionName</a></code> | <code>string</code> | The function's name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.webFunctionRef">webFunctionRef</a></code> | <code>aws-cdk-lib.interfaces.aws_lambda.WebFunctionReference</code> | A reference to this function, for APIs that accept `lambda.IWebFunctionRef`. |

---

##### `node`<sup>Required</sup> <a name="node" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.env"></a>

```typescript
public readonly env: ResourceEnvironment;
```

- *Type:* aws-cdk-lib.interfaces.ResourceEnvironment

The environment this resource belongs to.

For resources that are created and managed in a Stack (those created by
creating new class instances like `new Role()`, `new Bucket()`, etc.), this
is always the same as the environment of the stack they belong to.

For referenced resources (those obtained from referencing methods like
`Role.fromRoleArn()`, `Bucket.fromBucketName()`, etc.), they might be
different than the stack they were imported into.

---

##### `stack`<sup>Required</sup> <a name="stack" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `webFunctionArn`<sup>Required</sup> <a name="webFunctionArn" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.webFunctionArn"></a>

```typescript
public readonly webFunctionArn: string;
```

- *Type:* string

The function's ARN.

---

##### `webFunctionName`<sup>Required</sup> <a name="webFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.webFunctionName"></a>

```typescript
public readonly webFunctionName: string;
```

- *Type:* string

The function's name.

---

##### `webFunctionRef`<sup>Required</sup> <a name="webFunctionRef" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase.property.webFunctionRef"></a>

```typescript
public readonly webFunctionRef: WebFunctionReference;
```

- *Type:* aws-cdk-lib.interfaces.aws_lambda.WebFunctionReference

A reference to this function, for APIs that accept `lambda.IWebFunctionRef`.

---


### WebFunctionEndpoint <a name="WebFunctionEndpoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint"></a>

An HTTPS endpoint of a Web Function: `fn.endpoint` (the default one) or the result of `fn.addEndpoint()`.

Endpoints are created only through `WebFunction`, which owns their log groups in every region, so the constructor is private.

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.with">with</a></code> | Applies one or more mixins to this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.grantInvoke">grantInvoke</a></code> | Allows `grantee` to call this endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metric">metric</a></code> | A metric of this endpoint in `AWS/Lambda/Web` (dimensions `FunctionName` and `EndpointName`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricActiveEnvironments">metricActiveEnvironments</a></code> | Execution environments serving the endpoint (`EndpointActiveEnvironments`), to compare with `maxEnvironments`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricClientErrorRate">metricClientErrorRate</a></code> | The percentage of requests answered with a 4XX status (math expression; |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricClientErrors">metricClientErrors</a></code> | Requests answered with a 4XX status (`HTTPResponseStatusClass4XX`), including 429s from `rateLimit` and `maxEnvironments`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricEnvironmentThrottles">metricEnvironmentThrottles</a></code> | Requests rejected with 429 because the endpoint reached `maxEnvironments` (`EndpointActiveEnvironmentThrottles`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricRequests">metricRequests</a></code> | Requests the endpoint served (`ExecutedRequests`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricRequestThrottles">metricRequestThrottles</a></code> | Requests rejected with 429 because the endpoint reached its `rateLimit` (`EndpointRequestThrottles`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricServerErrorRate">metricServerErrorRate</a></code> | The percentage of requests answered with a 5XX status (math expression; |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricServerErrors">metricServerErrors</a></code> | Requests answered with a 5XX status (`HTTPResponseStatusClass5XX`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.regionalDomainName">regionalDomainName</a></code> | The domain name of this endpoint in one region. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.regionalUrl">regionalUrl</a></code> | The URL of this endpoint in one region. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.routeTraffic">routeTraffic</a></code> | Routes the endpoint to `revision` instead of the function's current revision, optionally sharing traffic with one more revision (`additionalRevisions`, which gets its weight; |

---

##### `toString` <a name="toString" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

The mixins to apply.

---

##### `grantInvoke` <a name="grantInvoke" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.grantInvoke"></a>

```typescript
public grantInvoke(grantee: IGrantable): Grant
```

Allows `grantee` to call this endpoint.

Shortcut for `grants.invoke(grantee)`.
[disable-awslint:no-grants]

###### `grantee`<sup>Required</sup> <a name="grantee" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.grantInvoke.parameter.grantee"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

##### `metric` <a name="metric" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metric"></a>

```typescript
public metric(metricName: string, props?: MetricOptions): Metric
```

A metric of this endpoint in `AWS/Lambda/Web` (dimensions `FunctionName` and `EndpointName`).

Metrics are published in the region that served the request: pass `region` for one of the endpoint's
other regions. An alarm can only use metrics from its own stack's region.

###### `metricName`<sup>Required</sup> <a name="metricName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metric.parameter.metricName"></a>

- *Type:* string

---

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metric.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricActiveEnvironments` <a name="metricActiveEnvironments" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricActiveEnvironments"></a>

```typescript
public metricActiveEnvironments(props?: MetricOptions): Metric
```

Execution environments serving the endpoint (`EndpointActiveEnvironments`), to compare with `maxEnvironments`.

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricActiveEnvironments.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricClientErrorRate` <a name="metricClientErrorRate" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricClientErrorRate"></a>

```typescript
public metricClientErrorRate(props?: MetricOptions): MathExpression
```

The percentage of requests answered with a 4XX status (math expression;

periods with no 4XX count as 0).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricClientErrorRate.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricClientErrors` <a name="metricClientErrors" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricClientErrors"></a>

```typescript
public metricClientErrors(props?: MetricOptions): Metric
```

Requests answered with a 4XX status (`HTTPResponseStatusClass4XX`), including 429s from `rateLimit` and `maxEnvironments`.

The metric only exists once it's non-zero, so alarms should treat missing data as not breaching.

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricClientErrors.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricEnvironmentThrottles` <a name="metricEnvironmentThrottles" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricEnvironmentThrottles"></a>

```typescript
public metricEnvironmentThrottles(props?: MetricOptions): Metric
```

Requests rejected with 429 because the endpoint reached `maxEnvironments` (`EndpointActiveEnvironmentThrottles`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricEnvironmentThrottles.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricRequests` <a name="metricRequests" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricRequests"></a>

```typescript
public metricRequests(props?: MetricOptions): Metric
```

Requests the endpoint served (`ExecutedRequests`).

There's no separate count of successful (2XX) responses.

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricRequests.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricRequestThrottles` <a name="metricRequestThrottles" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricRequestThrottles"></a>

```typescript
public metricRequestThrottles(props?: MetricOptions): Metric
```

Requests rejected with 429 because the endpoint reached its `rateLimit` (`EndpointRequestThrottles`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricRequestThrottles.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricServerErrorRate` <a name="metricServerErrorRate" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricServerErrorRate"></a>

```typescript
public metricServerErrorRate(props?: MetricOptions): MathExpression
```

The percentage of requests answered with a 5XX status (math expression;

periods with no 5XX count as 0).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricServerErrorRate.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricServerErrors` <a name="metricServerErrors" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricServerErrors"></a>

```typescript
public metricServerErrors(props?: MetricOptions): Metric
```

Requests answered with a 5XX status (`HTTPResponseStatusClass5XX`).

Includes the platform's 503s while the endpoint
scales up for a sudden burst, not only your application's errors. The metric only exists once it's non-zero.

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.metricServerErrors.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `regionalDomainName` <a name="regionalDomainName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.regionalDomainName"></a>

```typescript
public regionalDomainName(region: string): string
```

The domain name of this endpoint in one region.

Only for `PER_REGION` endpoints.

###### `region`<sup>Required</sup> <a name="region" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.regionalDomainName.parameter.region"></a>

- *Type:* string

one of `regions`.

---

##### `regionalUrl` <a name="regionalUrl" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.regionalUrl"></a>

```typescript
public regionalUrl(region: string): string
```

The URL of this endpoint in one region.

Only for `PER_REGION` endpoints.

###### `region`<sup>Required</sup> <a name="region" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.regionalUrl.parameter.region"></a>

- *Type:* string

one of `regions`.

---

##### `routeTraffic` <a name="routeTraffic" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.routeTraffic"></a>

```typescript
public routeTraffic(revision: IWebFunctionRevision, additionalRevisions?: WebFunctionRevisionWeight[]): void
```

Routes the endpoint to `revision` instead of the function's current revision, optionally sharing traffic with one more revision (`additionalRevisions`, which gets its weight;

`revision` gets the rest).

Use it to keep an endpoint on an earlier revision (`WebFunctionRevision.fromRevisionAttributes`),
or to send part of the traffic to the current revision:
`fn.endpoint.routeTraffic(previous, [{ revision: fn.currentRevision, weight: 0.1 }])`.
Can be called once per endpoint, and not on one created with `revision` or `additionalRevisions`.

###### `revision`<sup>Required</sup> <a name="revision" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.routeTraffic.parameter.revision"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a>

---

###### `additionalRevisions`<sup>Optional</sup> <a name="additionalRevisions" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.routeTraffic.parameter.additionalRevisions"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionWeight">WebFunctionRevisionWeight</a>[]

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.isConstruct"></a>

```typescript
import { WebFunctionEndpoint } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunctionEndpoint.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.authType">authType</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType">WebFunctionAuthType</a></code> | How callers of the endpoint are authenticated. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.domainName">domainName</a></code> | <code>string</code> | The endpoint's domain name: the global domain for `MULTI_REGION`, otherwise the home region's. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.endpointArn">endpointArn</a></code> | <code>string</code> | The endpoint's ARN. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.endpointName">endpointName</a></code> | <code>string</code> | The endpoint's name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.endpointType">endpointType</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType">WebFunctionEndpointType</a></code> | Where the endpoint serves traffic from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.grants">grants</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants">WebFunctionGrants</a></code> | Grants on this endpoint (e.g. `grants.invoke(principal)`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.regions">regions</a></code> | <code>string[]</code> | Every region the endpoint serves from: the home region first, then the others in alphabetical order. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.rollbackAlarms">rollbackAlarms</a></code> | <code>aws-cdk-lib.aws_cloudwatch.IAlarm[]</code> | The alarms this endpoint created for its deployment's `rollbackOn`, one per threshold in every region it serves from (the home region's first). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.url">url</a></code> | <code>string</code> | The endpoint's URL: the global URL for `MULTI_REGION`, otherwise the home region's. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.webFunction">webFunction</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction">IWebFunction</a></code> | The function this endpoint belongs to. |

---

##### `node`<sup>Required</sup> <a name="node" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `authType`<sup>Required</sup> <a name="authType" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.authType"></a>

```typescript
public readonly authType: WebFunctionAuthType;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType">WebFunctionAuthType</a>

How callers of the endpoint are authenticated.

---

##### `domainName`<sup>Required</sup> <a name="domainName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.domainName"></a>

```typescript
public readonly domainName: string;
```

- *Type:* string

The endpoint's domain name: the global domain for `MULTI_REGION`, otherwise the home region's.

---

##### `endpointArn`<sup>Required</sup> <a name="endpointArn" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.endpointArn"></a>

```typescript
public readonly endpointArn: string;
```

- *Type:* string

The endpoint's ARN.

---

##### `endpointName`<sup>Required</sup> <a name="endpointName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.endpointName"></a>

```typescript
public readonly endpointName: string;
```

- *Type:* string

The endpoint's name.

---

##### `endpointType`<sup>Required</sup> <a name="endpointType" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.endpointType"></a>

```typescript
public readonly endpointType: WebFunctionEndpointType;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType">WebFunctionEndpointType</a>

Where the endpoint serves traffic from.

---

##### `grants`<sup>Required</sup> <a name="grants" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.grants"></a>

```typescript
public readonly grants: WebFunctionGrants;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants">WebFunctionGrants</a>

Grants on this endpoint (e.g. `grants.invoke(principal)`).

---

##### `regions`<sup>Required</sup> <a name="regions" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.regions"></a>

```typescript
public readonly regions: string[];
```

- *Type:* string[]

Every region the endpoint serves from: the home region first, then the others in alphabetical order.

---

##### `rollbackAlarms`<sup>Required</sup> <a name="rollbackAlarms" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.rollbackAlarms"></a>

```typescript
public readonly rollbackAlarms: IAlarm[];
```

- *Type:* aws-cdk-lib.aws_cloudwatch.IAlarm[]

The alarms this endpoint created for its deployment's `rollbackOn`, one per threshold in every region it serves from (the home region's first).

Empty without `rollbackOn`.

---

##### `url`<sup>Required</sup> <a name="url" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.url"></a>

```typescript
public readonly url: string;
```

- *Type:* string

The endpoint's URL: the global URL for `MULTI_REGION`, otherwise the home region's.

---

##### `webFunction`<sup>Required</sup> <a name="webFunction" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.webFunction"></a>

```typescript
public readonly webFunction: IWebFunction;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction">IWebFunction</a>

The function this endpoint belongs to.

---


### WebFunctionRevision <a name="WebFunctionRevision" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision"></a>

- *Implements:* <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a>

A revision of a Web Function.

`WebFunction` creates its current revision (`fn.currentRevision`) from its code and configuration.
Use `fromRevisionAttributes` to route an endpoint to an earlier one, which must still exist:
only revisions within `revisionRetention`, or that an endpoint routes to, are kept.

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.with">with</a></code> | Applies one or more mixins to this construct. |

---

##### `toString` <a name="toString" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

The mixins to apply.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.fromRevisionAttributes">fromRevisionAttributes</a></code> | References an existing revision of `webFunction`, e.g. to pin an endpoint to it or split traffic with it. |

---

##### `isConstruct` <a name="isConstruct" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.isConstruct"></a>

```typescript
import { WebFunctionRevision } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunctionRevision.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `fromRevisionAttributes` <a name="fromRevisionAttributes" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.fromRevisionAttributes"></a>

```typescript
import { WebFunctionRevision } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunctionRevision.fromRevisionAttributes(scope: Construct, id: string, attrs: WebFunctionRevisionAttributes)
```

References an existing revision of `webFunction`, e.g. to pin an endpoint to it or split traffic with it.

###### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.fromRevisionAttributes.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `id`<sup>Required</sup> <a name="id" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.fromRevisionAttributes.parameter.id"></a>

- *Type:* string

---

###### `attrs`<sup>Required</sup> <a name="attrs" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.fromRevisionAttributes.parameter.attrs"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionAttributes">WebFunctionRevisionAttributes</a>

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.property.revisionArn">revisionArn</a></code> | <code>string</code> | The revision's ARN. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.property.revisionId">revisionId</a></code> | <code>string</code> | The revision's ID, e.g. `rev-a1b2c`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.property.webFunction">webFunction</a></code> | <code>aws-cdk-lib.interfaces.aws_lambda.IWebFunctionRef</code> | The function the revision belongs to. |

---

##### `node`<sup>Required</sup> <a name="node" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `revisionArn`<sup>Required</sup> <a name="revisionArn" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.property.revisionArn"></a>

```typescript
public readonly revisionArn: string;
```

- *Type:* string

The revision's ARN.

---

##### `revisionId`<sup>Required</sup> <a name="revisionId" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.property.revisionId"></a>

```typescript
public readonly revisionId: string;
```

- *Type:* string

The revision's ID, e.g. `rev-a1b2c`.

---

##### `webFunction`<sup>Required</sup> <a name="webFunction" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision.property.webFunction"></a>

```typescript
public readonly webFunction: IWebFunctionRef;
```

- *Type:* aws-cdk-lib.interfaces.aws_lambda.IWebFunctionRef

The function the revision belongs to.

---


## Structs <a name="Structs" id="Structs"></a>

### AddWebFunctionEndpointOptions <a name="AddWebFunctionEndpointOptions" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions"></a>

Options for `WebFunction.addEndpoint`.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.Initializer"></a>

```typescript
import { AddWebFunctionEndpointOptions } from '@ashishpandeyone/cdk-lambda-web-function'

const addWebFunctionEndpointOptions: AddWebFunctionEndpointOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.deployment">deployment</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment">WebFunctionDeployment</a></code> | How the endpoint moves its traffic to a new revision: all at once, or in steps (`WebFunctionDeployment.canary()` or `linear()`) that watch CloudWatch alarms and move the traffic back when one goes into ALARM. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.description">description</a></code> | <code>string</code> | A description of the endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.endpointName">endpointName</a></code> | <code>string</code> | The endpoint's name, shown in logs (`endpointName`) and in the `lambda-web-endpoint-name` header. Names are unique per function. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.endpointType">endpointType</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType">WebFunctionEndpointType</a></code> | Where the endpoint serves traffic from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.maxEnvironments">maxEnvironments</a></code> | <code>number</code> | The most execution environments the endpoint may use (2–10,000). Each one uses 2 vCPUs of the account's quota. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.rateLimit">rateLimit</a></code> | <code>number</code> | The most requests per second the endpoint accepts; |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.regions">regions</a></code> | <code>string[]</code> | Regions to serve from in addition to the home region (the stack's region). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.authType">authType</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType">WebFunctionAuthType</a></code> | How callers of this endpoint are authenticated. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.additionalRevisions">additionalRevisions</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionWeight">WebFunctionRevisionWeight</a>[]</code> | A second revision and its share of the endpoint's traffic; |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.revision">revision</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a></code> | The revision the endpoint serves, e.g. an earlier one from `WebFunctionRevision.fromRevisionAttributes` to keep this endpoint on it while others move on. Same as calling `routeTraffic`. |

---

##### `deployment`<sup>Optional</sup> <a name="deployment" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.deployment"></a>

```typescript
public readonly deployment: WebFunctionDeployment;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment">WebFunctionDeployment</a>
- *Default:* WebFunctionDeployment.allAtOnce()

How the endpoint moves its traffic to a new revision: all at once, or in steps (`WebFunctionDeployment.canary()` or `linear()`) that watch CloudWatch alarms and move the traffic back when one goes into ALARM.

A deployment in steps can't be combined with `revision`, `additionalRevisions` or `routeTraffic()`.

---

##### `description`<sup>Optional</sup> <a name="description" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* no description

A description of the endpoint.

---

##### `endpointName`<sup>Optional</sup> <a name="endpointName" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.endpointName"></a>

```typescript
public readonly endpointName: string;
```

- *Type:* string
- *Default:* `default-<hash>` for the function's default endpoint, `<id>-<hash>` for endpoints added with `addEndpoint`

The endpoint's name, shown in logs (`endpointName`) and in the `lambda-web-endpoint-name` header. Names are unique per function.

When omitted, the name ends in a hash of the endpoint type and regions, so changing either deploys
a new endpoint cleanly. When set, changing the endpoint type or regions also requires a new name:
two endpoints of one function can't share a name, and CloudFormation creates the replacement
before deleting the old one.

---

##### `endpointType`<sup>Optional</sup> <a name="endpointType" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.endpointType"></a>

```typescript
public readonly endpointType: WebFunctionEndpointType;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType">WebFunctionEndpointType</a>
- *Default:* WebFunctionEndpointType.HOME_REGION

Where the endpoint serves traffic from.

---

##### `maxEnvironments`<sup>Optional</sup> <a name="maxEnvironments" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.maxEnvironments"></a>

```typescript
public readonly maxEnvironments: number;
```

- *Type:* number
- *Default:* scales within the account's vCPU quota

The most execution environments the endpoint may use (2–10,000). Each one uses 2 vCPUs of the account's quota.

Enforced separately in each region the endpoint serves from.

---

##### `rateLimit`<sup>Optional</sup> <a name="rateLimit" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.rateLimit"></a>

```typescript
public readonly rateLimit: number;
```

- *Type:* number
- *Default:* no limit beyond the service quota of 10,000 requests per second per endpoint (per region)

The most requests per second the endpoint accepts;

excess requests get HTTP 429.
Allowed: 0 (blocks all traffic), 100–1,000 in steps of 100, or 2,000–10,000 in steps of 1,000.

Enforced separately in each region the endpoint serves from, so a multi-region endpoint
can accept this many requests per second in every region.

---

##### `regions`<sup>Optional</sup> <a name="regions" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.regions"></a>

```typescript
public readonly regions: string[];
```

- *Type:* string[]
- *Default:* no extra regions

Regions to serve from in addition to the home region (the stack's region).

Required (at least one) for `MULTI_REGION` and `PER_REGION`; must be empty for `HOME_REGION`.

Changing this creates a new endpoint with a new URL.

---

##### `authType`<sup>Required</sup> <a name="authType" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.authType"></a>

```typescript
public readonly authType: WebFunctionAuthType;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType">WebFunctionAuthType</a>

How callers of this endpoint are authenticated.

---

##### `additionalRevisions`<sup>Optional</sup> <a name="additionalRevisions" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.additionalRevisions"></a>

```typescript
public readonly additionalRevisions: WebFunctionRevisionWeight[];
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionWeight">WebFunctionRevisionWeight</a>[]
- *Default:* all traffic goes to `revision`

A second revision and its share of the endpoint's traffic;

`revision` gets the rest.
An endpoint routes to at most two revisions.

---

##### `revision`<sup>Optional</sup> <a name="revision" id="@ashishpandeyone/cdk-lambda-web-function.AddWebFunctionEndpointOptions.property.revision"></a>

```typescript
public readonly revision: IWebFunctionRevision;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a>
- *Default:* the function's current revision (`currentRevision`)

The revision the endpoint serves, e.g. an earlier one from `WebFunctionRevision.fromRevisionAttributes` to keep this endpoint on it while others move on. Same as calling `routeTraffic`.

---

### NodejsWebFunctionBundlingOptions <a name="NodejsWebFunctionBundlingOptions" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions"></a>

How `NodejsWebFunction` bundles the server with esbuild.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.Initializer"></a>

```typescript
import { NodejsWebFunctionBundlingOptions } from '@ashishpandeyone/cdk-lambda-web-function'

const nodejsWebFunctionBundlingOptions: NodejsWebFunctionBundlingOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.banner">banner</a></code> | <code>string</code> | Text to prepend to the bundle. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.define">define</a></code> | <code>{[ key: string ]: string}</code> | Replace global identifiers with constant expressions (esbuild `--define`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.dockerImage">dockerImage</a></code> | <code>aws-cdk-lib.DockerImage</code> | Docker image for bundling when esbuild isn't installed locally. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | Environment variables while bundling (not at runtime). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.esbuildArgs">esbuildArgs</a></code> | <code>{[ key: string ]: string \| boolean}</code> | Extra esbuild arguments, e.g. `{ '--log-limit': '0', '--tree-shaking': true }`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.externalModules">externalModules</a></code> | <code>string[]</code> | Modules to leave out of the bundle. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.footer">footer</a></code> | <code>string</code> | Text to append to the bundle. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.forceDockerBundling">forceDockerBundling</a></code> | <code>boolean</code> | Always bundle in Docker, even if esbuild is installed locally. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.format">format</a></code> | <code>aws-cdk-lib.aws_lambda_nodejs.OutputFormat</code> | Output format. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.keepNames">keepNames</a></code> | <code>boolean</code> | Keep function and class names (`--keep-names`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.loader">loader</a></code> | <code>{[ key: string ]: string}</code> | esbuild loaders by file extension, e.g. `{ '.png': 'dataurl' }`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.minify">minify</a></code> | <code>boolean</code> | Minify the bundle. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.sourceMap">sourceMap</a></code> | <code>boolean</code> | Generate a source map, and set `NODE_OPTIONS=--enable-source-maps` so stack traces point at your sources. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.target">target</a></code> | <code>string</code> | esbuild target. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.tsconfig">tsconfig</a></code> | <code>string</code> | Path of the tsconfig.json to use, relative to the project root or absolute (inside the project root). |

---

##### `banner`<sup>Optional</sup> <a name="banner" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.banner"></a>

```typescript
public readonly banner: string;
```

- *Type:* string
- *Default:* none

Text to prepend to the bundle.

---

##### `define`<sup>Optional</sup> <a name="define" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.define"></a>

```typescript
public readonly define: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* none

Replace global identifiers with constant expressions (esbuild `--define`).

---

##### `dockerImage`<sup>Optional</sup> <a name="dockerImage" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.dockerImage"></a>

```typescript
public readonly dockerImage: DockerImage;
```

- *Type:* aws-cdk-lib.DockerImage
- *Default:* the arm64 AWS SAM build image for the runtime, e.g. `public.ecr.aws/sam/build-nodejs24.x:latest-arm64`

Docker image for bundling when esbuild isn't installed locally.

---

##### `environment`<sup>Optional</sup> <a name="environment" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.environment"></a>

```typescript
public readonly environment: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* none

Environment variables while bundling (not at runtime).

---

##### `esbuildArgs`<sup>Optional</sup> <a name="esbuildArgs" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.esbuildArgs"></a>

```typescript
public readonly esbuildArgs: {[ key: string ]: string | boolean};
```

- *Type:* {[ key: string ]: string | boolean}
- *Default:* none

Extra esbuild arguments, e.g. `{ '--log-limit': '0', '--tree-shaking': true }`.

---

##### `externalModules`<sup>Optional</sup> <a name="externalModules" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.externalModules"></a>

```typescript
public readonly externalModules: string[];
```

- *Type:* string[]
- *Default:* none

Modules to leave out of the bundle.

The runtime has no AWS SDK, so `@aws-sdk/*` is bundled like
any other dependency; only exclude modules you provide another way.

---

##### `footer`<sup>Optional</sup> <a name="footer" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.footer"></a>

```typescript
public readonly footer: string;
```

- *Type:* string
- *Default:* none

Text to append to the bundle.

---

##### `forceDockerBundling`<sup>Optional</sup> <a name="forceDockerBundling" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.forceDockerBundling"></a>

```typescript
public readonly forceDockerBundling: boolean;
```

- *Type:* boolean
- *Default:* false

Always bundle in Docker, even if esbuild is installed locally.

---

##### `format`<sup>Optional</sup> <a name="format" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.format"></a>

```typescript
public readonly format: OutputFormat;
```

- *Type:* aws-cdk-lib.aws_lambda_nodejs.OutputFormat
- *Default:* OutputFormat.ESM

Output format.

ESM is written to `index.mjs` (with a `require` shim, so CommonJS dependencies
such as Express work); CommonJS to `index.js`.

---

##### `keepNames`<sup>Optional</sup> <a name="keepNames" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.keepNames"></a>

```typescript
public readonly keepNames: boolean;
```

- *Type:* boolean
- *Default:* false

Keep function and class names (`--keep-names`).

---

##### `loader`<sup>Optional</sup> <a name="loader" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.loader"></a>

```typescript
public readonly loader: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* esbuild's defaults

esbuild loaders by file extension, e.g. `{ '.png': 'dataurl' }`.

---

##### `minify`<sup>Optional</sup> <a name="minify" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.minify"></a>

```typescript
public readonly minify: boolean;
```

- *Type:* boolean
- *Default:* true

Minify the bundle.

---

##### `sourceMap`<sup>Optional</sup> <a name="sourceMap" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.sourceMap"></a>

```typescript
public readonly sourceMap: boolean;
```

- *Type:* boolean
- *Default:* true

Generate a source map, and set `NODE_OPTIONS=--enable-source-maps` so stack traces point at your sources.

---

##### `target`<sup>Optional</sup> <a name="target" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.target"></a>

```typescript
public readonly target: string;
```

- *Type:* string
- *Default:* the runtime's Node.js version, e.g. `node24`

esbuild target.

---

##### `tsconfig`<sup>Optional</sup> <a name="tsconfig" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions.property.tsconfig"></a>

```typescript
public readonly tsconfig: string;
```

- *Type:* string
- *Default:* esbuild's lookup from the entry file

Path of the tsconfig.json to use, relative to the project root or absolute (inside the project root).

---

### NodejsWebFunctionProps <a name="NodejsWebFunctionProps" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps"></a>

Properties for a `NodejsWebFunction`.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.Initializer"></a>

```typescript
import { NodejsWebFunctionProps } from '@ashishpandeyone/cdk-lambda-web-function'

const nodejsWebFunctionProps: NodejsWebFunctionProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.authType">authType</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType">WebFunctionAuthType</a></code> | How callers of the endpoint are authenticated. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.applicationLogLevelV2">applicationLogLevelV2</a></code> | <code>aws-cdk-lib.aws_lambda.ApplicationLogLevel</code> | The minimum level of application logs to keep. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.description">description</a></code> | <code>string</code> | A description of the function's code and configuration. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions">WebFunctionEndpointOptions</a></code> | The default endpoint (`fn.endpoint`): where it serves from, its name and limits. It serves the current revision; route it elsewhere with `fn.endpoint.routeTraffic()`. Add more endpoints with `addEndpoint`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | Environment variables. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.logRemovalPolicy">logRemovalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | What happens to the log groups when the function is removed: RETAIN or DESTROY. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.logRetention">logRetention</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | Retention for every log group of the function, in every region it serves from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.maxConcurrencyPerEnvironment">maxConcurrencyPerEnvironment</a></code> | <code>number</code> | How many requests one execution environment handles at the same time (1-128). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.revisionRetention">revisionRetention</a></code> | <code>number</code> | How many of the newest revisions to keep (1-50). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.role">role</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The execution role. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.systemLogLevelV2">systemLogLevelV2</a></code> | <code>aws-cdk-lib.aws_lambda.SystemLogLevel</code> | The minimum level of platform logs to keep (DEBUG, INFO or WARN). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | How long a single request may run. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.webFunctionName">webFunctionName</a></code> | <code>string</code> | The function's name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.entry">entry</a></code> | <code>string</code> | The file that starts your server (TypeScript or JavaScript). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.bundling">bundling</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions">NodejsWebFunctionBundlingOptions</a></code> | How the server is bundled. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.depsLockFilePath">depsLockFilePath</a></code> | <code>string</code> | The lock file that marks the project root (where esbuild resolves `node_modules`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.projectRoot">projectRoot</a></code> | <code>string</code> | The project root. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.runtime">runtime</a></code> | <code>aws-cdk-lib.aws_lambda.Runtime</code> | The Node.js runtime. |

---

##### `authType`<sup>Required</sup> <a name="authType" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.authType"></a>

```typescript
public readonly authType: WebFunctionAuthType;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType">WebFunctionAuthType</a>

How callers of the endpoint are authenticated.

---

##### `applicationLogLevelV2`<sup>Optional</sup> <a name="applicationLogLevelV2" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.applicationLogLevelV2"></a>

```typescript
public readonly applicationLogLevelV2: ApplicationLogLevel;
```

- *Type:* aws-cdk-lib.aws_lambda.ApplicationLogLevel
- *Default:* lambda.ApplicationLogLevel.INFO

The minimum level of application logs to keep.

---

##### `description`<sup>Optional</sup> <a name="description" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* no description

A description of the function's code and configuration.

---

##### `endpoint`<sup>Optional</sup> <a name="endpoint" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.endpoint"></a>

```typescript
public readonly endpoint: WebFunctionEndpointOptions;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions">WebFunctionEndpointOptions</a>
- *Default:* a HOME_REGION endpoint serving the current revision

The default endpoint (`fn.endpoint`): where it serves from, its name and limits. It serves the current revision; route it elsewhere with `fn.endpoint.routeTraffic()`. Add more endpoints with `addEndpoint`.

---

##### `environment`<sup>Optional</sup> <a name="environment" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.environment"></a>

```typescript
public readonly environment: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* none

Environment variables.

Names starting with `AWS_` are reserved.

---

##### `logRemovalPolicy`<sup>Optional</sup> <a name="logRemovalPolicy" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.logRemovalPolicy"></a>

```typescript
public readonly logRemovalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RemovalPolicy.RETAIN

What happens to the log groups when the function is removed: RETAIN or DESTROY.

With DESTROY, deletion waits about a minute for environments to flush their last lines.

---

##### `logRetention`<sup>Optional</sup> <a name="logRetention" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.logRetention"></a>

```typescript
public readonly logRetention: RetentionDays;
```

- *Type:* aws-cdk-lib.aws_logs.RetentionDays
- *Default:* logs.RetentionDays.ONE_MONTH

Retention for every log group of the function, in every region it serves from.

---

##### `maxConcurrencyPerEnvironment`<sup>Optional</sup> <a name="maxConcurrencyPerEnvironment" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.maxConcurrencyPerEnvironment"></a>

```typescript
public readonly maxConcurrencyPerEnvironment: number;
```

- *Type:* number
- *Default:* 64

How many requests one execution environment handles at the same time (1-128).

Requests share module-level state, so handlers must be concurrency-safe.

---

##### `revisionRetention`<sup>Optional</sup> <a name="revisionRetention" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.revisionRetention"></a>

```typescript
public readonly revisionRetention: number;
```

- *Type:* number
- *Default:* 20

How many of the newest revisions to keep (1-50).

Each deployment that changes the code or
configuration creates a revision; older ones stay available to roll back to or route traffic to,
and the oldest beyond this count are deleted after each deployment.

Revisions that an endpoint routes to are never deleted, and neither are those the previous
deployment used (a rollback returns to them).

---

##### `role`<sup>Optional</sup> <a name="role" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.role"></a>

```typescript
public readonly role: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* a role trusting `lambda.amazonaws.com` with `AWSLambdaBasicExecutionRole`

The execution role.

An `iam.IRole` (not `IRoleRef`) because the function adds statements to it and grants through it.
[disable-awslint:prefer-ref-interface]

---

##### `systemLogLevelV2`<sup>Optional</sup> <a name="systemLogLevelV2" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.systemLogLevelV2"></a>

```typescript
public readonly systemLogLevelV2: SystemLogLevel;
```

- *Type:* aws-cdk-lib.aws_lambda.SystemLogLevel
- *Default:* lambda.SystemLogLevel.INFO

The minimum level of platform logs to keep (DEBUG, INFO or WARN).

---

##### `timeout`<sup>Optional</sup> <a name="timeout" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.timeout"></a>

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(30)

How long a single request may run.

---

##### `webFunctionName`<sup>Optional</sup> <a name="webFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.webFunctionName"></a>

```typescript
public readonly webFunctionName: string;
```

- *Type:* string
- *Default:* a unique name generated from the construct path (moving the construct changes it)

The function's name.

Renaming a function replaces it, and its endpoint gets a new URL.

---

##### `entry`<sup>Required</sup> <a name="entry" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.entry"></a>

```typescript
public readonly entry: string;
```

- *Type:* string

The file that starts your server (TypeScript or JavaScript).

It's bundled with its dependencies.

---

##### `bundling`<sup>Optional</sup> <a name="bundling" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.bundling"></a>

```typescript
public readonly bundling: NodejsWebFunctionBundlingOptions;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionBundlingOptions">NodejsWebFunctionBundlingOptions</a>
- *Default:* minified ESM with a source map, targeting the runtime's Node.js version

How the server is bundled.

---

##### `depsLockFilePath`<sup>Optional</sup> <a name="depsLockFilePath" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.depsLockFilePath"></a>

```typescript
public readonly depsLockFilePath: string;
```

- *Type:* string
- *Default:* the nearest `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` or `bun.lock(b)` above the entry

The lock file that marks the project root (where esbuild resolves `node_modules`).

---

##### `projectRoot`<sup>Optional</sup> <a name="projectRoot" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.projectRoot"></a>

```typescript
public readonly projectRoot: string;
```

- *Type:* string
- *Default:* the directory of the lock file

The project root.

Must contain the entry file.

---

##### `runtime`<sup>Optional</sup> <a name="runtime" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.runtime"></a>

```typescript
public readonly runtime: Runtime;
```

- *Type:* aws-cdk-lib.aws_lambda.Runtime
- *Default:* lambda.Runtime.NODEJS_24_X

The Node.js runtime.

---

### WebFunctionAttributes <a name="WebFunctionAttributes" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionAttributes"></a>

Attributes of an existing Web Function.

Give its ARN or its name.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionAttributes.Initializer"></a>

```typescript
import { WebFunctionAttributes } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionAttributes: WebFunctionAttributes = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAttributes.property.endpointName">endpointName</a></code> | <code>string</code> | The endpoint `grantInvoke` allows calling. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAttributes.property.webFunctionArn">webFunctionArn</a></code> | <code>string</code> | The function's ARN, e.g. `arn:aws:lambda:us-east-1:111122223333:web-function/orders`. It may be in another region or account; across accounts, `grantInvoke` also needs the function's resource policy to allow the caller. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAttributes.property.webFunctionName">webFunctionName</a></code> | <code>string</code> | The function's name. |

---

##### `endpointName`<sup>Optional</sup> <a name="endpointName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionAttributes.property.endpointName"></a>

```typescript
public readonly endpointName: string;
```

- *Type:* string
- *Default:* every endpoint of the function

The endpoint `grantInvoke` allows calling.

---

##### `webFunctionArn`<sup>Optional</sup> <a name="webFunctionArn" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionAttributes.property.webFunctionArn"></a>

```typescript
public readonly webFunctionArn: string;
```

- *Type:* string
- *Default:* built from `webFunctionName`, in this stack's account and region

The function's ARN, e.g. `arn:aws:lambda:us-east-1:111122223333:web-function/orders`. It may be in another region or account; across accounts, `grantInvoke` also needs the function's resource policy to allow the caller.

---

##### `webFunctionName`<sup>Optional</sup> <a name="webFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionAttributes.property.webFunctionName"></a>

```typescript
public readonly webFunctionName: string;
```

- *Type:* string
- *Default:* taken from `webFunctionArn`

The function's name.

---

### WebFunctionCanaryDeploymentOptions <a name="WebFunctionCanaryDeploymentOptions" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions"></a>

Options for a canary deployment.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions.Initializer"></a>

```typescript
import { WebFunctionCanaryDeploymentOptions } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionCanaryDeploymentOptions: WebFunctionCanaryDeploymentOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions.property.bake">bake</a></code> | <code>aws-cdk-lib.Duration</code> | How long the new revision serves `percent` before it gets all traffic (1-45 minutes). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions.property.percent">percent</a></code> | <code>number</code> | The share of traffic, in whole percent (1-99), that the new revision gets first. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions.property.alarms">alarms</a></code> | <code>aws-cdk-lib.aws_cloudwatch.IAlarm[]</code> | Alarms that stop the deployment: if one is in ALARM, the endpoint goes back to the previous revision and the deployment fails, so CloudFormation rolls the stack back. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions.property.rollbackOn">rollbackOn</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions">WebFunctionRollbackOptions</a></code> | Alarms on the endpoint's own error rates, created by the endpoint in every region it serves from. |

---

##### `bake`<sup>Required</sup> <a name="bake" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions.property.bake"></a>

```typescript
public readonly bake: Duration;
```

- *Type:* aws-cdk-lib.Duration

How long the new revision serves `percent` before it gets all traffic (1-45 minutes).

Make it longer than the time your alarms need to fire (period × evaluation periods).

---

##### `percent`<sup>Required</sup> <a name="percent" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions.property.percent"></a>

```typescript
public readonly percent: number;
```

- *Type:* number

The share of traffic, in whole percent (1-99), that the new revision gets first.

---

##### `alarms`<sup>Optional</sup> <a name="alarms" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions.property.alarms"></a>

```typescript
public readonly alarms: IAlarm[];
```

- *Type:* aws-cdk-lib.aws_cloudwatch.IAlarm[]
- *Default:* no alarms: traffic moves on a timer

Alarms that stop the deployment: if one is in ALARM, the endpoint goes back to the previous revision and the deployment fails, so CloudFormation rolls the stack back.

They're checked before traffic moves, during the bake, and once the new revision has all traffic.
Use alarms in any region (by ARN), including composite alarms.

---

##### `rollbackOn`<sup>Optional</sup> <a name="rollbackOn" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions.property.rollbackOn"></a>

```typescript
public readonly rollbackOn: WebFunctionRollbackOptions;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions">WebFunctionRollbackOptions</a>
- *Default:* no endpoint alarms

Alarms on the endpoint's own error rates, created by the endpoint in every region it serves from.

They stop the deployment like `alarms` (both can be used together).

---

### WebFunctionEndpointOptions <a name="WebFunctionEndpointOptions" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions"></a>

Options for a Web Function's endpoint.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.Initializer"></a>

```typescript
import { WebFunctionEndpointOptions } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionEndpointOptions: WebFunctionEndpointOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.deployment">deployment</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment">WebFunctionDeployment</a></code> | How the endpoint moves its traffic to a new revision: all at once, or in steps (`WebFunctionDeployment.canary()` or `linear()`) that watch CloudWatch alarms and move the traffic back when one goes into ALARM. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.description">description</a></code> | <code>string</code> | A description of the endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.endpointName">endpointName</a></code> | <code>string</code> | The endpoint's name, shown in logs (`endpointName`) and in the `lambda-web-endpoint-name` header. Names are unique per function. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.endpointType">endpointType</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType">WebFunctionEndpointType</a></code> | Where the endpoint serves traffic from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.maxEnvironments">maxEnvironments</a></code> | <code>number</code> | The most execution environments the endpoint may use (2–10,000). Each one uses 2 vCPUs of the account's quota. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.rateLimit">rateLimit</a></code> | <code>number</code> | The most requests per second the endpoint accepts; |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.regions">regions</a></code> | <code>string[]</code> | Regions to serve from in addition to the home region (the stack's region). |

---

##### `deployment`<sup>Optional</sup> <a name="deployment" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.deployment"></a>

```typescript
public readonly deployment: WebFunctionDeployment;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment">WebFunctionDeployment</a>
- *Default:* WebFunctionDeployment.allAtOnce()

How the endpoint moves its traffic to a new revision: all at once, or in steps (`WebFunctionDeployment.canary()` or `linear()`) that watch CloudWatch alarms and move the traffic back when one goes into ALARM.

A deployment in steps can't be combined with `revision`, `additionalRevisions` or `routeTraffic()`.

---

##### `description`<sup>Optional</sup> <a name="description" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* no description

A description of the endpoint.

---

##### `endpointName`<sup>Optional</sup> <a name="endpointName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.endpointName"></a>

```typescript
public readonly endpointName: string;
```

- *Type:* string
- *Default:* `default-<hash>` for the function's default endpoint, `<id>-<hash>` for endpoints added with `addEndpoint`

The endpoint's name, shown in logs (`endpointName`) and in the `lambda-web-endpoint-name` header. Names are unique per function.

When omitted, the name ends in a hash of the endpoint type and regions, so changing either deploys
a new endpoint cleanly. When set, changing the endpoint type or regions also requires a new name:
two endpoints of one function can't share a name, and CloudFormation creates the replacement
before deleting the old one.

---

##### `endpointType`<sup>Optional</sup> <a name="endpointType" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.endpointType"></a>

```typescript
public readonly endpointType: WebFunctionEndpointType;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType">WebFunctionEndpointType</a>
- *Default:* WebFunctionEndpointType.HOME_REGION

Where the endpoint serves traffic from.

---

##### `maxEnvironments`<sup>Optional</sup> <a name="maxEnvironments" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.maxEnvironments"></a>

```typescript
public readonly maxEnvironments: number;
```

- *Type:* number
- *Default:* scales within the account's vCPU quota

The most execution environments the endpoint may use (2–10,000). Each one uses 2 vCPUs of the account's quota.

Enforced separately in each region the endpoint serves from.

---

##### `rateLimit`<sup>Optional</sup> <a name="rateLimit" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.rateLimit"></a>

```typescript
public readonly rateLimit: number;
```

- *Type:* number
- *Default:* no limit beyond the service quota of 10,000 requests per second per endpoint (per region)

The most requests per second the endpoint accepts;

excess requests get HTTP 429.
Allowed: 0 (blocks all traffic), 100–1,000 in steps of 100, or 2,000–10,000 in steps of 1,000.

Enforced separately in each region the endpoint serves from, so a multi-region endpoint
can accept this many requests per second in every region.

---

##### `regions`<sup>Optional</sup> <a name="regions" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.regions"></a>

```typescript
public readonly regions: string[];
```

- *Type:* string[]
- *Default:* no extra regions

Regions to serve from in addition to the home region (the stack's region).

Required (at least one) for `MULTI_REGION` and `PER_REGION`; must be empty for `HOME_REGION`.

Changing this creates a new endpoint with a new URL.

---

### WebFunctionLinearDeploymentOptions <a name="WebFunctionLinearDeploymentOptions" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions"></a>

Options for a linear deployment.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions.Initializer"></a>

```typescript
import { WebFunctionLinearDeploymentOptions } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionLinearDeploymentOptions: WebFunctionLinearDeploymentOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions.property.interval">interval</a></code> | <code>aws-cdk-lib.Duration</code> | How long each step serves before the next one (at least 1 minute, and at most 45 minutes in total). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions.property.percent">percent</a></code> | <code>number</code> | The share of traffic, in whole percent (5-50), that moves to the new revision at each step. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions.property.alarms">alarms</a></code> | <code>aws-cdk-lib.aws_cloudwatch.IAlarm[]</code> | Alarms that stop the deployment: if one is in ALARM, the endpoint goes back to the previous revision and the deployment fails, so CloudFormation rolls the stack back. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions.property.rollbackOn">rollbackOn</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions">WebFunctionRollbackOptions</a></code> | Alarms on the endpoint's own error rates, created by the endpoint in every region it serves from. |

---

##### `interval`<sup>Required</sup> <a name="interval" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions.property.interval"></a>

```typescript
public readonly interval: Duration;
```

- *Type:* aws-cdk-lib.Duration

How long each step serves before the next one (at least 1 minute, and at most 45 minutes in total).

---

##### `percent`<sup>Required</sup> <a name="percent" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions.property.percent"></a>

```typescript
public readonly percent: number;
```

- *Type:* number

The share of traffic, in whole percent (5-50), that moves to the new revision at each step.

---

##### `alarms`<sup>Optional</sup> <a name="alarms" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions.property.alarms"></a>

```typescript
public readonly alarms: IAlarm[];
```

- *Type:* aws-cdk-lib.aws_cloudwatch.IAlarm[]
- *Default:* no alarms: traffic moves on a timer

Alarms that stop the deployment: if one is in ALARM, the endpoint goes back to the previous revision and the deployment fails, so CloudFormation rolls the stack back.

They're checked before traffic moves, during every step, and once the new revision has all traffic.
Use alarms in any region (by ARN), including composite alarms.

---

##### `rollbackOn`<sup>Optional</sup> <a name="rollbackOn" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions.property.rollbackOn"></a>

```typescript
public readonly rollbackOn: WebFunctionRollbackOptions;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions">WebFunctionRollbackOptions</a>
- *Default:* no endpoint alarms

Alarms on the endpoint's own error rates, created by the endpoint in every region it serves from.

They stop the deployment like `alarms` (both can be used together).

---

### WebFunctionOptions <a name="WebFunctionOptions" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions"></a>

Options shared by `WebFunction` and `NodejsWebFunction`: everything except how the code is supplied.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.Initializer"></a>

```typescript
import { WebFunctionOptions } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionOptions: WebFunctionOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.authType">authType</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType">WebFunctionAuthType</a></code> | How callers of the endpoint are authenticated. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.applicationLogLevelV2">applicationLogLevelV2</a></code> | <code>aws-cdk-lib.aws_lambda.ApplicationLogLevel</code> | The minimum level of application logs to keep. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.description">description</a></code> | <code>string</code> | A description of the function's code and configuration. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions">WebFunctionEndpointOptions</a></code> | The default endpoint (`fn.endpoint`): where it serves from, its name and limits. It serves the current revision; route it elsewhere with `fn.endpoint.routeTraffic()`. Add more endpoints with `addEndpoint`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | Environment variables. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.logRemovalPolicy">logRemovalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | What happens to the log groups when the function is removed: RETAIN or DESTROY. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.logRetention">logRetention</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | Retention for every log group of the function, in every region it serves from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.maxConcurrencyPerEnvironment">maxConcurrencyPerEnvironment</a></code> | <code>number</code> | How many requests one execution environment handles at the same time (1-128). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.revisionRetention">revisionRetention</a></code> | <code>number</code> | How many of the newest revisions to keep (1-50). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.role">role</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The execution role. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.systemLogLevelV2">systemLogLevelV2</a></code> | <code>aws-cdk-lib.aws_lambda.SystemLogLevel</code> | The minimum level of platform logs to keep (DEBUG, INFO or WARN). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | How long a single request may run. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.webFunctionName">webFunctionName</a></code> | <code>string</code> | The function's name. |

---

##### `authType`<sup>Required</sup> <a name="authType" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.authType"></a>

```typescript
public readonly authType: WebFunctionAuthType;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType">WebFunctionAuthType</a>

How callers of the endpoint are authenticated.

---

##### `applicationLogLevelV2`<sup>Optional</sup> <a name="applicationLogLevelV2" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.applicationLogLevelV2"></a>

```typescript
public readonly applicationLogLevelV2: ApplicationLogLevel;
```

- *Type:* aws-cdk-lib.aws_lambda.ApplicationLogLevel
- *Default:* lambda.ApplicationLogLevel.INFO

The minimum level of application logs to keep.

---

##### `description`<sup>Optional</sup> <a name="description" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* no description

A description of the function's code and configuration.

---

##### `endpoint`<sup>Optional</sup> <a name="endpoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.endpoint"></a>

```typescript
public readonly endpoint: WebFunctionEndpointOptions;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions">WebFunctionEndpointOptions</a>
- *Default:* a HOME_REGION endpoint serving the current revision

The default endpoint (`fn.endpoint`): where it serves from, its name and limits. It serves the current revision; route it elsewhere with `fn.endpoint.routeTraffic()`. Add more endpoints with `addEndpoint`.

---

##### `environment`<sup>Optional</sup> <a name="environment" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.environment"></a>

```typescript
public readonly environment: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* none

Environment variables.

Names starting with `AWS_` are reserved.

---

##### `logRemovalPolicy`<sup>Optional</sup> <a name="logRemovalPolicy" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.logRemovalPolicy"></a>

```typescript
public readonly logRemovalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RemovalPolicy.RETAIN

What happens to the log groups when the function is removed: RETAIN or DESTROY.

With DESTROY, deletion waits about a minute for environments to flush their last lines.

---

##### `logRetention`<sup>Optional</sup> <a name="logRetention" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.logRetention"></a>

```typescript
public readonly logRetention: RetentionDays;
```

- *Type:* aws-cdk-lib.aws_logs.RetentionDays
- *Default:* logs.RetentionDays.ONE_MONTH

Retention for every log group of the function, in every region it serves from.

---

##### `maxConcurrencyPerEnvironment`<sup>Optional</sup> <a name="maxConcurrencyPerEnvironment" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.maxConcurrencyPerEnvironment"></a>

```typescript
public readonly maxConcurrencyPerEnvironment: number;
```

- *Type:* number
- *Default:* 64

How many requests one execution environment handles at the same time (1-128).

Requests share module-level state, so handlers must be concurrency-safe.

---

##### `revisionRetention`<sup>Optional</sup> <a name="revisionRetention" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.revisionRetention"></a>

```typescript
public readonly revisionRetention: number;
```

- *Type:* number
- *Default:* 20

How many of the newest revisions to keep (1-50).

Each deployment that changes the code or
configuration creates a revision; older ones stay available to roll back to or route traffic to,
and the oldest beyond this count are deleted after each deployment.

Revisions that an endpoint routes to are never deleted, and neither are those the previous
deployment used (a rollback returns to them).

---

##### `role`<sup>Optional</sup> <a name="role" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.role"></a>

```typescript
public readonly role: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* a role trusting `lambda.amazonaws.com` with `AWSLambdaBasicExecutionRole`

The execution role.

An `iam.IRole` (not `IRoleRef`) because the function adds statements to it and grants through it.
[disable-awslint:prefer-ref-interface]

---

##### `systemLogLevelV2`<sup>Optional</sup> <a name="systemLogLevelV2" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.systemLogLevelV2"></a>

```typescript
public readonly systemLogLevelV2: SystemLogLevel;
```

- *Type:* aws-cdk-lib.aws_lambda.SystemLogLevel
- *Default:* lambda.SystemLogLevel.INFO

The minimum level of platform logs to keep (DEBUG, INFO or WARN).

---

##### `timeout`<sup>Optional</sup> <a name="timeout" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.timeout"></a>

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(30)

How long a single request may run.

---

##### `webFunctionName`<sup>Optional</sup> <a name="webFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.webFunctionName"></a>

```typescript
public readonly webFunctionName: string;
```

- *Type:* string
- *Default:* a unique name generated from the construct path (moving the construct changes it)

The function's name.

Renaming a function replaces it, and its endpoint gets a new URL.

---

### WebFunctionOriginProps <a name="WebFunctionOriginProps" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps"></a>

Properties for a Web Function endpoint origin.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.Initializer"></a>

```typescript
import { WebFunctionOriginProps } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionOriginProps: WebFunctionOriginProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.connectionAttempts">connectionAttempts</a></code> | <code>number</code> | The number of times that CloudFront attempts to connect to the origin; |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.connectionTimeout">connectionTimeout</a></code> | <code>aws-cdk-lib.Duration</code> | The number of seconds that CloudFront waits when trying to establish a connection to the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.customHeaders">customHeaders</a></code> | <code>{[ key: string ]: string}</code> | A list of HTTP header names and values that CloudFront adds to requests it sends to the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.originAccessControlId">originAccessControlId</a></code> | <code>string</code> | The unique identifier of an origin access control for this origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.originId">originId</a></code> | <code>string</code> | A unique identifier for the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.originShieldEnabled">originShieldEnabled</a></code> | <code>boolean</code> | Origin Shield is enabled by setting originShieldRegion to a valid region, after this to disable Origin Shield again you must set this flag to false. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.originShieldRegion">originShieldRegion</a></code> | <code>string</code> | When you enable Origin Shield in the AWS Region that has the lowest latency to your origin, you can get better network performance. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.responseCompletionTimeout">responseCompletionTimeout</a></code> | <code>aws-cdk-lib.Duration</code> | The time that a request from CloudFront to the origin can stay open and wait for a response. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.originPath">originPath</a></code> | <code>string</code> | An optional path that CloudFront appends to the origin domain name when CloudFront requests content from the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.ipAddressType">ipAddressType</a></code> | <code>aws-cdk-lib.aws_cloudfront.OriginIpAddressType</code> | Which IP protocol CloudFront uses to connect to the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.keepaliveTimeout">keepaliveTimeout</a></code> | <code>aws-cdk-lib.Duration</code> | How long CloudFront keeps its connection to the origin open. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.readTimeout">readTimeout</a></code> | <code>aws-cdk-lib.Duration</code> | How long CloudFront waits for a response from the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.region">region</a></code> | <code>string</code> | For a `PER_REGION` endpoint: the region whose URL CloudFront calls. |

---

##### `connectionAttempts`<sup>Optional</sup> <a name="connectionAttempts" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.connectionAttempts"></a>

```typescript
public readonly connectionAttempts: number;
```

- *Type:* number
- *Default:* 3

The number of times that CloudFront attempts to connect to the origin;

valid values are 1, 2, or 3 attempts.

---

##### `connectionTimeout`<sup>Optional</sup> <a name="connectionTimeout" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.connectionTimeout"></a>

```typescript
public readonly connectionTimeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(10)

The number of seconds that CloudFront waits when trying to establish a connection to the origin.

Valid values are 1-10 seconds, inclusive.

---

##### `customHeaders`<sup>Optional</sup> <a name="customHeaders" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.customHeaders"></a>

```typescript
public readonly customHeaders: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* {}

A list of HTTP header names and values that CloudFront adds to requests it sends to the origin.

---

##### `originAccessControlId`<sup>Optional</sup> <a name="originAccessControlId" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.originAccessControlId"></a>

```typescript
public readonly originAccessControlId: string;
```

- *Type:* string
- *Default:* no origin access control

The unique identifier of an origin access control for this origin.

---

##### `originId`<sup>Optional</sup> <a name="originId" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.originId"></a>

```typescript
public readonly originId: string;
```

- *Type:* string
- *Default:* an originid will be generated for you

A unique identifier for the origin.

This value must be unique within the distribution.

---

##### `originShieldEnabled`<sup>Optional</sup> <a name="originShieldEnabled" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.originShieldEnabled"></a>

```typescript
public readonly originShieldEnabled: boolean;
```

- *Type:* boolean
- *Default:* true

Origin Shield is enabled by setting originShieldRegion to a valid region, after this to disable Origin Shield again you must set this flag to false.

---

##### `originShieldRegion`<sup>Optional</sup> <a name="originShieldRegion" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.originShieldRegion"></a>

```typescript
public readonly originShieldRegion: string;
```

- *Type:* string
- *Default:* origin shield not enabled

When you enable Origin Shield in the AWS Region that has the lowest latency to your origin, you can get better network performance.

> [https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html)

---

##### `responseCompletionTimeout`<sup>Optional</sup> <a name="responseCompletionTimeout" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.responseCompletionTimeout"></a>

```typescript
public readonly responseCompletionTimeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* undefined -  AWS CloudFront default is not enforcing a maximum value

The time that a request from CloudFront to the origin can stay open and wait for a response.

If the complete response isn't received from the origin by this time, CloudFront ends the connection.

Valid values are 1-3600 seconds, inclusive.

> [https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesOrigin.html#response-completion-timeout](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesOrigin.html#response-completion-timeout)

---

##### `originPath`<sup>Optional</sup> <a name="originPath" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.originPath"></a>

```typescript
public readonly originPath: string;
```

- *Type:* string
- *Default:* '/'

An optional path that CloudFront appends to the origin domain name when CloudFront requests content from the origin.

Must begin, but not end, with '/' (e.g., '/production/images').

---

##### `ipAddressType`<sup>Optional</sup> <a name="ipAddressType" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.ipAddressType"></a>

```typescript
public readonly ipAddressType: OriginIpAddressType;
```

- *Type:* aws-cdk-lib.aws_cloudfront.OriginIpAddressType
- *Default:* OriginIpAddressType.IPV4

Which IP protocol CloudFront uses to connect to the origin.

---

##### `keepaliveTimeout`<sup>Optional</sup> <a name="keepaliveTimeout" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.keepaliveTimeout"></a>

```typescript
public readonly keepaliveTimeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(5)

How long CloudFront keeps its connection to the origin open.

---

##### `readTimeout`<sup>Optional</sup> <a name="readTimeout" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.readTimeout"></a>

```typescript
public readonly readTimeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(30)

How long CloudFront waits for a response from the origin.

Above 120 seconds needs a CloudFront quota increase.

---

##### `region`<sup>Optional</sup> <a name="region" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps.property.region"></a>

```typescript
public readonly region: string;
```

- *Type:* string
- *Default:* the endpoint's home region

For a `PER_REGION` endpoint: the region whose URL CloudFront calls.

Only one region per origin; use an origin
group or one origin per behavior for more.

---

### WebFunctionOriginWithOacProps <a name="WebFunctionOriginWithOacProps" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps"></a>

Properties for a Web Function endpoint origin with origin access control.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.Initializer"></a>

```typescript
import { WebFunctionOriginWithOacProps } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionOriginWithOacProps: WebFunctionOriginWithOacProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.connectionAttempts">connectionAttempts</a></code> | <code>number</code> | The number of times that CloudFront attempts to connect to the origin; |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.connectionTimeout">connectionTimeout</a></code> | <code>aws-cdk-lib.Duration</code> | The number of seconds that CloudFront waits when trying to establish a connection to the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.customHeaders">customHeaders</a></code> | <code>{[ key: string ]: string}</code> | A list of HTTP header names and values that CloudFront adds to requests it sends to the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originAccessControlId">originAccessControlId</a></code> | <code>string</code> | The unique identifier of an origin access control for this origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originId">originId</a></code> | <code>string</code> | A unique identifier for the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originShieldEnabled">originShieldEnabled</a></code> | <code>boolean</code> | Origin Shield is enabled by setting originShieldRegion to a valid region, after this to disable Origin Shield again you must set this flag to false. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originShieldRegion">originShieldRegion</a></code> | <code>string</code> | When you enable Origin Shield in the AWS Region that has the lowest latency to your origin, you can get better network performance. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.responseCompletionTimeout">responseCompletionTimeout</a></code> | <code>aws-cdk-lib.Duration</code> | The time that a request from CloudFront to the origin can stay open and wait for a response. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originPath">originPath</a></code> | <code>string</code> | An optional path that CloudFront appends to the origin domain name when CloudFront requests content from the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.ipAddressType">ipAddressType</a></code> | <code>aws-cdk-lib.aws_cloudfront.OriginIpAddressType</code> | Which IP protocol CloudFront uses to connect to the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.keepaliveTimeout">keepaliveTimeout</a></code> | <code>aws-cdk-lib.Duration</code> | How long CloudFront keeps its connection to the origin open. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.readTimeout">readTimeout</a></code> | <code>aws-cdk-lib.Duration</code> | How long CloudFront waits for a response from the origin. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.region">region</a></code> | <code>string</code> | For a `PER_REGION` endpoint: the region whose URL CloudFront calls. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originAccessControl">originAccessControl</a></code> | <code>aws-cdk-lib.interfaces.aws_cloudfront.IOriginAccessControlRef</code> | The origin access control. |

---

##### `connectionAttempts`<sup>Optional</sup> <a name="connectionAttempts" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.connectionAttempts"></a>

```typescript
public readonly connectionAttempts: number;
```

- *Type:* number
- *Default:* 3

The number of times that CloudFront attempts to connect to the origin;

valid values are 1, 2, or 3 attempts.

---

##### `connectionTimeout`<sup>Optional</sup> <a name="connectionTimeout" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.connectionTimeout"></a>

```typescript
public readonly connectionTimeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(10)

The number of seconds that CloudFront waits when trying to establish a connection to the origin.

Valid values are 1-10 seconds, inclusive.

---

##### `customHeaders`<sup>Optional</sup> <a name="customHeaders" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.customHeaders"></a>

```typescript
public readonly customHeaders: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* {}

A list of HTTP header names and values that CloudFront adds to requests it sends to the origin.

---

##### `originAccessControlId`<sup>Optional</sup> <a name="originAccessControlId" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originAccessControlId"></a>

```typescript
public readonly originAccessControlId: string;
```

- *Type:* string
- *Default:* no origin access control

The unique identifier of an origin access control for this origin.

---

##### `originId`<sup>Optional</sup> <a name="originId" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originId"></a>

```typescript
public readonly originId: string;
```

- *Type:* string
- *Default:* an originid will be generated for you

A unique identifier for the origin.

This value must be unique within the distribution.

---

##### `originShieldEnabled`<sup>Optional</sup> <a name="originShieldEnabled" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originShieldEnabled"></a>

```typescript
public readonly originShieldEnabled: boolean;
```

- *Type:* boolean
- *Default:* true

Origin Shield is enabled by setting originShieldRegion to a valid region, after this to disable Origin Shield again you must set this flag to false.

---

##### `originShieldRegion`<sup>Optional</sup> <a name="originShieldRegion" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originShieldRegion"></a>

```typescript
public readonly originShieldRegion: string;
```

- *Type:* string
- *Default:* origin shield not enabled

When you enable Origin Shield in the AWS Region that has the lowest latency to your origin, you can get better network performance.

> [https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html)

---

##### `responseCompletionTimeout`<sup>Optional</sup> <a name="responseCompletionTimeout" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.responseCompletionTimeout"></a>

```typescript
public readonly responseCompletionTimeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* undefined -  AWS CloudFront default is not enforcing a maximum value

The time that a request from CloudFront to the origin can stay open and wait for a response.

If the complete response isn't received from the origin by this time, CloudFront ends the connection.

Valid values are 1-3600 seconds, inclusive.

> [https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesOrigin.html#response-completion-timeout](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesOrigin.html#response-completion-timeout)

---

##### `originPath`<sup>Optional</sup> <a name="originPath" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originPath"></a>

```typescript
public readonly originPath: string;
```

- *Type:* string
- *Default:* '/'

An optional path that CloudFront appends to the origin domain name when CloudFront requests content from the origin.

Must begin, but not end, with '/' (e.g., '/production/images').

---

##### `ipAddressType`<sup>Optional</sup> <a name="ipAddressType" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.ipAddressType"></a>

```typescript
public readonly ipAddressType: OriginIpAddressType;
```

- *Type:* aws-cdk-lib.aws_cloudfront.OriginIpAddressType
- *Default:* OriginIpAddressType.IPV4

Which IP protocol CloudFront uses to connect to the origin.

---

##### `keepaliveTimeout`<sup>Optional</sup> <a name="keepaliveTimeout" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.keepaliveTimeout"></a>

```typescript
public readonly keepaliveTimeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(5)

How long CloudFront keeps its connection to the origin open.

---

##### `readTimeout`<sup>Optional</sup> <a name="readTimeout" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.readTimeout"></a>

```typescript
public readonly readTimeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(30)

How long CloudFront waits for a response from the origin.

Above 120 seconds needs a CloudFront quota increase.

---

##### `region`<sup>Optional</sup> <a name="region" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.region"></a>

```typescript
public readonly region: string;
```

- *Type:* string
- *Default:* the endpoint's home region

For a `PER_REGION` endpoint: the region whose URL CloudFront calls.

Only one region per origin; use an origin
group or one origin per behavior for more.

---

##### `originAccessControl`<sup>Optional</sup> <a name="originAccessControl" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps.property.originAccessControl"></a>

```typescript
public readonly originAccessControl: IOriginAccessControlRef;
```

- *Type:* aws-cdk-lib.interfaces.aws_cloudfront.IOriginAccessControlRef
- *Default:* one is created per stack and signing protocol

The origin access control.

It must have origin type `lambda`, signing behavior `always-amz-auth`, and signing
protocol `sigv4` (a regional endpoint) or `sigv4a` (a `MULTI_REGION` endpoint's global domain). Checked at
synthesis when it's defined in this app (CDK's `FunctionUrlOriginAccessControl` signs with `always`, which
CloudFront rejects for Web Function origins).

---

### WebFunctionPermission <a name="WebFunctionPermission" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission"></a>

Permission for a principal outside this account, an AWS service or an organization to call a function's endpoints.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission.Initializer"></a>

```typescript
import { WebFunctionPermission } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionPermission: WebFunctionPermission = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission.property.principal">principal</a></code> | <code>aws-cdk-lib.aws_iam.IPrincipal</code> | Who may call: an account (`iam.AccountPrincipal`), a role or user (`iam.ArnPrincipal`), an AWS service (`iam.ServicePrincipal`, with `sourceArn` or `sourceAccount`) or an organization (`iam.OrganizationPrincipal`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a></code> | The endpoint the principal may call. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission.property.sourceAccount">sourceAccount</a></code> | <code>string</code> | For an AWS service: the account that owns the resource calling on its behalf (condition `aws:SourceAccount`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission.property.sourceArn">sourceArn</a></code> | <code>string</code> | For an AWS service: the ARN of the resource calling on its behalf (condition `aws:SourceArn`, `ArnLike`), e.g. a CloudFront distribution. Without it or `sourceAccount`, any account's use of the service could call the endpoint. |

---

##### `principal`<sup>Required</sup> <a name="principal" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission.property.principal"></a>

```typescript
public readonly principal: IPrincipal;
```

- *Type:* aws-cdk-lib.aws_iam.IPrincipal

Who may call: an account (`iam.AccountPrincipal`), a role or user (`iam.ArnPrincipal`), an AWS service (`iam.ServicePrincipal`, with `sourceArn` or `sourceAccount`) or an organization (`iam.OrganizationPrincipal`).

A principal in another account also needs `lambda:InvokeWebFunctionEndpoint` in its own IAM policy.

---

##### `endpoint`<sup>Optional</sup> <a name="endpoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission.property.endpoint"></a>

```typescript
public readonly endpoint: WebFunctionEndpoint;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a>
- *Default:* every endpoint of the function, including ones added later

The endpoint the principal may call.

It must belong to this function.

---

##### `sourceAccount`<sup>Optional</sup> <a name="sourceAccount" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission.property.sourceAccount"></a>

```typescript
public readonly sourceAccount: string;
```

- *Type:* string
- *Default:* no condition

For an AWS service: the account that owns the resource calling on its behalf (condition `aws:SourceAccount`).

---

##### `sourceArn`<sup>Optional</sup> <a name="sourceArn" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionPermission.property.sourceArn"></a>

```typescript
public readonly sourceArn: string;
```

- *Type:* string
- *Default:* no condition

For an AWS service: the ARN of the resource calling on its behalf (condition `aws:SourceArn`, `ArnLike`), e.g. a CloudFront distribution. Without it or `sourceAccount`, any account's use of the service could call the endpoint.

---

### WebFunctionProps <a name="WebFunctionProps" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps"></a>

Properties for a `WebFunction`.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.Initializer"></a>

```typescript
import { WebFunctionProps } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionProps: WebFunctionProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.authType">authType</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType">WebFunctionAuthType</a></code> | How callers of the endpoint are authenticated. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.applicationLogLevelV2">applicationLogLevelV2</a></code> | <code>aws-cdk-lib.aws_lambda.ApplicationLogLevel</code> | The minimum level of application logs to keep. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.description">description</a></code> | <code>string</code> | A description of the function's code and configuration. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions">WebFunctionEndpointOptions</a></code> | The default endpoint (`fn.endpoint`): where it serves from, its name and limits. It serves the current revision; route it elsewhere with `fn.endpoint.routeTraffic()`. Add more endpoints with `addEndpoint`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | Environment variables. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.logRemovalPolicy">logRemovalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | What happens to the log groups when the function is removed: RETAIN or DESTROY. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.logRetention">logRetention</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | Retention for every log group of the function, in every region it serves from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.maxConcurrencyPerEnvironment">maxConcurrencyPerEnvironment</a></code> | <code>number</code> | How many requests one execution environment handles at the same time (1-128). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.revisionRetention">revisionRetention</a></code> | <code>number</code> | How many of the newest revisions to keep (1-50). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.role">role</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The execution role. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.systemLogLevelV2">systemLogLevelV2</a></code> | <code>aws-cdk-lib.aws_lambda.SystemLogLevel</code> | The minimum level of platform logs to keep (DEBUG, INFO or WARN). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.timeout">timeout</a></code> | <code>aws-cdk-lib.Duration</code> | How long a single request may run. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.webFunctionName">webFunctionName</a></code> | <code>string</code> | The function's name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.code">code</a></code> | <code>aws-cdk-lib.aws_lambda.Code</code> | The code: a zip in S3 (`Code.fromAsset`, `Code.fromBucket`, `Code.fromCustomCommand`, `Code.fromDockerBuild`). Inline code and container images aren't supported. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.runtime">runtime</a></code> | <code>aws-cdk-lib.aws_lambda.Runtime</code> | The Node.js runtime, e.g. `lambda.Runtime.NODEJS_24_X`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.entrypoint">entrypoint</a></code> | <code>string</code> | The file that starts your server, relative to the root of the code. |

---

##### `authType`<sup>Required</sup> <a name="authType" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.authType"></a>

```typescript
public readonly authType: WebFunctionAuthType;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType">WebFunctionAuthType</a>

How callers of the endpoint are authenticated.

---

##### `applicationLogLevelV2`<sup>Optional</sup> <a name="applicationLogLevelV2" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.applicationLogLevelV2"></a>

```typescript
public readonly applicationLogLevelV2: ApplicationLogLevel;
```

- *Type:* aws-cdk-lib.aws_lambda.ApplicationLogLevel
- *Default:* lambda.ApplicationLogLevel.INFO

The minimum level of application logs to keep.

---

##### `description`<sup>Optional</sup> <a name="description" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* no description

A description of the function's code and configuration.

---

##### `endpoint`<sup>Optional</sup> <a name="endpoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.endpoint"></a>

```typescript
public readonly endpoint: WebFunctionEndpointOptions;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions">WebFunctionEndpointOptions</a>
- *Default:* a HOME_REGION endpoint serving the current revision

The default endpoint (`fn.endpoint`): where it serves from, its name and limits. It serves the current revision; route it elsewhere with `fn.endpoint.routeTraffic()`. Add more endpoints with `addEndpoint`.

---

##### `environment`<sup>Optional</sup> <a name="environment" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.environment"></a>

```typescript
public readonly environment: {[ key: string ]: string};
```

- *Type:* {[ key: string ]: string}
- *Default:* none

Environment variables.

Names starting with `AWS_` are reserved.

---

##### `logRemovalPolicy`<sup>Optional</sup> <a name="logRemovalPolicy" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.logRemovalPolicy"></a>

```typescript
public readonly logRemovalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RemovalPolicy.RETAIN

What happens to the log groups when the function is removed: RETAIN or DESTROY.

With DESTROY, deletion waits about a minute for environments to flush their last lines.

---

##### `logRetention`<sup>Optional</sup> <a name="logRetention" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.logRetention"></a>

```typescript
public readonly logRetention: RetentionDays;
```

- *Type:* aws-cdk-lib.aws_logs.RetentionDays
- *Default:* logs.RetentionDays.ONE_MONTH

Retention for every log group of the function, in every region it serves from.

---

##### `maxConcurrencyPerEnvironment`<sup>Optional</sup> <a name="maxConcurrencyPerEnvironment" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.maxConcurrencyPerEnvironment"></a>

```typescript
public readonly maxConcurrencyPerEnvironment: number;
```

- *Type:* number
- *Default:* 64

How many requests one execution environment handles at the same time (1-128).

Requests share module-level state, so handlers must be concurrency-safe.

---

##### `revisionRetention`<sup>Optional</sup> <a name="revisionRetention" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.revisionRetention"></a>

```typescript
public readonly revisionRetention: number;
```

- *Type:* number
- *Default:* 20

How many of the newest revisions to keep (1-50).

Each deployment that changes the code or
configuration creates a revision; older ones stay available to roll back to or route traffic to,
and the oldest beyond this count are deleted after each deployment.

Revisions that an endpoint routes to are never deleted, and neither are those the previous
deployment used (a rollback returns to them).

---

##### `role`<sup>Optional</sup> <a name="role" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.role"></a>

```typescript
public readonly role: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole
- *Default:* a role trusting `lambda.amazonaws.com` with `AWSLambdaBasicExecutionRole`

The execution role.

An `iam.IRole` (not `IRoleRef`) because the function adds statements to it and grants through it.
[disable-awslint:prefer-ref-interface]

---

##### `systemLogLevelV2`<sup>Optional</sup> <a name="systemLogLevelV2" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.systemLogLevelV2"></a>

```typescript
public readonly systemLogLevelV2: SystemLogLevel;
```

- *Type:* aws-cdk-lib.aws_lambda.SystemLogLevel
- *Default:* lambda.SystemLogLevel.INFO

The minimum level of platform logs to keep (DEBUG, INFO or WARN).

---

##### `timeout`<sup>Optional</sup> <a name="timeout" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.timeout"></a>

```typescript
public readonly timeout: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.seconds(30)

How long a single request may run.

---

##### `webFunctionName`<sup>Optional</sup> <a name="webFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.webFunctionName"></a>

```typescript
public readonly webFunctionName: string;
```

- *Type:* string
- *Default:* a unique name generated from the construct path (moving the construct changes it)

The function's name.

Renaming a function replaces it, and its endpoint gets a new URL.

---

##### `code`<sup>Required</sup> <a name="code" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.code"></a>

```typescript
public readonly code: Code;
```

- *Type:* aws-cdk-lib.aws_lambda.Code

The code: a zip in S3 (`Code.fromAsset`, `Code.fromBucket`, `Code.fromCustomCommand`, `Code.fromDockerBuild`). Inline code and container images aren't supported.

The code is copied into the stack's code bucket, which Lambda Web Functions can read.

---

##### `runtime`<sup>Required</sup> <a name="runtime" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.runtime"></a>

```typescript
public readonly runtime: Runtime;
```

- *Type:* aws-cdk-lib.aws_lambda.Runtime

The Node.js runtime, e.g. `lambda.Runtime.NODEJS_24_X`.

---

##### `entrypoint`<sup>Optional</sup> <a name="entrypoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.entrypoint"></a>

```typescript
public readonly entrypoint: string;
```

- *Type:* string
- *Default:* 'index.js'

The file that starts your server, relative to the root of the code.

---

### WebFunctionRevisionAttributes <a name="WebFunctionRevisionAttributes" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionAttributes"></a>

Attributes of an existing revision.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionAttributes.Initializer"></a>

```typescript
import { WebFunctionRevisionAttributes } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionRevisionAttributes: WebFunctionRevisionAttributes = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionAttributes.property.revisionId">revisionId</a></code> | <code>string</code> | The revision's ID, e.g. `rev-a1b2c` (the `revisionId` of an earlier deployment). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionAttributes.property.webFunction">webFunction</a></code> | <code>aws-cdk-lib.interfaces.aws_lambda.IWebFunctionRef</code> | The function the revision belongs to. |

---

##### `revisionId`<sup>Required</sup> <a name="revisionId" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionAttributes.property.revisionId"></a>

```typescript
public readonly revisionId: string;
```

- *Type:* string

The revision's ID, e.g. `rev-a1b2c` (the `revisionId` of an earlier deployment).

---

##### `webFunction`<sup>Required</sup> <a name="webFunction" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionAttributes.property.webFunction"></a>

```typescript
public readonly webFunction: IWebFunctionRef;
```

- *Type:* aws-cdk-lib.interfaces.aws_lambda.IWebFunctionRef

The function the revision belongs to.

---

### WebFunctionRevisionWeight <a name="WebFunctionRevisionWeight" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionWeight"></a>

A revision and the share of an endpoint's traffic it receives.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionWeight.Initializer"></a>

```typescript
import { WebFunctionRevisionWeight } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionRevisionWeight: WebFunctionRevisionWeight = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionWeight.property.revision">revision</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a></code> | The revision. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionWeight.property.weight">weight</a></code> | <code>number</code> | The revision's share of the endpoint's traffic, as a fraction (like `lambda.Alias` `additionalVersions`). Must be a whole percentage from 0.01 to 0.99. |

---

##### `revision`<sup>Required</sup> <a name="revision" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionWeight.property.revision"></a>

```typescript
public readonly revision: IWebFunctionRevision;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a>

The revision.

---

##### `weight`<sup>Required</sup> <a name="weight" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevisionWeight.property.weight"></a>

```typescript
public readonly weight: number;
```

- *Type:* number

The revision's share of the endpoint's traffic, as a fraction (like `lambda.Alias` `additionalVersions`). Must be a whole percentage from 0.01 to 0.99.

---

### WebFunctionRollbackOptions <a name="WebFunctionRollbackOptions" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions"></a>

Alarms an endpoint creates on its own metrics to stop a canary or linear deployment.

The endpoint creates one alarm per threshold in every region it serves from (metrics are published
in the region that served the request, and an alarm can only watch metrics in its own region).
Lambda Web Function metrics have no revision dimension, so the alarms watch the whole endpoint: while
the new revision gets 10% of the traffic, its errors are about a tenth of the endpoint's.

#### Initializer <a name="Initializer" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.Initializer"></a>

```typescript
import { WebFunctionRollbackOptions } from '@ashishpandeyone/cdk-lambda-web-function'

const webFunctionRollbackOptions: WebFunctionRollbackOptions = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.property.clientErrorRate">clientErrorRate</a></code> | <code>number</code> | Roll back when more than this percent of the endpoint's requests get a 4XX response (0-100). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.property.evaluationPeriods">evaluationPeriods</a></code> | <code>number</code> | How many consecutive periods must breach a threshold before the deployment rolls back. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.property.minimumRequests">minimumRequests</a></code> | <code>number</code> | Periods with fewer requests than this don't count, so one failed request out of two doesn't roll back. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.property.period">period</a></code> | <code>aws-cdk-lib.Duration</code> | The period each rate is measured over (at least 1 minute, in whole minutes). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.property.serverErrorRate">serverErrorRate</a></code> | <code>number</code> | Roll back when more than this percent of the endpoint's requests get a 5XX response (0-100). |

---

##### `clientErrorRate`<sup>Optional</sup> <a name="clientErrorRate" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.property.clientErrorRate"></a>

```typescript
public readonly clientErrorRate: number;
```

- *Type:* number
- *Default:* no client error alarm

Roll back when more than this percent of the endpoint's requests get a 4XX response (0-100).

Requests over `rateLimit` or `maxEnvironments` get 429, which counts here.

---

##### `evaluationPeriods`<sup>Optional</sup> <a name="evaluationPeriods" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.property.evaluationPeriods"></a>

```typescript
public readonly evaluationPeriods: number;
```

- *Type:* number
- *Default:* 2

How many consecutive periods must breach a threshold before the deployment rolls back.

---

##### `minimumRequests`<sup>Optional</sup> <a name="minimumRequests" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.property.minimumRequests"></a>

```typescript
public readonly minimumRequests: number;
```

- *Type:* number
- *Default:* 10

Periods with fewer requests than this don't count, so one failed request out of two doesn't roll back.

---

##### `period`<sup>Optional</sup> <a name="period" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.property.period"></a>

```typescript
public readonly period: Duration;
```

- *Type:* aws-cdk-lib.Duration
- *Default:* Duration.minutes(1)

The period each rate is measured over (at least 1 minute, in whole minutes).

---

##### `serverErrorRate`<sup>Optional</sup> <a name="serverErrorRate" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionRollbackOptions.property.serverErrorRate"></a>

```typescript
public readonly serverErrorRate: number;
```

- *Type:* number
- *Default:* no server error alarm

Roll back when more than this percent of the endpoint's requests get a 5XX response (0-100).

5XX includes the platform's 503s while an endpoint scales up for a sudden burst, not only your application's errors.

---

## Classes <a name="Classes" id="Classes"></a>

### WebFunctionDeployment <a name="WebFunctionDeployment" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment"></a>

How an endpoint moves its traffic to a new revision.


#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment.allAtOnce">allAtOnce</a></code> | All traffic moves to the new revision at once, as soon as it's ready (the default). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment.canary">canary</a></code> | The new revision first gets `percent` of the traffic for `bake`, then all of it. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment.linear">linear</a></code> | The new revision gets `percent` more of the traffic every `interval` until it has all of it. |

---

##### `allAtOnce` <a name="allAtOnce" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment.allAtOnce"></a>

```typescript
import { WebFunctionDeployment } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunctionDeployment.allAtOnce()
```

All traffic moves to the new revision at once, as soon as it's ready (the default).

##### `canary` <a name="canary" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment.canary"></a>

```typescript
import { WebFunctionDeployment } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunctionDeployment.canary(options: WebFunctionCanaryDeploymentOptions)
```

The new revision first gets `percent` of the traffic for `bake`, then all of it.

###### `options`<sup>Required</sup> <a name="options" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment.canary.parameter.options"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionCanaryDeploymentOptions">WebFunctionCanaryDeploymentOptions</a>

---

##### `linear` <a name="linear" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment.linear"></a>

```typescript
import { WebFunctionDeployment } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunctionDeployment.linear(options: WebFunctionLinearDeploymentOptions)
```

The new revision gets `percent` more of the traffic every `interval` until it has all of it.

###### `options`<sup>Required</sup> <a name="options" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionDeployment.linear.parameter.options"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionLinearDeploymentOptions">WebFunctionLinearDeploymentOptions</a>

---



### WebFunctionGrants <a name="WebFunctionGrants" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants"></a>

Grants on a Web Function endpoint.

Access them as `fn.grants` (the default endpoint) or `endpoint.grants`.

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants.invoke">invoke</a></code> | Allows `grantee` to call the endpoint (`lambda:InvokeWebFunctionEndpoint`). |

---

##### `invoke` <a name="invoke" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants.invoke"></a>

```typescript
public invoke(grantee: IGrantable): Grant
```

Allows `grantee` to call the endpoint (`lambda:InvokeWebFunctionEndpoint`).

The grant is on the endpoint's home-region ARN, which IAM evaluates for every region the
endpoint serves from, including a MULTI_REGION global URL.

A grantee in the function's account gets an IAM policy statement. Another account or an AWS service also gets
a statement in the function's resource policy (not for an imported function's endpoints).

###### `grantee`<sup>Required</sup> <a name="grantee" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants.invoke.parameter.grantee"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---




### WebFunctionOrigin <a name="WebFunctionOrigin" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin"></a>

A CloudFront origin for a Web Function endpoint.

Use `WebFunctionOrigin.withOriginAccessControl(endpoint)` for an `AWS_IAM` endpoint: CloudFront signs every request,
and only your distribution may call the endpoint. `new WebFunctionOrigin(endpoint)` is for a public (`NONE`) endpoint.

#### Initializers <a name="Initializers" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.Initializer"></a>

```typescript
import { WebFunctionOrigin } from '@ashishpandeyone/cdk-lambda-web-function'

new WebFunctionOrigin(endpoint: WebFunctionEndpoint, props?: WebFunctionOriginProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.Initializer.parameter.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a></code> | *No description.* |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.Initializer.parameter.props">props</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps">WebFunctionOriginProps</a></code> | *No description.* |

---

##### `endpoint`<sup>Required</sup> <a name="endpoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.Initializer.parameter.endpoint"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a>

---

##### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.Initializer.parameter.props"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginProps">WebFunctionOriginProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.bind">bind</a></code> | Binds the origin to the associated Distribution. |

---

##### `bind` <a name="bind" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.bind"></a>

```typescript
public bind(scope: Construct, options: OriginBindOptions): OriginBindConfig
```

Binds the origin to the associated Distribution.

Can be used to grant permissions, create dependent resources, etc.

###### `scope`<sup>Required</sup> <a name="scope" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.bind.parameter.scope"></a>

- *Type:* constructs.Construct

---

###### `options`<sup>Required</sup> <a name="options" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.bind.parameter.options"></a>

- *Type:* aws-cdk-lib.aws_cloudfront.OriginBindOptions

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.withOriginAccessControl">withOriginAccessControl</a></code> | An origin for an `AWS_IAM` endpoint, with origin access control: CloudFront signs every request to the endpoint (`always-amz-auth`, which keeps the viewer's `Authorization` header for your application), and the function's resource policy allows `cloudfront.amazonaws.com` to call this endpoint on behalf of this distribution only. |

---

##### `withOriginAccessControl` <a name="withOriginAccessControl" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.withOriginAccessControl"></a>

```typescript
import { WebFunctionOrigin } from '@ashishpandeyone/cdk-lambda-web-function'

WebFunctionOrigin.withOriginAccessControl(endpoint: WebFunctionEndpoint, props?: WebFunctionOriginWithOacProps)
```

An origin for an `AWS_IAM` endpoint, with origin access control: CloudFront signs every request to the endpoint (`always-amz-auth`, which keeps the viewer's `Authorization` header for your application), and the function's resource policy allows `cloudfront.amazonaws.com` to call this endpoint on behalf of this distribution only.

The distribution must be in the function's stack.

###### `endpoint`<sup>Required</sup> <a name="endpoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.withOriginAccessControl.parameter.endpoint"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a>

---

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionOrigin.withOriginAccessControl.parameter.props"></a>

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOriginWithOacProps">WebFunctionOriginWithOacProps</a>

---



## Protocols <a name="Protocols" id="Protocols"></a>

### IWebFunction <a name="IWebFunction" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction"></a>

- *Extends:* aws-cdk-lib.IResource, aws-cdk-lib.interfaces.aws_lambda.IWebFunctionRef, aws-cdk-lib.aws_iam.IResourceWithPolicy

- *Implemented By:* <a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction">NodejsWebFunction</a>, <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction">WebFunction</a>, <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionBase">WebFunctionBase</a>, <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction">IWebFunction</a>

A Lambda Web Function, created in this app (`WebFunction`) or imported (`WebFunction.fromWebFunctionArn`).

`addToResourcePolicy` adds to the function's resource policy (who else may call or manage it). A `WebFunction` has
one, created by its stack on the first statement. An imported function's policy belongs to the stack that created
it, so the statement isn't added (`statementAdded: false`).

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.grantInvoke">grantInvoke</a></code> | Allows `grantee` to call the function's endpoint (`lambda:InvokeWebFunctionEndpoint`): the default endpoint of a `WebFunction`; |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metric">metric</a></code> | A metric of the function's execution environments in `AWS/Lambda/Web` (dimension `FunctionName`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricActiveTime">metricActiveTime</a></code> | Time the execution environments were active (`EnvironmentActiveTime`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricConcurrentRequests">metricConcurrentRequests</a></code> | Requests an execution environment handled at once (`EnvironmentConcurrentRequests`, maximum). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricCpuTime">metricCpuTime</a></code> | CPU time the execution environments used (`EnvironmentCPUTime`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricMaxMemoryUsage">metricMaxMemoryUsage</a></code> | Peak memory an execution environment used (`EnvironmentMaxMemoryUsage`, maximum). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricResponseBytes">metricResponseBytes</a></code> | Bytes sent in responses (`ResponseBytes`). |

---

##### `grantInvoke` <a name="grantInvoke" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.grantInvoke"></a>

```typescript
public grantInvoke(grantee: IGrantable): Grant
```

Allows `grantee` to call the function's endpoint (`lambda:InvokeWebFunctionEndpoint`): the default endpoint of a `WebFunction`;

for an imported function, the endpoint named in its attributes, or every endpoint.

For a `WebFunction`, a grantee in this account gets an IAM policy statement; another account or an AWS service
also gets a statement in the function's resource policy. For an imported function, only the grantee's IAM policy
changes: across accounts, the function's own resource policy must also allow the grantee.
[disable-awslint:no-grants]

###### `grantee`<sup>Required</sup> <a name="grantee" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.grantInvoke.parameter.grantee"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

##### `metric` <a name="metric" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metric"></a>

```typescript
public metric(metricName: string, props?: MetricOptions): Metric
```

A metric of the function's execution environments in `AWS/Lambda/Web` (dimension `FunctionName`).

###### `metricName`<sup>Required</sup> <a name="metricName" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metric.parameter.metricName"></a>

- *Type:* string

---

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metric.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricActiveTime` <a name="metricActiveTime" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricActiveTime"></a>

```typescript
public metricActiveTime(props?: MetricOptions): Metric
```

Time the execution environments were active (`EnvironmentActiveTime`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricActiveTime.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricConcurrentRequests` <a name="metricConcurrentRequests" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricConcurrentRequests"></a>

```typescript
public metricConcurrentRequests(props?: MetricOptions): Metric
```

Requests an execution environment handled at once (`EnvironmentConcurrentRequests`, maximum).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricConcurrentRequests.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricCpuTime` <a name="metricCpuTime" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricCpuTime"></a>

```typescript
public metricCpuTime(props?: MetricOptions): Metric
```

CPU time the execution environments used (`EnvironmentCPUTime`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricCpuTime.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricMaxMemoryUsage` <a name="metricMaxMemoryUsage" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricMaxMemoryUsage"></a>

```typescript
public metricMaxMemoryUsage(props?: MetricOptions): Metric
```

Peak memory an execution environment used (`EnvironmentMaxMemoryUsage`, maximum).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricMaxMemoryUsage.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

##### `metricResponseBytes` <a name="metricResponseBytes" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricResponseBytes"></a>

```typescript
public metricResponseBytes(props?: MetricOptions): Metric
```

Bytes sent in responses (`ResponseBytes`).

###### `props`<sup>Optional</sup> <a name="props" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.metricResponseBytes.parameter.props"></a>

- *Type:* aws-cdk-lib.aws_cloudwatch.MetricOptions

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.env">env</a></code> | <code>aws-cdk-lib.interfaces.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.webFunctionRef">webFunctionRef</a></code> | <code>aws-cdk-lib.interfaces.aws_lambda.WebFunctionReference</code> | A reference to a WebFunction resource. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.webFunctionArn">webFunctionArn</a></code> | <code>string</code> | The function's ARN. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.webFunctionName">webFunctionName</a></code> | <code>string</code> | The function's name. |

---

##### `node`<sup>Required</sup> <a name="node" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.env"></a>

```typescript
public readonly env: ResourceEnvironment;
```

- *Type:* aws-cdk-lib.interfaces.ResourceEnvironment

The environment this resource belongs to.

For resources that are created and managed in a Stack (those created by
creating new class instances like `new Role()`, `new Bucket()`, etc.), this
is always the same as the environment of the stack they belong to.

For referenced resources (those obtained from referencing methods like
`Role.fromRoleArn()`, `Bucket.fromBucketName()`, etc.), they might be
different than the stack they were imported into.

---

##### `stack`<sup>Required</sup> <a name="stack" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `webFunctionRef`<sup>Required</sup> <a name="webFunctionRef" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.webFunctionRef"></a>

```typescript
public readonly webFunctionRef: WebFunctionReference;
```

- *Type:* aws-cdk-lib.interfaces.aws_lambda.WebFunctionReference

A reference to a WebFunction resource.

---

##### `webFunctionArn`<sup>Required</sup> <a name="webFunctionArn" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.webFunctionArn"></a>

```typescript
public readonly webFunctionArn: string;
```

- *Type:* string

The function's ARN.

---

##### `webFunctionName`<sup>Required</sup> <a name="webFunctionName" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction.property.webFunctionName"></a>

```typescript
public readonly webFunctionName: string;
```

- *Type:* string

The function's name.

---

### IWebFunctionRevision <a name="IWebFunctionRevision" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision"></a>

- *Extends:* constructs.IConstruct

- *Implemented By:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision">WebFunctionRevision</a>, <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision">IWebFunctionRevision</a>

A revision of a Web Function: an immutable snapshot of its code and configuration.


#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision.property.revisionArn">revisionArn</a></code> | <code>string</code> | The revision's ARN. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision.property.revisionId">revisionId</a></code> | <code>string</code> | The revision's ID, e.g. `rev-a1b2c`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision.property.webFunction">webFunction</a></code> | <code>aws-cdk-lib.interfaces.aws_lambda.IWebFunctionRef</code> | The function the revision belongs to. |

---

##### `node`<sup>Required</sup> <a name="node" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `revisionArn`<sup>Required</sup> <a name="revisionArn" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision.property.revisionArn"></a>

```typescript
public readonly revisionArn: string;
```

- *Type:* string

The revision's ARN.

---

##### `revisionId`<sup>Required</sup> <a name="revisionId" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision.property.revisionId"></a>

```typescript
public readonly revisionId: string;
```

- *Type:* string

The revision's ID, e.g. `rev-a1b2c`.

---

##### `webFunction`<sup>Required</sup> <a name="webFunction" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunctionRevision.property.webFunction"></a>

```typescript
public readonly webFunction: IWebFunctionRef;
```

- *Type:* aws-cdk-lib.interfaces.aws_lambda.IWebFunctionRef

The function the revision belongs to.

---

## Enums <a name="Enums" id="Enums"></a>

### WebFunctionAuthType <a name="WebFunctionAuthType" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType"></a>

How callers of a Web Function endpoint are authenticated.

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType.AWS_IAM">AWS_IAM</a></code> | Requests must be signed with SigV4 or SigV4a (signing name `lambda`) by a principal allowed `lambda:InvokeWebFunctionEndpoint` on the endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType.NONE">NONE</a></code> | No authentication by Lambda: the endpoint is public and your application authenticates requests itself. |

---

##### `AWS_IAM` <a name="AWS_IAM" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType.AWS_IAM"></a>

Requests must be signed with SigV4 or SigV4a (signing name `lambda`) by a principal allowed `lambda:InvokeWebFunctionEndpoint` on the endpoint.

---


##### `NONE` <a name="NONE" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionAuthType.NONE"></a>

No authentication by Lambda: the endpoint is public and your application authenticates requests itself.

The `Authorization` header reaches your application untouched.

---


### WebFunctionEndpointType <a name="WebFunctionEndpointType" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType"></a>

Where a Web Function endpoint serves traffic from.

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType.HOME_REGION">HOME_REGION</a></code> | One URL, served from the stack's region (the home region). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType.MULTI_REGION">MULTI_REGION</a></code> | One global URL, served from the nearest of the home region and `regions`. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType.PER_REGION">PER_REGION</a></code> | One URL per region (the home region and each of `regions`). |

---

##### `HOME_REGION` <a name="HOME_REGION" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType.HOME_REGION"></a>

One URL, served from the stack's region (the home region).

---


##### `MULTI_REGION` <a name="MULTI_REGION" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType.MULTI_REGION"></a>

One global URL, served from the nearest of the home region and `regions`.

---


##### `PER_REGION` <a name="PER_REGION" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType.PER_REGION"></a>

One URL per region (the home region and each of `regions`).

---

