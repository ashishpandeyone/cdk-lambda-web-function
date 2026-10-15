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
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addEnvironment">addEnvironment</a></code> | Adds an environment variable. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addToRolePolicy">addToRolePolicy</a></code> | Adds a statement to the execution role's policy. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.grantInvoke">grantInvoke</a></code> | Allows `grantee` to call the endpoint. |

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

##### `addToRolePolicy` <a name="addToRolePolicy" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addToRolePolicy"></a>

```typescript
public addToRolePolicy(statement: PolicyStatement): void
```

Adds a statement to the execution role's policy.

###### `statement`<sup>Required</sup> <a name="statement" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.addToRolePolicy.parameter.statement"></a>

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

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.isResource">isResource</a></code> | Check whether the given construct is a Resource. |

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

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.env">env</a></code> | <code>aws-cdk-lib.interfaces.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a></code> | The function's endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.grantPrincipal">grantPrincipal</a></code> | <code>aws-cdk-lib.aws_iam.IPrincipal</code> | The principal to grant permissions to (the execution role). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.grants">grants</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants">WebFunctionGrants</a></code> | Grants on the function (e.g. `grants.invoke(principal)`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.logGroup">logGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The home-region log group that receives the logs of every region the function serves from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.revisionId">revisionId</a></code> | <code>string</code> | The ID of the current revision. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.role">role</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The execution role. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.webFunctionArn">webFunctionArn</a></code> | <code>string</code> | The function's ARN. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.webFunctionName">webFunctionName</a></code> | <code>string</code> | The function's name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.webFunctionRef">webFunctionRef</a></code> | <code>aws-cdk-lib.interfaces.aws_lambda.WebFunctionReference</code> | A reference to this function, for APIs that accept `lambda.IWebFunctionRef`. |

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

##### `endpoint`<sup>Required</sup> <a name="endpoint" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.endpoint"></a>

```typescript
public readonly endpoint: WebFunctionEndpoint;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a>

The function's endpoint.

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

Grants on the function (e.g. `grants.invoke(principal)`).

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

---

##### `role`<sup>Required</sup> <a name="role" id="@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction.property.role"></a>

```typescript
public readonly role: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The execution role.

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


### WebFunction <a name="WebFunction" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction"></a>

- *Implements:* <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction">IWebFunction</a>, aws-cdk-lib.aws_iam.IGrantable

A Node.js HTTP server running as an AWS Lambda Web Function, served from one or more regions.

Creates the function, its current revision (code and configuration; any change replaces it),
an HTTPS endpoint, an execution role, and owns the function's log groups in every region.

Importing existing functions (`fromXxx` methods) is planned after 0.1.

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
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.addEnvironment">addEnvironment</a></code> | Adds an environment variable. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.addToRolePolicy">addToRolePolicy</a></code> | Adds a statement to the execution role's policy. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.grantInvoke">grantInvoke</a></code> | Allows `grantee` to call the endpoint. |

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

##### `addToRolePolicy` <a name="addToRolePolicy" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addToRolePolicy"></a>

```typescript
public addToRolePolicy(statement: PolicyStatement): void
```

Adds a statement to the execution role's policy.

###### `statement`<sup>Required</sup> <a name="statement" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.addToRolePolicy.parameter.statement"></a>

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

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.isOwnedResource">isOwnedResource</a></code> | Returns true if the construct was created by CDK, and false otherwise. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.isResource">isResource</a></code> | Check whether the given construct is a Resource. |

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

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.env">env</a></code> | <code>aws-cdk-lib.interfaces.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a></code> | The function's endpoint. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.grantPrincipal">grantPrincipal</a></code> | <code>aws-cdk-lib.aws_iam.IPrincipal</code> | The principal to grant permissions to (the execution role). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.grants">grants</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants">WebFunctionGrants</a></code> | Grants on the function (e.g. `grants.invoke(principal)`). |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.logGroup">logGroup</a></code> | <code>aws-cdk-lib.aws_logs.ILogGroup</code> | The home-region log group that receives the logs of every region the function serves from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.revisionId">revisionId</a></code> | <code>string</code> | The ID of the current revision. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.role">role</a></code> | <code>aws-cdk-lib.aws_iam.IRole</code> | The execution role. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.webFunctionArn">webFunctionArn</a></code> | <code>string</code> | The function's ARN. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.webFunctionName">webFunctionName</a></code> | <code>string</code> | The function's name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.webFunctionRef">webFunctionRef</a></code> | <code>aws-cdk-lib.interfaces.aws_lambda.WebFunctionReference</code> | A reference to this function, for APIs that accept `lambda.IWebFunctionRef`. |

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

##### `endpoint`<sup>Required</sup> <a name="endpoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.endpoint"></a>

```typescript
public readonly endpoint: WebFunctionEndpoint;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint">WebFunctionEndpoint</a>

The function's endpoint.

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

Grants on the function (e.g. `grants.invoke(principal)`).

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

---

##### `role`<sup>Required</sup> <a name="role" id="@ashishpandeyone/cdk-lambda-web-function.WebFunction.property.role"></a>

```typescript
public readonly role: IRole;
```

- *Type:* aws-cdk-lib.aws_iam.IRole

The execution role.

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


### WebFunctionEndpoint <a name="WebFunctionEndpoint" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint"></a>

The HTTPS endpoint of a Web Function. Created by `WebFunction`; access it as `fn.endpoint`.

Only `WebFunction` creates endpoints in this version (one per function), so the constructor is private.

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.with">with</a></code> | Applies one or more mixins to this construct. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.regionalUrl">regionalUrl</a></code> | The URL of this endpoint in one region. |

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
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.domainName">domainName</a></code> | <code>string</code> | The endpoint's domain name: the global domain for `MULTI_REGION`, otherwise the home region's. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.endpointArn">endpointArn</a></code> | <code>string</code> | The endpoint's ARN. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.endpointName">endpointName</a></code> | <code>string</code> | The endpoint's name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.endpointType">endpointType</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType">WebFunctionEndpointType</a></code> | Where the endpoint serves traffic from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.regions">regions</a></code> | <code>string[]</code> | Every region the endpoint serves from: the home region first, then the others in alphabetical order. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.url">url</a></code> | <code>string</code> | The endpoint's URL: the global URL for `MULTI_REGION`, otherwise the home region's. |

---

##### `node`<sup>Required</sup> <a name="node" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

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

##### `regions`<sup>Required</sup> <a name="regions" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.regions"></a>

```typescript
public readonly regions: string[];
```

- *Type:* string[]

Every region the endpoint serves from: the home region first, then the others in alphabetical order.

---

##### `url`<sup>Required</sup> <a name="url" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint.property.url"></a>

```typescript
public readonly url: string;
```

- *Type:* string

The endpoint's URL: the global URL for `MULTI_REGION`, otherwise the home region's.

---


## Structs <a name="Structs" id="Structs"></a>

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
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions">WebFunctionEndpointOptions</a></code> | The endpoint: where it serves from, and its name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | Environment variables. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.logRemovalPolicy">logRemovalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | What happens to the log groups when the function is removed: RETAIN or DESTROY. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.logRetention">logRetention</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | Retention for every log group of the function, in every region it serves from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunctionProps.property.maxConcurrencyPerEnvironment">maxConcurrencyPerEnvironment</a></code> | <code>number</code> | How many requests one execution environment handles at the same time (1-128). |
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
- *Default:* a HOME_REGION endpoint

The endpoint: where it serves from, and its name.

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
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.endpointName">endpointName</a></code> | <code>string</code> | The endpoint's name, shown in logs (`endpointName`) and in the `lambda-web-endpoint-name` header. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.endpointType">endpointType</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType">WebFunctionEndpointType</a></code> | Where the endpoint serves traffic from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.regions">regions</a></code> | <code>string[]</code> | Regions to serve from in addition to the home region (the stack's region). |

---

##### `endpointName`<sup>Optional</sup> <a name="endpointName" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.endpointName"></a>

```typescript
public readonly endpointName: string;
```

- *Type:* string
- *Default:* `default-<hash of type and regions>`

The endpoint's name, shown in logs (`endpointName`) and in the `lambda-web-endpoint-name` header.

When omitted, the name is `default-<hash>`, with the hash covering the endpoint type and regions,
so changing either deploys a new endpoint cleanly. When set, changing the endpoint type or
regions also requires a new name: two endpoints of one function can't share a name, and
CloudFormation creates the replacement before deleting the old one.

---

##### `endpointType`<sup>Optional</sup> <a name="endpointType" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions.property.endpointType"></a>

```typescript
public readonly endpointType: WebFunctionEndpointType;
```

- *Type:* <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointType">WebFunctionEndpointType</a>
- *Default:* WebFunctionEndpointType.HOME_REGION

Where the endpoint serves traffic from.

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
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions">WebFunctionEndpointOptions</a></code> | The endpoint: where it serves from, and its name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | Environment variables. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.logRemovalPolicy">logRemovalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | What happens to the log groups when the function is removed: RETAIN or DESTROY. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.logRetention">logRetention</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | Retention for every log group of the function, in every region it serves from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionOptions.property.maxConcurrencyPerEnvironment">maxConcurrencyPerEnvironment</a></code> | <code>number</code> | How many requests one execution environment handles at the same time (1-128). |
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
- *Default:* a HOME_REGION endpoint

The endpoint: where it serves from, and its name.

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
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.endpoint">endpoint</a></code> | <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpointOptions">WebFunctionEndpointOptions</a></code> | The endpoint: where it serves from, and its name. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.environment">environment</a></code> | <code>{[ key: string ]: string}</code> | Environment variables. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.logRemovalPolicy">logRemovalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | What happens to the log groups when the function is removed: RETAIN or DESTROY. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.logRetention">logRetention</a></code> | <code>aws-cdk-lib.aws_logs.RetentionDays</code> | Retention for every log group of the function, in every region it serves from. |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionProps.property.maxConcurrencyPerEnvironment">maxConcurrencyPerEnvironment</a></code> | <code>number</code> | How many requests one execution environment handles at the same time (1-128). |
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
- *Default:* a HOME_REGION endpoint

The endpoint: where it serves from, and its name.

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

## Classes <a name="Classes" id="Classes"></a>

### WebFunctionGrants <a name="WebFunctionGrants" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants"></a>

Grants on a Web Function.

Access it as `fn.grants`.

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants.invoke">invoke</a></code> | Allows `grantee` to call the function's endpoint (`lambda:InvokeWebFunctionEndpoint`). |

---

##### `invoke` <a name="invoke" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants.invoke"></a>

```typescript
public invoke(grantee: IGrantable): Grant
```

Allows `grantee` to call the function's endpoint (`lambda:InvokeWebFunctionEndpoint`).

The grant is on the endpoint's home-region ARN, which IAM evaluates for every region the
endpoint serves from, including a MULTI_REGION global URL.

###### `grantee`<sup>Required</sup> <a name="grantee" id="@ashishpandeyone/cdk-lambda-web-function.WebFunctionGrants.invoke.parameter.grantee"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---




## Protocols <a name="Protocols" id="Protocols"></a>

### IWebFunction <a name="IWebFunction" id="@ashishpandeyone/cdk-lambda-web-function.IWebFunction"></a>

- *Extends:* aws-cdk-lib.IResource, aws-cdk-lib.interfaces.aws_lambda.IWebFunctionRef

- *Implemented By:* <a href="#@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction">NodejsWebFunction</a>, <a href="#@ashishpandeyone/cdk-lambda-web-function.WebFunction">WebFunction</a>, <a href="#@ashishpandeyone/cdk-lambda-web-function.IWebFunction">IWebFunction</a>

A Lambda Web Function.


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

