/**
 * CDK app for the live end-to-end tests (see run.ts). Built from the library source.
 * Context: scenario, endpointType (HOME_REGION | MULTI_REGION | PER_REGION), regions (JSON), auth (AWS_IAM | NONE), version (v1 | v2),
 * kind (web | nodejs: NodejsWebFunction bundling test/fixtures/nodejs/server.ts), bundling (local | docker: forceDockerBundling).
 */
import * as path from 'node:path';
import { App, CfnOutput, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsWebFunction, WebFunction, WebFunctionAuthType, WebFunctionEndpointType, type WebFunctionOptions } from '../../src';

export const HOME_REGION = 'ap-south-1';

const app = new App();
const ctx = (key: string, fallback?: string): string => app.node.tryGetContext(key) ?? fallback;
const scenario = ctx('scenario');
const endpointType = WebFunctionEndpointType[ctx('endpointType', 'HOME_REGION') as keyof typeof WebFunctionEndpointType];
const regions: string[] = JSON.parse(ctx('regions', '[]'));
const version = ctx('version', 'v1');

const stack = new Stack(app, `WebFnE2E-${scenario}`, { env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: HOME_REGION } });

const options: WebFunctionOptions = {
  authType: WebFunctionAuthType[ctx('auth', 'AWS_IAM') as keyof typeof WebFunctionAuthType],
  endpoint: { endpointType, regions },
  environment: { APP_VERSION: version },
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

const out = (id: string, value: string) => new CfnOutput(stack, id, { value });
out('FunctionName', fn.webFunctionName);
out('LogGroupName', fn.logGroup.logGroupName);
out('EndpointName', fn.endpoint.endpointName);
out('Url', fn.endpoint.url);
out('Regions', JSON.stringify(fn.endpoint.regions));
out('RevisionId', fn.revisionId);
out('ConsumerRoleArn', consumer.roleArn);
out('OutsiderRoleArn', outsider.roleArn);
if (endpointType === WebFunctionEndpointType.PER_REGION) {
  for (const region of fn.endpoint.regions) out(`Url${region.replace(/-/g, '')}`, fn.endpoint.regionalUrl(region));
}
