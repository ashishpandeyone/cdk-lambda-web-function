import * as path from 'node:path';
import { DockerImage } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';
import { bundledCode, findLockFile, outputFile, resolveEntry } from './private/bundling';
import { injectProps } from './private/property-injection';
import { WebFunction, type WebFunctionOptions } from './web-function';

/**
 * How `NodejsWebFunction` bundles the server with esbuild.
 */
export interface NodejsWebFunctionBundlingOptions {
  /**
   * Minify the bundle.
   *
   * @default true
   */
  readonly minify?: boolean;

  /**
   * Generate a source map, and set `NODE_OPTIONS=--enable-source-maps` so stack traces point at your sources.
   *
   * @default true
   */
  readonly sourceMap?: boolean;

  /**
   * Output format. ESM is written to `index.mjs` (with a `require` shim, so CommonJS dependencies
   * such as Express work); CommonJS to `index.js`.
   *
   * @default OutputFormat.ESM
   */
  readonly format?: OutputFormat;

  /**
   * esbuild target.
   *
   * @default - the runtime's Node.js version, e.g. `node24`
   */
  readonly target?: string;

  /**
   * Modules to leave out of the bundle. The runtime has no AWS SDK, so `@aws-sdk/*` is bundled like
   * any other dependency; only exclude modules you provide another way.
   *
   * @default - none
   */
  readonly externalModules?: string[];

  /**
   * Replace global identifiers with constant expressions (esbuild `--define`).
   *
   * @default - none
   */
  readonly define?: { [key: string]: string };

  /**
   * esbuild loaders by file extension, e.g. `{ '.png': 'dataurl' }`.
   *
   * @default - esbuild's defaults
   */
  readonly loader?: { [ext: string]: string };

  /**
   * Text to prepend to the bundle.
   *
   * @default - none
   */
  readonly banner?: string;

  /**
   * Text to append to the bundle.
   *
   * @default - none
   */
  readonly footer?: string;

  /**
   * Path of the tsconfig.json to use, relative to the project root or absolute (inside the project root).
   *
   * @default - esbuild's lookup from the entry file
   */
  readonly tsconfig?: string;

  /**
   * Keep function and class names (`--keep-names`).
   *
   * @default false
   */
  readonly keepNames?: boolean;

  /**
   * Extra esbuild arguments, e.g. `{ '--log-limit': '0', '--tree-shaking': true }`.
   *
   * @default - none
   */
  readonly esbuildArgs?: { [arg: string]: string | boolean };

  /**
   * Environment variables while bundling (not at runtime).
   *
   * @default - none
   */
  readonly environment?: { [key: string]: string };

  /**
   * Always bundle in Docker, even if esbuild is installed locally.
   *
   * @default false
   */
  readonly forceDockerBundling?: boolean;

  /**
   * Docker image for bundling when esbuild isn't installed locally.
   *
   * @default - the arm64 AWS SAM build image for the runtime, e.g. `public.ecr.aws/sam/build-nodejs24.x:latest-arm64`
   */
  readonly dockerImage?: DockerImage;
}

/**
 * Properties for a `NodejsWebFunction`.
 */
export interface NodejsWebFunctionProps extends WebFunctionOptions {
  /**
   * The file that starts your server (TypeScript or JavaScript). It's bundled with its dependencies.
   */
  readonly entry: string;

  /**
   * The Node.js runtime.
   *
   * @default lambda.Runtime.NODEJS_24_X
   */
  readonly runtime?: lambda.Runtime;

  /**
   * The lock file that marks the project root (where esbuild resolves `node_modules`).
   *
   * @default - the nearest `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` or `bun.lock(b)` above the entry
   */
  readonly depsLockFilePath?: string;

  /**
   * The project root. Must contain the entry file.
   *
   * @default - the directory of the lock file
   */
  readonly projectRoot?: string;

  /**
   * How the server is bundled.
   *
   * @default - minified ESM with a source map, targeting the runtime's Node.js version
   */
  readonly bundling?: NodejsWebFunctionBundlingOptions;
}

/**
 * A `WebFunction` whose code is bundled from a TypeScript or JavaScript entry file with esbuild,
 * like `NodejsFunction` for Lambda functions.
 *
 * Besides bundling, it sets what a `lambda.Code` alone can't: the entry point that matches the
 * bundle, and `NODE_OPTIONS=--enable-source-maps` when source maps are on.
 */
export class NodejsWebFunction extends WebFunction {
  /**
   * Identifies this class to property injectors (`PropertyInjectors.of(scope).add(...)`). A `NodejsWebFunction` gets
   * its own injector first, then `WebFunction`'s, as aws-cdk-lib's `NodejsFunction` does with `Function`'s.
   */
  public static readonly PROPERTY_INJECTION_ID: string = '@ashishpandeyone/cdk-lambda-web-function.NodejsWebFunction';

  constructor(scope: Construct, id: string, props: NodejsWebFunctionProps) {
    props = injectProps(NodejsWebFunction.PROPERTY_INJECTION_ID, props, scope, id);
    const runtime = props.runtime ?? lambda.Runtime.NODEJS_24_X;
    const entry = resolveEntry(props.entry);
    const projectRoot = path.resolve(props.projectRoot ?? path.dirname(lockFile(props, entry)));
    if (path.relative(projectRoot, entry).startsWith('..')) {
      throw new Error(`entry ${entry} must be inside projectRoot ${projectRoot}`);
    }

    const b = props.bundling ?? {};
    const format = b.format ?? OutputFormat.ESM;
    const sourceMap = b.sourceMap ?? true;
    const nodeMajor = /^nodejs(\d+)/.exec(runtime.name)?.[1];

    const code = bundledCode({
      entry,
      projectRoot,
      environment: b.environment,
      forceDockerBundling: b.forceDockerBundling ?? false,
      dockerImage: b.dockerImage ?? DockerImage.fromRegistry(`public.ecr.aws/sam/build-${runtime.name}:latest-arm64`),
      esbuild: {
        minify: b.minify ?? true,
        sourceMap,
        format,
        target: b.target ?? (nodeMajor ? `node${nodeMajor}` : 'node24'),
        externalModules: b.externalModules ?? [],
        define: b.define ?? {},
        loader: b.loader ?? {},
        banner: b.banner,
        footer: b.footer,
        tsconfig: b.tsconfig,
        keepNames: b.keepNames ?? false,
        esbuildArgs: b.esbuildArgs ?? {},
      },
    });

    super(scope, id, {
      ...props,
      runtime,
      code,
      entrypoint: outputFile(format),
      environment: withSourceMaps(props.environment, sourceMap),
    });
  }
}

function lockFile(props: NodejsWebFunctionProps, entry: string): string {
  if (props.depsLockFilePath) return path.resolve(props.depsLockFilePath);
  const found = findLockFile(path.dirname(entry));
  if (!found) {
    throw new Error(`no lock file (package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lock) found above ${entry}; set depsLockFilePath or projectRoot`);
  }
  return found;
}

/** Adds `--enable-source-maps` to NODE_OPTIONS, keeping anything the user set. */
function withSourceMaps(environment: { [key: string]: string } | undefined, sourceMap: boolean): { [key: string]: string } | undefined {
  if (!sourceMap) return environment;
  const existing = environment?.NODE_OPTIONS;
  if (existing?.split(/\s+/).includes('--enable-source-maps')) return environment;
  return { ...environment, NODE_OPTIONS: existing ? `${existing} --enable-source-maps` : '--enable-source-maps' };
}
