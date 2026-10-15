import * as path from 'node:path';
import { App, DockerImage, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { dockerCommand, type BundleProps } from '../src/private/bundling';
import { WebFunctionCode } from '../src/private/code';
import { EndpointLookup } from '../src/private/endpoint-lookup';
import { WebFunctionLogGroup } from '../src/private/log-group';

const fixture = path.join(__dirname, 'fixtures', 'hello');
const newStack = () => new Stack(new App(), 'Stack', { env: { account: '111111111111', region: 'ap-south-1' } });

describe('code', () => {
  test('copies the asset into one versioned, Lambda-readable code bucket per stack', () => {
    const stack = newStack();
    const a = new WebFunctionCode(stack, 'A', lambda.Code.fromAsset(fixture));
    new WebFunctionCode(stack, 'B', lambda.Code.fromAsset(fixture));
    const t = Template.fromStack(stack);

    t.resourceCountIs('AWS::S3::Bucket', 1);
    t.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
      PublicAccessBlockConfiguration: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true },
      LifecycleConfiguration: { Rules: [Match.objectLike({ NoncurrentVersionExpiration: { NoncurrentDays: 30 }, Status: 'Enabled' })] },
    });
    t.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([Match.objectLike({
          Sid: 'LambdaWebFunctionsReadCode',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: ['s3:GetObject', 's3:GetObjectVersion'],
          Condition: { StringEquals: { 'aws:SourceAccount': '111111111111' } },
        })]),
      },
    });

    t.resourceCountIs('Custom::LambdaWebCode', 2);
    t.hasResourceProperties('Custom::LambdaWebCode', {
      SourceBucket: Match.stringLikeRegexp('cdk-.*-assets-111111111111-ap-south-1'),
      SourceKey: Match.stringLikeRegexp('^[0-9a-f]{64}\\.zip$'),
      DestinationKey: Match.stringLikeRegexp(`^web-functions/${a.node.addr}/[0-9a-f]{64}\\.zip$`),
    });
    // One provider Lambda for the whole stack.
    t.resourceCountIs('AWS::Lambda::Function', 2); // provider + S3 auto-delete-objects provider
    t.hasResourceProperties('AWS::Lambda::Function', { Runtime: 'nodejs24.x', Timeout: 300, Description: Match.stringLikeRegexp('Lambda Web Functions') });
    // ListBucket makes HeadObject on a missing key a 404 (not a 403).
    const role = Object.values(t.findResources('AWS::IAM::Role')).find((r: any) => JSON.stringify(r).includes('s3:PutObject')) as any;
    expect(role.Properties.Policies[0].PolicyDocument.Statement).toContainEqual({
      Effect: 'Allow', Action: 's3:ListBucket', Resource: { 'Fn::GetAtt': [expect.stringMatching(/^LambdaWebFunctionCodeBucket/), 'Arn'] },
    });
    // The revision pins the version returned by the copy.
    expect(stack.resolve(a.location.objectVersion)).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^ACopy/), 'VersionId'] });
  });

  test('rejects inline code and container images', () => {
    const stack = newStack();
    expect(() => new WebFunctionCode(stack, 'Inline', lambda.Code.fromInline('x'))).toThrow(/do not support inline code/);
    const repo = ecr.Repository.fromRepositoryName(stack, 'Repo', 'repo');
    expect(() => new WebFunctionCode(stack, 'Image', lambda.Code.fromEcrImage(repo))).toThrow(/do not support container images/);
  });
});

describe('log group', () => {
  test('owns a group in a remote region with retention and least-privilege IAM', () => {
    const stack = newStack();
    new WebFunctionLogGroup(stack, 'Remote', { region: 'eu-west-1', logGroupName: '/aws/lambda/web/api.local', retention: logs.RetentionDays.ONE_MONTH, removalPolicy: RemovalPolicy.DESTROY });
    const t = Template.fromStack(stack);

    t.hasResourceProperties('Custom::LambdaWebLogGroup', {
      Region: 'eu-west-1', LogGroupName: '/aws/lambda/web/api.local', RetentionInDays: '30', RemovalPolicy: 'destroy', FlushWaitSeconds: '75',
    });
    // Stable grant: Web Function log groups in any region (per-name grants break on region removal and rollback).
    const role = Object.values(t.findResources('AWS::IAM::Role'))[0] as any;
    expect(role.Properties.Policies[0].PolicyDocument.Statement).toContainEqual({
      Effect: 'Allow',
      Action: ['logs:CreateLogGroup', 'logs:PutRetentionPolicy', 'logs:DeleteRetentionPolicy', 'logs:DeleteLogGroup'],
      Resource: { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':logs:*:111111111111:log-group:/aws/lambda/web/*']] },
    });
  });

  test('maps INFINITE retention and RETAIN', () => {
    const stack = newStack();
    new WebFunctionLogGroup(stack, 'Home', { region: 'ap-south-1', logGroupName: '/aws/lambda/web/api', retention: logs.RetentionDays.INFINITE, removalPolicy: RemovalPolicy.RETAIN });
    Template.fromStack(stack).hasResourceProperties('Custom::LambdaWebLogGroup', { RetentionInDays: 'Infinite', RemovalPolicy: 'retain' });
  });

  test('rejects removal policies other than RETAIN and DESTROY', () => {
    const stack = newStack();
    expect(() => new WebFunctionLogGroup(stack, 'Bad', { region: 'ap-south-1', logGroupName: 'x', retention: logs.RetentionDays.ONE_DAY, removalPolicy: RemovalPolicy.SNAPSHOT }))
      .toThrow(/must be RETAIN or DESTROY/);
  });
});

describe('endpoint lookup', () => {
  test('exposes regional domains as attributes and may only read that endpoint', () => {
    const stack = newStack();
    const lookup = new EndpointLookup(stack, 'Lookup', {
      functionName: 'api',
      functionArn: 'arn:aws:lambda:ap-south-1:111111111111:web-function/api',
      endpointName: 'default-1a2b3c4d',
      endpointArn: 'arn:aws:lambda:ap-south-1:111111111111:web-function/api/endpoint/default-1a2b3c4d',
    });
    const t = Template.fromStack(stack);

    t.hasResourceProperties('Custom::LambdaWebEndpointLookup', { EndpointName: 'default-1a2b3c4d' });
    expect(stack.resolve(lookup.regionalDomain('eu-west-1'))).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/^Lookup/), 'Domain.eu-west-1'] });
    const role = Object.values(t.findResources('AWS::IAM::Role'))[0] as any;
    expect(role.Properties.Policies[0].PolicyDocument.Statement).toContainEqual({
      Effect: 'Allow',
      Action: 'lambda:GetWebFunctionEndpoint',
      Resource: { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':lambda:ap-south-1:111111111111:web-function/api/endpoint/*']] },
    });
  });
});

describe('docker bundling', () => {
  const root = path.join(__dirname, '..');
  const props = (esbuild: Partial<BundleProps['esbuild']> = {}): BundleProps => ({
    entry: path.join(root, 'src', 'server.ts'),
    projectRoot: root,
    forceDockerBundling: true,
    dockerImage: DockerImage.fromRegistry('public.ecr.aws/sam/build-nodejs24.x:latest-arm64'),
    esbuild: {
      minify: true,
      sourceMap: true,
      format: OutputFormat.ESM,
      target: 'node24',
      externalModules: [],
      define: {},
      loader: {},
      keepNames: false,
      esbuildArgs: {},
      ...esbuild,
    },
  });

  test('runs esbuild installed outside the mounted project, never the project\'s own (host-platform) binary', () => {
    const command = dockerCommand(props());
    expect(command).not.toMatch(/npx/);
    expect(command).toMatch(/^npm install --prefix \/tmp\/esbuild .* esbuild@0\.28 && \/tmp\/esbuild\/node_modules\/\.bin\/esbuild \/asset-input\/src\/server\.ts /);
    expect(command).toMatch(/--outfile=\/asset-output\/index\.mjs/);
    expect(command).toMatch(/&& node -e .* \/asset-output\/index\.mjs\.map \/asset-input$/);
  });

  test('maps paths into the container', () => {
    expect(dockerCommand(props({ tsconfig: 'tsconfig.dev.json' }))).toMatch(/--tsconfig=\/asset-input\/tsconfig\.dev\.json /);
    expect(dockerCommand(props({ tsconfig: path.join(root, 'tsconfig.dev.json') }))).toMatch(/--tsconfig=\/asset-input\/tsconfig\.dev\.json /);
    expect(dockerCommand(props({ sourceMap: false, format: OutputFormat.CJS }))).toMatch(/--outfile=\/asset-output\/index\.js --minify$/);
  });
});
