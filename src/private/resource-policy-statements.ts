import { Annotations, ArnFormat, CustomResource, Names, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { grantToProvider, webFunctionProvider } from './provider';
import { RESOURCE_POLICY_STATEMENTS_RESOURCE_TYPE } from './provider-protocol';
import { inspectResourcePolicy } from './resource-policy';

/**
 * The statements one stack adds to a Web Function's resource policy. A function has a single policy and Web Functions
 * have no AddPermission, so each writing stack owns its statements (by Sid) and a custom resource merges them into the
 * policy, keeping every other stack's statements: the function's stack, a distribution's stack, an importing stack.
 */
export class ResourcePolicyStatements extends Construct {
  /**
   * The writer for `functionArn` in `scope`'s stack. In the function's own stack it's a child of `host` (the function);
   * elsewhere a child of the stack, one per function.
   */
  public static of(scope: Construct, host: Construct, functionArn: string): ResourcePolicyStatements {
    const stack = Stack.of(scope);
    const [parent, id] = Stack.of(host) === stack
      ? [host, 'ResourcePolicyStatements']
      : [stack, `ResourcePolicyStatements${Names.uniqueId(host)}`];
    return (parent.node.tryFindChild(id) as ResourcePolicyStatements | undefined)
      ?? new ResourcePolicyStatements(parent, id, functionArn, host);
  }

  public readonly resource: CustomResource;
  private readonly document = new iam.PolicyDocument();
  private readonly added = new Map<string, string>();
  private readonly sidPrefix: string;
  private counter = 0;

  private constructor(scope: Construct, id: string, functionArn: string, warnOn: Construct) {
    super(scope, id);
    // Generated Sids carry a hash of this writer's path, so two stacks' statements never share one.
    this.sidPrefix = `Cdk${Names.uniqueId(this).slice(-8)}`;
    const provider = webFunctionProvider(this);
    // Stable grant (see grantToProvider): any Web Function of this account, in any region (imports may be elsewhere).
    grantToProvider(provider, {
      Action: ['lambda:GetResourcePolicy', 'lambda:PutResourcePolicy', 'lambda:DeleteResourcePolicy'],
      Resource: Stack.of(this).formatArn({
        service: 'lambda', region: '*', resource: 'web-function', resourceName: '*', arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      }),
    });
    this.resource = new CustomResource(this, 'Resource', {
      serviceToken: provider.serviceToken,
      resourceType: RESOURCE_POLICY_STATEMENTS_RESOURCE_TYPE,
      properties: { FunctionArn: functionArn, Policy: this.document },
    });

    this.node.addValidation({
      validate: () => {
        const json = Stack.of(this).resolve(this.document.toJSON());
        const { errors, unscopedServices } = inspectResourcePolicy(json);
        if (unscopedServices.length > 0) {
          Annotations.of(warnOn).addWarningV2('@cdk-lambda-web:servicePrincipalWithoutSource',
            `The resource policy lets ${[...new Set(unscopedServices)].join(', ')} call the function from any account. Restrict it with sourceArn or sourceAccount (addPermission), or a principal with conditions.`);
        }
        const sids = (json?.Statement ?? []).map((s: { Sid: string }) => s.Sid);
        const duplicates = [...new Set(sids.filter((sid: string, i: number) => sids.indexOf(sid) !== i))];
        return [
          ...this.document.validateForResourcePolicy(),
          ...errors.map((e) => `resource policy: ${e}`),
          ...duplicates.map((sid) => `resource policy: more than one statement has Sid '${sid}'`),
        ];
      },
    });
  }

  /** Adds a statement (a copy, with a Sid if it has none). An identical statement is only added once. */
  public add(statement: iam.PolicyStatement): void {
    // Resolved for the comparison only: principals render a new token each time (e.g. ServicePrincipal).
    const key = JSON.stringify(Stack.of(this).resolve(statement.toStatementJson()));
    if (this.added.has(key)) return;
    const sid = statement.sid ?? `${this.sidPrefix}${this.counter++}`;
    this.added.set(key, sid);
    this.document.addStatements(statement.sid ? statement : statement.copy({ sid }));
  }
}
