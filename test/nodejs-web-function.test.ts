import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { NodejsWebFunction, WebFunctionAuthType, type NodejsWebFunctionProps } from '../src';

const entry = path.join(__dirname, 'fixtures', 'nodejs', 'server.ts');
const env = { account: '111111111111', region: 'ap-south-1' };

function synth(props: Partial<NodejsWebFunctionProps> = {}) {
  const app = new App();
  const stack = new Stack(app, 'Stack', { env });
  const fn = new NodejsWebFunction(stack, 'Api', { entry, authType: WebFunctionAuthType.AWS_IAM, ...props });
  const assembly = app.synth();
  return { stack, fn, template: Template.fromStack(stack), outdir: assembly.directory };
}

/** The bundled asset directory (the one containing index.mjs / index.js). */
function bundleDir(outdir: string, file: string): string {
  const dir = fs.readdirSync(outdir).map((d) => path.join(outdir, d)).find((d) => fs.existsSync(path.join(d, file)));
  if (!dir) throw new Error(`no asset with ${file} in ${outdir}`);
  return dir;
}

/** Runs the bundle like the runtime does and returns its response. */
async function runBundle(dir: string, file: string, nodeOptions?: string): Promise<any> {
  const port = 39000 + Math.floor(Math.random() * 1000);
  const child = spawn(process.execPath, [path.join(dir, file)], {
    env: { ...process.env, AWS_LAMBDA_HTTP_ENDPOINT: `127.0.0.1:${port}`, AWS_REGION: 'ap-south-1', NODE_OPTIONS: nodeOptions ?? '' },
    stdio: 'ignore',
  });
  try {
    for (let i = 0; i < 50; i++) {
      try {
        return await (await fetch(`http://127.0.0.1:${port}/`)).json();
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    throw new Error('bundle did not start listening');
  } finally {
    child.kill();
  }
}

test('bundles TypeScript to index.mjs and wires the entry point, runtime and source maps', () => {
  const { template, outdir } = synth();

  template.hasResourceProperties('AWS::Lambda::WebFunctionRevision', {
    BuildConfig: { RuntimeConfig: { Runtime: 'nodejs24.x' } },
    ServiceConfig: { EnvironmentVariables: { AWS_LAMBDA_NODEJS_ENTRYPOINT: 'index.mjs', NODE_OPTIONS: '--enable-source-maps' } },
  });
  const dir = bundleDir(outdir, 'index.mjs');
  expect(fs.readdirSync(dir).sort()).toEqual(['index.mjs', 'index.mjs.map']);
  const bundle = fs.readFileSync(path.join(dir, 'index.mjs'), 'utf8');
  expect(bundle).toContain('createRequire'); // shim for CommonJS dependencies
  expect(bundle).toContain('sts.'); // the AWS SDK client is bundled (the runtime has none)
});

test('the ESM bundle runs: AWS SDK and CommonJS dependencies load, stack traces map to the TypeScript source', async () => {
  const { outdir } = synth();
  const dir = bundleDir(outdir, 'index.mjs');
  const res = await runBundle(dir, 'index.mjs', '--enable-source-maps');

  expect(res).toMatchObject({ ok: true, region: 'ap-south-1', sdk: 'function', commonJs: 'object' });
  // Resolved next to the bundle, not to the build machine's absolute path.
  expect(res.stack).toContain(path.join(dir, 'test/fixtures/nodejs/server.ts'));
});

test('source map paths are relative to the project root (no build-machine paths)', () => {
  const { outdir } = synth();
  const map = JSON.parse(fs.readFileSync(path.join(bundleDir(outdir, 'index.mjs'), 'index.mjs.map'), 'utf8'));

  expect(map.sources).toContain('test/fixtures/nodejs/server.ts');
  expect(map.sources.some((src: string) => src.startsWith('node_modules/@aws-sdk/client-sts/'))).toBe(true);
  for (const src of map.sources) expect(src).not.toMatch(/^(\/|\.\.\/)/);
  expect(JSON.stringify(map.sources)).not.toContain(os.homedir());
});

test('CommonJS output is index.js and runs', async () => {
  const { template, outdir } = synth({ bundling: { format: OutputFormat.CJS, minify: false } });

  template.hasResourceProperties('AWS::Lambda::WebFunctionRevision', {
    ServiceConfig: { EnvironmentVariables: { AWS_LAMBDA_NODEJS_ENTRYPOINT: 'index.js' } },
  });
  const res = await runBundle(bundleDir(outdir, 'index.js'), 'index.js');
  expect(res).toMatchObject({ ok: true, sdk: 'function', commonJs: 'object' });
});

test('source maps off: no map and no NODE_OPTIONS; user NODE_OPTIONS are kept and extended', () => {
  const off = synth({ bundling: { sourceMap: false } });
  off.template.hasResourceProperties('AWS::Lambda::WebFunctionRevision', {
    ServiceConfig: { EnvironmentVariables: Match.objectEquals({ AWS_LAMBDA_NODEJS_ENTRYPOINT: 'index.mjs' }) },
  });
  expect(fs.readdirSync(bundleDir(off.outdir, 'index.mjs'))).toEqual(['index.mjs']);

  const merged = synth({ environment: { NODE_OPTIONS: '--max-old-space-size=512', TABLE: 't' } });
  merged.template.hasResourceProperties('AWS::Lambda::WebFunctionRevision', {
    ServiceConfig: { EnvironmentVariables: { NODE_OPTIONS: '--max-old-space-size=512 --enable-source-maps', TABLE: 't' } },
  });
});

test('externalModules are left out of the bundle', () => {
  const { outdir } = synth({ bundling: { externalModules: ['supports-color'], minify: false } });
  const bundle = fs.readFileSync(path.join(bundleDir(outdir, 'index.mjs'), 'index.mjs'), 'utf8');
  expect(bundle).toMatch(/from ["']supports-color["']/);
});

test('target follows the runtime', () => {
  const { template } = synth({ runtime: lambda.Runtime.NODEJS_22_X });
  template.hasResourceProperties('AWS::Lambda::WebFunctionRevision', { BuildConfig: { RuntimeConfig: { Runtime: 'nodejs22.x' } } });
});

test.each<[Partial<NodejsWebFunctionProps>, RegExp]>([
  [{ entry: path.join(__dirname, 'fixtures', 'nodejs', 'missing.ts') }, /entry file not found/],
  [{ entry: path.join(__dirname, 'fixtures', 'nodejs', 'server.py') }, /must be a JavaScript or TypeScript file/],
  [{ projectRoot: path.join(__dirname, 'fixtures', 'hello') }, /must be inside projectRoot/],
  [{ runtime: lambda.Runtime.PYTHON_3_13 }, /run Node.js only/],
])('rejects invalid input %#', (props, error) => {
  expect(() => new NodejsWebFunction(new Stack(new App(), 'S', { env }), 'Api', { entry, authType: WebFunctionAuthType.AWS_IAM, ...props }))
    .toThrow(error);
});

test('fails clearly when no lock file is found', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nodejs-web-function-'));
  const lonely = path.join(dir, 'server.js');
  fs.writeFileSync(lonely, 'console.log(1)');
  try {
    expect(() => new NodejsWebFunction(new Stack(new App(), 'S', { env }), 'Api', { entry: lonely, authType: WebFunctionAuthType.AWS_IAM }))
      .toThrow(/no lock file .* found above/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
