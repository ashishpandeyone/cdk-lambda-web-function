/**
 * Live end-to-end tests: deploy real Web Functions from ap-south-1 to us-east-1 and eu-west-1,
 * verify them, change them, destroy them, and check nothing is left in any region.
 *
 *   npx projen e2e            # all scenarios
 *   npx projen e2e A C        # selected scenarios
 *
 * Needs AWS credentials for the target account (e.g. AWS_PROFILE in a git-ignored mise.local.toml).
 */
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { Sha256 } from '@aws-crypto/sha256-js';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { LambdaWebClient, ListWebFunctionEndpointsCommand, ListWebFunctionRevisionsCommand, ListWebFunctionsCommand } from '@aws-sdk/client-lambda-web';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { SignatureV4a } from '@smithy/signature-v4a';

const exec = promisify(execFile);
const HOME = 'ap-south-1';
const ALL_REGIONS = ['ap-south-1', 'us-east-1', 'eu-west-1'];
const RETENTION_DAYS = 7;
const ROOT = path.join(__dirname, '..', '..');
const credentials = fromNodeProviderChain();
const web = new LambdaWebClient({ region: HOME, credentials });
const sts = new STSClient({ region: HOME, credentials });
const logsIn = (region: string) => new CloudWatchLogsClient({ region, credentials });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Credentials = { accessKeyId: string; secretAccessKey: string; sessionToken?: string };
type Outputs = Record<string, string>;
interface Context { endpointType: string; regions: string[]; auth?: string; version?: string; kind?: string }

class Scenario {
  public readonly results: { name: string; ok: boolean; detail: string }[] = [];
  private readonly started = Date.now();

  constructor(public readonly id: string, private readonly description: string) {}

  public log(msg: string) {
    console.log(`[${this.id} +${String(Math.round((Date.now() - this.started) / 1000)).padStart(4)}s] ${msg}`);
  }

  public check(name: string, ok: boolean, detail = '') {
    this.results.push({ name, ok, detail });
    this.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
  }

  public async deploy(ctx: Context): Promise<Outputs> {
    const outFile = path.join(mkdtempSync(path.join(tmpdir(), 'webfn-e2e-')), 'outputs.json');
    this.log(`deploy ${JSON.stringify(ctx)}`);
    await cdk(['deploy', ...this.contextArgs(ctx), '--require-approval', 'never', '--outputs-file', outFile]);
    return JSON.parse(readFileSync(outFile, 'utf8'))[`WebFnE2E-${this.id}`];
  }

  public async destroy(ctx: Context) {
    this.log('destroy');
    await cdk(['destroy', ...this.contextArgs(ctx), '--force']);
  }

  public summary(): string {
    const failed = this.results.filter((r) => !r.ok);
    return `${this.id} (${this.description}): ${this.results.length - failed.length}/${this.results.length} passed${failed.map((f) => `\n    FAIL ${f.name}${f.detail ? ` (${f.detail})` : ''}`).join('')}`;
  }

  private contextArgs(ctx: Context): string[] {
    // Scenarios run in parallel, so each synthesizes into its own directory.
    return ['--app', 'npx tsx test/e2e/app.ts', '--output', path.join(tmpdir(), `webfn-e2e-cdk.out-${this.id}`), '-c', `scenario=${this.id}`, '-c', `endpointType=${ctx.endpointType}`,
      '-c', `regions=${JSON.stringify(ctx.regions)}`, '-c', `auth=${ctx.auth ?? 'AWS_IAM'}`, '-c', `version=${ctx.version ?? 'v1'}`,
      '-c', `kind=${ctx.kind ?? 'web'}`];
  }
}

async function cdk(args: string[]) {
  try {
    await exec('cdk', args, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, CDK_DISABLE_VERSION_CHECK: '1' } });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message: string };
    const output = `${err.stderr ?? ''}\n${err.stdout ?? ''}`.split('\n').map((l) => l.trim()).filter(Boolean);
    const failures = output.filter((l) => /_FAILED|Resource handler returned|Received response status \[FAILED\]|❌/.test(l));
    const detail = (failures.length > 0 ? failures : output.slice(-15)).slice(0, 12).map((l) => l.slice(0, 400)).join('\n');
    throw new Error(`cdk ${args[0]} failed:\n${detail || err.message}`);
  }
}

/** Calls a URL, signed with SigV4a (region set *) when credentials are given. */
async function call(url: string, creds?: Credentials): Promise<{ status: number; body: any }> {
  const { hostname, pathname } = new URL(url);
  let headers: Record<string, string> = {};
  if (creds) {
    const signer = new SignatureV4a({ service: 'lambda', region: '*', sha256: Sha256, credentials: creds });
    const signed = await signer.sign({ method: 'GET', protocol: 'https:', hostname, path: pathname, headers: { host: hostname } }, { signingRegion: '*' });
    headers = signed.headers as Record<string, string>;
  }
  const res = await fetch(url, { headers });
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch { /* HTML error page */ }
  return { status: res.status, body };
}

/** Retries until the expected status (IAM changes take a few minutes to reach the endpoint). */
async function callUntil(url: string, creds: Credentials | undefined, expected: number, timeoutMs = 240_000) {
  const end = Date.now() + timeoutMs;
  let last = await call(url, creds);
  while (last.status !== expected && Date.now() < end) {
    await sleep(15_000);
    last = await call(url, creds);
  }
  return last;
}

async function assume(roleArn: string): Promise<Credentials> {
  for (let i = 0; ; i++) {
    try {
      const r = await sts.send(new AssumeRoleCommand({ RoleArn: roleArn, RoleSessionName: 'webfn-e2e' }));
      const c = r.Credentials!;
      return { accessKeyId: c.AccessKeyId!, secretAccessKey: c.SecretAccessKey!, sessionToken: c.SessionToken };
    } catch (e) {
      if (i >= 12) throw e;
      await sleep(10_000); // a new role can take a few seconds to become assumable
    }
  }
}

async function adminCredentials(): Promise<Credentials> {
  return credentials();
}

async function logGroup(region: string, name: string) {
  const r = await logsIn(region).send(new DescribeLogGroupsCommand({ logGroupNamePrefix: name }));
  return (r.logGroups ?? []).find((g) => g.logGroupName === name);
}

async function hasEvents(region: string, name: string, marker: string): Promise<boolean> {
  const r = await logsIn(region).send(new FilterLogEventsCommand({ logGroupName: name, filterPattern: `"${marker}"`, limit: 1 })).catch(() => ({ events: [] }));
  return (r.events ?? []).length > 0;
}

/** Every region's .local exists with retention and receives logs; the home aggregate gets every region's streams. */
async function checkLogs(s: Scenario, out: Outputs, regionsWithTraffic: string[]) {
  const base = out.LogGroupName;
  for (const region of JSON.parse(out.Regions) as string[]) {
    const local = await logGroup(region, `${base}.local`);
    s.check(`${region} ${base}.local exists with ${RETENTION_DAYS}-day retention`, local?.retentionInDays === RETENTION_DAYS, `retention=${local?.retentionInDays ?? 'missing'}`);
  }
  const aggregate = await logGroup(HOME, base);
  s.check(`${HOME} aggregate ${base} exists with ${RETENTION_DAYS}-day retention`, aggregate?.retentionInDays === RETENTION_DAYS, `retention=${aggregate?.retentionInDays ?? 'missing'}`);

  // Aggregation lags (up to ~1 min cross-region).
  for (const region of regionsWithTraffic) {
    let local = false; let copied = false;
    for (let i = 0; i < 12 && !(local && copied); i++) {
      local ||= await hasEvents(region, `${base}.local`, 'e2e-request');
      const streams = await logsIn(HOME).send(new DescribeLogStreamsCommand({ logGroupName: base, logStreamNamePrefix: new Date().toISOString().slice(0, 10).replace(/-/g, '/') })).catch(() => ({ logStreams: [] }));
      copied ||= (streams.logStreams ?? []).some((st) => st.logStreamName?.endsWith(`-${region}`));
      if (!(local && copied)) await sleep(10_000);
    }
    s.check(`${region} traffic logged in its .local group`, local);
    s.check(`${region} traffic copied into the home aggregate`, copied);
  }
}

/** After destroy: function gone, and no log group of it in any region (checked twice to catch re-creation). */
async function checkNothingLeft(s: Scenario, out: Outputs) {
  const fns = await web.send(new ListWebFunctionsCommand({}));
  s.check('function deleted', !(fns.functions ?? []).some((f) => f.functionName === out.FunctionName));
  for (const pass of ['right after destroy', 'two minutes later']) {
    if (pass !== 'right after destroy') await sleep(120_000);
    const left: string[] = [];
    for (const region of ALL_REGIONS) {
      const r = await logsIn(region).send(new DescribeLogGroupsCommand({ logGroupNamePrefix: out.LogGroupName }));
      for (const g of r.logGroups ?? []) left.push(`${region}:${g.logGroupName}`);
    }
    s.check(`no log groups left in any region (${pass})`, left.length === 0, left.join(', '));
  }
}

async function checkIamAccess(s: Scenario, url: string, out: Outputs, label: string) {
  const admin = await adminCredentials();
  const consumer = await assume(out.ConsumerRoleArn);
  const outsider = await assume(out.OutsiderRoleArn);
  const unsigned = await call(url);
  s.check(`${label}: unsigned request rejected`, unsigned.status === 403, `status=${unsigned.status}`);
  const signed = await call(url, admin);
  s.check(`${label}: SigV4a-signed request served`, signed.status === 200, `status=${signed.status} region=${signed.body?.region}`);
  const granted = await callUntil(url, consumer, 200);
  s.check(`${label}: role with grants.invoke() is allowed`, granted.status === 200, `status=${granted.status}`);
  const denied = await call(url, outsider);
  s.check(`${label}: role without the grant is denied`, denied.status === 403, `status=${denied.status}`);
  return signed;
}

// ---------------------------------------------------------------------------------------------

async function scenarioPerRegion(): Promise<Scenario> {
  const s = new Scenario('A', 'PER_REGION: deploy, code update, add a region, destroy');
  let ctx: Context = { endpointType: 'PER_REGION', regions: ['us-east-1'] };
  let out: Outputs | undefined;
  try {
    out = await s.deploy(ctx);
    for (const region of JSON.parse(out.Regions) as string[]) {
      const res = await checkIamAccess(s, out[`Url${region.replace(/-/g, '')}`], out, `${region} regional URL`);
      s.check(`${region} regional URL served from ${region}`, res.body?.region === region, `servedBy=${res.body?.region}`);
    }
    await checkLogs(s, out, ['ap-south-1', 'us-east-1']);

    // Code update: a new revision replaces the old one.
    const before = out;
    ctx = { ...ctx, version: 'v2' };
    out = await s.deploy(ctx);
    const v2 = await call(out.Urlapsouth1, await adminCredentials());
    s.check('code update served (v2)', v2.body?.version === 'v2', `version=${v2.body?.version}`);
    s.check('code update created a new revision', out.RevisionId !== before.RevisionId, `${before.RevisionId} -> ${out.RevisionId}`);
    s.check('endpoint URL unchanged by the code update', out.Url === before.Url);
    const revisions = await web.send(new ListWebFunctionRevisionsCommand({ functionName: out.FunctionName }));
    s.check('old revision deleted (one revision left)', (revisions.revisions ?? []).length === 1, `revisions=${(revisions.revisions ?? []).length}`);

    // Add a region: the default endpoint name changes, so the endpoint is replaced cleanly.
    ctx = { ...ctx, regions: ['us-east-1', 'eu-west-1'] };
    const beforeRegions = out;
    out = await s.deploy(ctx);
    s.check('adding a region replaced the endpoint (new name and URL)', out.EndpointName !== beforeRegions.EndpointName && out.Url !== beforeRegions.Url,
      `${beforeRegions.EndpointName} -> ${out.EndpointName}`);
    const endpoints = await web.send(new ListWebFunctionEndpointsCommand({ functionName: out.FunctionName }));
    s.check('old endpoint deleted (one endpoint left)', (endpoints.endpoints ?? []).length === 1, `endpoints=${(endpoints.endpoints ?? []).length}`);
    const eu = await callUntil(out.Urleuwest1, await adminCredentials(), 200, 120_000);
    s.check('new region eu-west-1 serves v2', eu.status === 200 && eu.body?.region === 'eu-west-1' && eu.body?.version === 'v2', `status=${eu.status} region=${eu.body?.region}`);
    await checkLogs(s, out, ['eu-west-1']);
  } catch (e) {
    s.check('scenario ran to completion', false, (e as Error).message);
  } finally {
    await s.destroy(ctx).catch((e) => s.check('destroy', false, (e as Error).message));
    if (out) await checkNothingLeft(s, out);
  }
  return s;
}

async function scenarioMultiRegion(): Promise<Scenario> {
  const s = new Scenario('B', 'MULTI_REGION: global URL, logs in three regions, destroy');
  const ctx: Context = { endpointType: 'MULTI_REGION', regions: ['us-east-1', 'eu-west-1'] };
  let out: Outputs | undefined;
  try {
    out = await s.deploy(ctx);
    s.check('global URL is the lambda-web.global domain', /\.lambda-web\.global\.on\.aws$/.test(new URL(out.Url).hostname), out.Url);
    s.check('endpoint lists all three regions', JSON.stringify(JSON.parse(out.Regions)) === JSON.stringify(['ap-south-1', 'eu-west-1', 'us-east-1']), out.Regions);
    await checkIamAccess(s, out.Url, out, 'global URL');
    await checkLogs(s, out, [HOME]); // from here the global URL routes to the nearest region
  } catch (e) {
    s.check('scenario ran to completion', false, (e as Error).message);
  } finally {
    await s.destroy(ctx).catch((e) => s.check('destroy', false, (e as Error).message));
    if (out) await checkNothingLeft(s, out);
  }
  return s;
}

async function scenarioPublicHome(): Promise<Scenario> {
  const s = new Scenario('C', 'HOME_REGION with auth NONE: public endpoint, destroy');
  const ctx: Context = { endpointType: 'HOME_REGION', regions: [], auth: 'NONE' };
  let out: Outputs | undefined;
  try {
    out = await s.deploy(ctx);
    const res = await call(out.Url);
    s.check('unsigned request served (public endpoint)', res.status === 200 && res.body?.region === HOME, `status=${res.status}`);
    await checkLogs(s, out, [HOME]);
  } catch (e) {
    s.check('scenario ran to completion', false, (e as Error).message);
  } finally {
    await s.destroy(ctx).catch((e) => s.check('destroy', false, (e as Error).message));
    if (out) await checkNothingLeft(s, out);
  }
  return s;
}

async function scenarioNodejs(): Promise<Scenario> {
  const s = new Scenario('D', 'NodejsWebFunction: TypeScript bundled with esbuild, source maps in Lambda');
  const ctx: Context = { endpointType: 'HOME_REGION', regions: [], auth: 'NONE', kind: 'nodejs' };
  let out: Outputs | undefined;
  try {
    out = await s.deploy(ctx);
    const res = await callUntil(out.Url, undefined, 200, 60_000);
    s.check('bundled TypeScript server is served', res.status === 200 && res.body?.ok === true, `status=${res.status}`);
    s.check('bundled AWS SDK client loads (the runtime has none)', res.body?.sdk === 'function', `sdk=${res.body?.sdk}`);
    s.check('CommonJS dependency loads in the ESM bundle (require shim)', res.body?.commonJs === 'object', `commonJs=${res.body?.commonJs}`);
    s.check('stack traces map to the TypeScript source (NODE_OPTIONS=--enable-source-maps)', /server\.ts/.test(res.body?.stack ?? ''),
      String(res.body?.stack ?? '').split('\n')[1]?.trim());
    await checkLogs(s, out, [HOME]);
  } catch (e) {
    s.check('scenario ran to completion', false, (e as Error).message);
  } finally {
    await s.destroy(ctx).catch((e) => s.check('destroy', false, (e as Error).message));
    if (out) await checkNothingLeft(s, out);
  }
  return s;
}

async function main() {
  const all: Record<string, () => Promise<Scenario>> = { A: scenarioPerRegion, B: scenarioMultiRegion, C: scenarioPublicHome, D: scenarioNodejs };
  const selected = process.argv.slice(2).filter((a) => all[a]);
  const run = selected.length > 0 ? selected : Object.keys(all);
  const scenarios = await Promise.all(run.map((id) => all[id]()));

  console.log('\n================ E2E SUMMARY ================');
  for (const s of scenarios) console.log(s.summary());
  const failed = scenarios.flatMap((s) => s.results).filter((r) => !r.ok).length;
  console.log(failed === 0 ? 'ALL PASSED' : `${failed} CHECK(S) FAILED`);
  process.exitCode = failed === 0 ? 0 : 1;
}

void main();
