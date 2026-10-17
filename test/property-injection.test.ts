import * as path from 'node:path';
import { App, type IPropertyInjector, type InjectionContext, PropertyInjectors, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsWebFunction, WebFunction, WebFunctionAuthType, type NodejsWebFunctionProps, type WebFunctionProps } from '../src';

const code = () => lambda.Code.fromAsset(path.join(__dirname, 'fixtures', 'hello'));
const env = { account: '111111111111', region: 'ap-south-1' };

/** Defaults a team might set for every function: explicit props still win. */
class Defaults<T> implements IPropertyInjector {
  public readonly calls: InjectionContext[] = [];
  constructor(public readonly constructUniqueId: string, private readonly defaults: Partial<T>) {}
  public inject(originalProps: T, context: InjectionContext): T {
    this.calls.push(context);
    return { ...this.defaults, ...originalProps };
  }
}

const description = (stack: Stack) => Object.values(Template.fromStack(stack).findResources('AWS::Lambda::WebFunctionRevision'))
  .map((r: any) => r.Properties.Description);
const retention = (stack: Stack) => Object.values(Template.fromStack(stack).findResources('Custom::LambdaWebLogGroup'))
  .map((r: any) => r.Properties.RetentionInDays);

describe('property injection', () => {
  test('ids', () => {
    expect(WebFunction.PROPERTY_INJECTION_ID).toBe('@ashishpandeyone/cdk-lambda-web-function.WebFunction');
    expect(NodejsWebFunction.PROPERTY_INJECTION_ID).toBe('@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction');
  });

  test('an injector on the app sets defaults for every WebFunction; explicit props win', () => {
    const app = new App();
    const injector = new Defaults<WebFunctionProps>(WebFunction.PROPERTY_INJECTION_ID, { description: 'team default', logRetention: logs.RetentionDays.ONE_WEEK });
    PropertyInjectors.of(app).add(injector);
    const stack = new Stack(app, 'Stack', { env });
    new WebFunction(stack, 'A', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM });
    new WebFunction(stack, 'B', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM, description: 'mine' });
    expect(description(stack).sort()).toEqual(['mine', 'team default']);
    expect(new Set(retention(stack))).toEqual(new Set(['7']));
    expect(injector.calls.map((c) => [c.scope.node.path, c.id])).toEqual([['Stack', 'A'], ['Stack', 'B']]);
  });

  test('the nearest injector wins; other scopes are untouched', () => {
    const app = new App();
    PropertyInjectors.of(app).add(new Defaults<WebFunctionProps>(WebFunction.PROPERTY_INJECTION_ID, { description: 'app' }));
    const special = new Stack(app, 'Special', { env });
    PropertyInjectors.of(special).add(new Defaults<WebFunctionProps>(WebFunction.PROPERTY_INJECTION_ID, { description: 'special' }));
    const other = new Stack(app, 'Other', { env });
    new WebFunction(special, 'A', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM });
    new WebFunction(other, 'A', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM });
    expect(description(special)).toEqual(['special']);
    expect(description(other)).toEqual(['app']);
  });

  test('no injector: props are used as given', () => {
    const stack = new Stack(new App(), 'Stack', { env });
    new WebFunction(stack, 'A', { runtime: lambda.Runtime.NODEJS_24_X, code: code(), authType: WebFunctionAuthType.AWS_IAM });
    expect(description(stack)).toEqual([undefined]);
  });

  test('NodejsWebFunction gets its own injector, then WebFunction\'s', () => {
    const app = new App();
    const nodejs = new Defaults<NodejsWebFunctionProps>(NodejsWebFunction.PROPERTY_INJECTION_ID, { description: 'nodejs default' });
    const web = new Defaults<WebFunctionProps>(WebFunction.PROPERTY_INJECTION_ID, { logRetention: logs.RetentionDays.ONE_WEEK, description: 'web default' });
    PropertyInjectors.of(app).add(nodejs, web);
    const stack = new Stack(app, 'Stack', { env });
    new NodejsWebFunction(stack, 'Node', { entry: path.join(__dirname, 'fixtures', 'nodejs', 'server.ts'), authType: WebFunctionAuthType.NONE });
    // WebFunction's injector only fills what the NodejsWebFunction injector and props left unset.
    expect(description(stack)).toEqual(['nodejs default']);
    expect(new Set(retention(stack))).toEqual(new Set(['7']));
    expect([nodejs.calls.length, web.calls.length]).toEqual([1, 1]);
  });
});
