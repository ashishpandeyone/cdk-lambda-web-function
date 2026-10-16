import { JsonFile, ReleasableCommits, awscdk, javascript } from 'projen';

const CDK_VERSION = '2.273.0';

const project = new awscdk.AwsCdkConstructLibrary({
  name: '@ashishpandeyone/cdk-lambda-web-function',
  description: 'AWS CDK L2 constructs for AWS Lambda Web Functions, with an API modelled on aws-cdk-lib/aws-lambda.',
  keywords: ['awscdk', 'aws-cdk', 'cdk', 'cdk-construct', 'lambda', 'lambda-web', 'web-functions', 'serverless'],
  author: 'Ashishkumar Pandey',
  authorAddress: 'ashishpandeyone@gmail.com',
  repositoryUrl: 'https://github.com/ashishpandeyone/cdk-lambda-web-function.git',
  license: 'Apache-2.0',

  defaultReleaseBranch: 'main',
  packageManager: javascript.NodePackageManager.NPM,
  projenrcTs: true,

  cdkVersion: CDK_VERSION,
  constructsVersion: '10.5.1',
  jsiiVersion: '~6.0.0',

  // Toolchain: Node 24 locally via mise.toml and in CI; consumers need an active LTS.
  workflowNodeVersion: '24.x',
  minNodeVersion: '22.0.0',

  // Experimental until the API settles: 0.x releases, stability banner in the README.
  stability: 'experimental',
  majorVersion: 0,
  // Only feat/fix commits produce a release; docs/chore/test commits don't publish a new version.
  releasableCommits: ReleasableCommits.featuresAndFixes(),
  releaseToNpm: true,
  npmTrustedPublishing: true,

  experimentalIntegRunner: true,
  // Snapshots pin logical IDs (a change replaces resources and URLs): never rewrite them silently.
  jestOptions: { updateSnapshot: javascript.UpdateSnapshot.NEVER },

  devDeps: [
    `awslint@${CDK_VERSION}-alpha.0`,
    'cdk-nag@^3',
    // Custom resource handler (bundled into assets/ at build time, never a runtime dependency).
    'esbuild@^0.28',
    '@aws-sdk/client-s3@^3',
    '@aws-sdk/client-cloudwatch-logs@^3',
    '@aws-sdk/client-lambda-web@^3.1151.0',
    // Progressive deployments (traffic shift handlers): alarm states and the stack's status (rollback detection).
    '@aws-sdk/client-cloudwatch@^3',
    '@aws-sdk/client-cloudformation@^3',
    '@types/aws-lambda',
    'aws-sdk-client-mock@^4',
    // Live end-to-end tests (test/e2e): deploy, call with SigV4/SigV4a, inspect every region.
    'tsx',
    '@smithy/signature-v4',
    '@smithy/signature-v4a',
    '@aws-crypto/sha256-js',
    '@aws-sdk/credential-providers',
    '@aws-sdk/client-sts',
    // NodejsWebFunction fixture: a CommonJS package that require()s Node built-ins (v7 is the last CommonJS major).
    'supports-color@^7',
  ],

  tsconfigDev: { include: ['../handlers/**/*.ts'] },
  eslintOptions: { dirs: ['src'], devdirs: ['test', 'handlers'] },

  gitignore: [
    'cdk.out', 'cdk.context.json', '.env', '.DS_Store', '/assets/', '.jsii.tabl.json',
    // Local planning notes and drafts (design history, research, future scope): never committed or published.
    '/PLAN.md', '/docs/',
    // Personal tool settings (AWS profile/region); mise.toml only pins tool versions.
    'mise.local.toml',
  ],
});

// The provider handler lives outside src/ (jsii only compiles the public library) and is
// bundled with its AWS SDK clients, since nodejs24.x doesn't include @aws-sdk/client-lambda-web.
const bundleHandlers = project.addTask('bundle:handlers', {
  description: 'Bundle the custom resource handlers into assets/',
  exec: 'esbuild handlers/web-function-provider/index.ts --bundle --platform=node --target=node24 --format=cjs --minify --outfile=assets/web-function-provider/index.js',
});
// The deployment provider's handlers (canary and linear deployments) run in their own Lambda functions behind the
// Provider framework, so they're bundled separately.
bundleHandlers.exec('esbuild handlers/web-function-deployment/index.ts --bundle --platform=node --target=node24 --format=cjs --minify --outfile=assets/web-function-deployment/index.js');
project.preCompileTask.spawn(bundleHandlers);
// Live end-to-end tests: deploy real stacks in ap-south-1 (+ us-east-1, eu-west-1), verify, destroy.
// Needs AWS credentials (e.g. AWS_PROFILE in a git-ignored mise.local.toml); not part of `build`.
project.addTask('e2e', {
  description: 'Deploy, verify and destroy real Web Functions in three regions (needs AWS credentials)',
  steps: [{ spawn: 'bundle:handlers' }, { exec: 'tsx test/e2e/run.ts', receiveArgs: true }],
});

// eslint's project service uses the nearest tsconfig, so handlers/ needs its own.
new JsonFile(project, 'handlers/tsconfig.json', {
  obj: { extends: '../test/tsconfig.json', include: ['**/*.ts', '../src/private/provider-protocol.ts'] },
});
project.npmignore?.exclude(
  '/handlers/', '/PLAN.md', '/docs/', '/rosetta/',
  // Local tool settings and CDK output (e.g. from e2e runs) must never ship.
  'mise.toml', 'mise.local.toml', 'cdk.out', 'cdk.context.json',
);
project.npmignore?.include('/assets/');

// Lint the public API against the CDK construct design rules.
// Rules that only make sense inside the aws-cdk repo are excluded in package.json "awslint".
const awslint = project.addTask('awslint', {
  description: 'Lint the jsii assembly against the CDK construct design rules',
  exec: 'awslint',
});

// Compile every TypeScript example in the README so documentation can't drift from the API.
const rosetta = project.addTask('rosetta:extract', {
  description: 'Type-check README examples with jsii-rosetta',
  exec: 'jsii-rosetta extract --strict',
});

project.postCompileTask.spawn(awslint);
project.postCompileTask.spawn(rosetta);

project.package.addField('awslint', {
  exclude: [
    // Endpoints are created only through WebFunction (constructor, addEndpoint), which owns their log groups in every region.
    'construct-ctor:@ashishpandeyone/cdk-lambda-web-function.WebFunctionEndpoint',
    // Revisions are created by WebFunction (currentRevision) or referenced (fromRevisionAttributes), never constructed directly.
    'construct-ctor:@ashishpandeyone/cdk-lambda-web-function.WebFunctionRevision',
    // Importing existing functions (fromXxx) is planned after 0.1.
    'from-method:@ashishpandeyone/cdk-lambda-web-function.WebFunction',
    // NodejsWebFunction extends WebFunction and implements IWebFunction through it.
    'resource-interface:@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction',
  ],
});

// main requires signed commits (ruleset protect-main). Commit the dependency upgrade through the GitHub API, which signs it,
// instead of with git in the runner. projen has no option for create-pull-request's sign-commits; step 4 is "Create Pull Request".
project.github?.tryFindWorkflow('upgrade-main')?.file?.addOverride('jobs.pr.steps.4.with.sign-commits', true);

project.synth();
