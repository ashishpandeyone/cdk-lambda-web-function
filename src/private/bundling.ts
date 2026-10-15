import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AssetHashType, DockerImage } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';

/** esbuild version used inside the Docker fallback. */
export const DOCKER_ESBUILD_VERSION = '0.28';
const DOCKER_ESBUILD_PREFIX = '/tmp/esbuild';

const LOCK_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock'];
const ENTRY_EXTENSIONS = ['.ts', '.mts', '.cts', '.tsx', '.js', '.mjs', '.cjs', '.jsx'];

/**
 * In an ESM bundle, CommonJS dependencies (e.g. Express) that `require()` Node built-ins fail with
 * "Dynamic require of ... is not supported". Defining `require` fixes that.
 */
export const ESM_REQUIRE_SHIM = "import { createRequire as __webFunctionCreateRequire } from 'node:module';const require = __webFunctionCreateRequire(import.meta.url);";

export interface EsbuildOptions {
  readonly minify: boolean;
  readonly sourceMap: boolean;
  readonly format: OutputFormat;
  readonly target: string;
  readonly externalModules: string[];
  readonly define: { [key: string]: string };
  readonly loader: { [ext: string]: string };
  readonly banner?: string;
  readonly footer?: string;
  readonly tsconfig?: string;
  readonly keepNames: boolean;
  readonly esbuildArgs: { [arg: string]: string | boolean };
}

export interface BundleProps {
  /** Absolute path of the entry file. */
  readonly entry: string;
  /** Absolute path of the directory esbuild resolves modules from. */
  readonly projectRoot: string;
  readonly esbuild: EsbuildOptions;
  readonly environment?: { [key: string]: string };
  readonly forceDockerBundling: boolean;
  readonly dockerImage: DockerImage;
}

/**
 * Rewrites a source map's `sources` to be relative to the project root.
 *
 * esbuild writes them relative to the output directory, which CDK places outside the project, so
 * they climb to the build machine's absolute paths (home directory, CI workspace) and end up in
 * production stack traces. Relative to the project root, Node resolves them next to the bundle
 * (e.g. `/var/task/src/server.ts`). Runs as `node -e SCRIPT <map file> <project root>`, locally
 * and in Docker.
 */
export const SOURCE_MAP_REWRITE_SCRIPT = [
  "const fs=require('fs'),path=require('path');",
  'const [mapFile,root]=process.argv.slice(1);',
  "const map=JSON.parse(fs.readFileSync(mapFile,'utf8'));",
  'const out=path.dirname(mapFile);',
  "map.sources=map.sources.map(s=>path.relative(root,path.resolve(out,map.sourceRoot||'',s)).split(path.sep).join('/'));",
  'delete map.sourceRoot;',
  'fs.writeFileSync(mapFile,JSON.stringify(map));',
].join('');

/** The file the bundle is written to, and the entry point the runtime must load. */
export function outputFile(format: OutputFormat): string {
  return format === OutputFormat.ESM ? 'index.mjs' : 'index.js';
}

/** Validates the entry file and returns its absolute path. */
export function resolveEntry(entry: string): string {
  const abs = path.resolve(entry);
  if (!ENTRY_EXTENSIONS.includes(path.extname(abs))) {
    throw new Error(`entry must be a JavaScript or TypeScript file (${ENTRY_EXTENSIONS.join(', ')}), got ${entry}`);
  }
  if (!fs.existsSync(abs)) {
    throw new Error(`entry file not found: ${abs}`);
  }
  return abs;
}

/** The nearest lock file at or above `dir`, or undefined. */
export function findLockFile(dir: string): string | undefined {
  let current = path.resolve(dir);
  for (;;) {
    for (const name of LOCK_FILES) {
      const candidate = path.join(current, name);
      if (fs.existsSync(candidate)) return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

/** esbuild's command-line arguments, for the given input and output paths. */
export function esbuildArgs(entry: string, outfile: string, o: EsbuildOptions): string[] {
  const banner = [o.format === OutputFormat.ESM ? ESM_REQUIRE_SHIM : undefined, o.banner].filter(Boolean).join('\n');
  return [
    entry,
    '--bundle',
    '--platform=node',
    `--target=${o.target}`,
    `--format=${o.format}`,
    `--outfile=${outfile}`,
    ...(o.minify ? ['--minify'] : []),
    ...(o.sourceMap ? ['--sourcemap'] : []),
    ...(o.keepNames ? ['--keep-names'] : []),
    ...(o.tsconfig ? [`--tsconfig=${o.tsconfig}`] : []),
    ...o.externalModules.map((m) => `--external:${m}`),
    ...Object.entries(o.define).map(([k, v]) => `--define:${k}=${v}`),
    ...Object.entries(o.loader).map(([ext, l]) => `--loader:${ext}=${l}`),
    ...(banner ? [`--banner:js=${banner}`] : []),
    ...(o.footer ? [`--footer:js=${o.footer}`] : []),
    ...Object.entries(o.esbuildArgs).map(([k, v]) => (v === true ? k : `${k}=${v}`)),
  ];
}

/**
 * A `lambda.Code` that bundles the entry with esbuild: locally when esbuild is installed in the
 * project, otherwise in Docker (an arm64 Node.js build image). The asset hash covers the output,
 * so an unchanged bundle doesn't create a new revision.
 */
export function bundledCode(props: BundleProps): lambda.Code {
  const file = outputFile(props.esbuild.format);
  const tsconfig = tsconfigPath(props);

  return lambda.Code.fromAsset(props.projectRoot, {
    assetHashType: AssetHashType.OUTPUT,
    bundling: {
      image: props.dockerImage,
      platform: 'linux/arm64',
      command: ['bash', '-c', dockerCommand(props)],
      environment: { npm_config_cache: '/tmp/.npm', npm_config_update_notifier: 'false', ...props.environment },
      local: props.forceDockerBundling ? undefined : {
        tryBundle(outputDir: string): boolean {
          if (!hasLocalEsbuild(props.projectRoot)) return false;
          const args = esbuildArgs(props.entry, path.join(outputDir, file), { ...props.esbuild, tsconfig });
          const result = spawnSync('npx', ['--no-install', 'esbuild', ...args], {
            cwd: props.projectRoot,
            env: { ...process.env, ...props.environment },
            stdio: ['ignore', 'inherit', 'inherit'],
          });
          if (result.status !== 0) {
            throw new Error(`esbuild failed for ${props.entry} (exit ${result.status ?? result.signal})`);
          }
          if (props.esbuild.sourceMap) {
            const rewrite = spawnSync(process.execPath, ['-e', SOURCE_MAP_REWRITE_SCRIPT, path.join(outputDir, `${file}.map`), props.projectRoot], { stdio: 'inherit' });
            if (rewrite.status !== 0) throw new Error(`rewriting the source map for ${props.entry} failed`);
          }
          return true;
        },
      },
    },
  });
}

/** The shell command that bundles inside the container (project at /asset-input, output to /asset-output). */
export function dockerCommand(props: BundleProps): string {
  const file = outputFile(props.esbuild.format);
  const inDocker = (p: string) => `/asset-input/${path.relative(props.projectRoot, p).split(path.sep).join('/')}`;
  const tsconfig = tsconfigPath(props);
  const args = esbuildArgs(inDocker(props.entry), `/asset-output/${file}`, { ...props.esbuild, tsconfig: tsconfig && inDocker(tsconfig) });
  return [
    // Installed outside the mounted project: npx would pick up the project's own esbuild, a binary for the host's platform.
    ['npm', 'install', '--prefix', DOCKER_ESBUILD_PREFIX, '--no-save', '--no-audit', '--no-fund', '--loglevel=error', `esbuild@${DOCKER_ESBUILD_VERSION}`].join(' '),
    [`${DOCKER_ESBUILD_PREFIX}/node_modules/.bin/esbuild`, ...args].map(shellQuote).join(' '),
    ...(props.esbuild.sourceMap ? [['node', '-e', SOURCE_MAP_REWRITE_SCRIPT, `/asset-output/${file}.map`, '/asset-input'].map(shellQuote).join(' ')] : []),
  ].join(' && ');
}

/** The tsconfig as an absolute path. A relative one is relative to the project root, esbuild's working directory. */
function tsconfigPath(props: BundleProps): string | undefined {
  return props.esbuild.tsconfig ? path.resolve(props.projectRoot, props.esbuild.tsconfig) : undefined;
}

function hasLocalEsbuild(projectRoot: string): boolean {
  const result = spawnSync('npx', ['--no-install', 'esbuild', '--version'], { cwd: projectRoot, stdio: 'ignore' });
  return result.status === 0;
}

function shellQuote(arg: string): string {
  return /^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, "'\\''")}'`;
}
