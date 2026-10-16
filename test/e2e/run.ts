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
import { CloudWatchClient, DescribeAlarmsCommand, PutMetricDataCommand, SetAlarmStateCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { GetResourcePolicyCommand, GetWebFunctionEndpointCommand, LambdaWebClient, ListWebFunctionEndpointsCommand, ListWebFunctionRevisionsCommand, ListWebFunctionsCommand } from '@aws-sdk/client-lambda-web';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { AssumeRoleCommand, GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
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
const cloudwatch = new CloudWatchClient({ region: HOME, credentials });
const logsIn = (region: string) => new CloudWatchLogsClient({ region, credentials });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Credentials = { accessKeyId: string; secretAccessKey: string; sessionToken?: string };
type Outputs = Record<string, string>;
interface Context {
  endpointType: string;
  regions: string[];
  auth?: string;
  version?: string;
  kind?: string;
  bundling?: string;
  appVersion?: string;
  retention?: number;
  endpoints?: string;
  stable?: string;
  split?: string;
  deployment?: string;
  fail?: boolean;
  permissions?: string;
}

class Scenario {
  public readonly results: { name: string; ok: boolean; detail: string }[] = [];
  private readonly started = Date.now();

  // A fresh directory per run: on some Docker hosts (OrbStack), a bind mount of a path that was renamed and recreated still
  // points at the old directory, and CDK recreates the same bundling-temp path whenever it synthesizes into the same cdk.out.
  private readonly outdir = path.join(mkdtempSync(path.join(tmpdir(), 'webfn-e2e-')), 'cdk.out');

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
    return ['--app', 'npx tsx test/e2e/app.ts', '--output', this.outdir, '-c', `scenario=${this.id}`, '-c', `endpointType=${ctx.endpointType}`,
      '-c', `regions=${JSON.stringify(ctx.regions)}`, '-c', `auth=${ctx.auth ?? 'AWS_IAM'}`, '-c', `version=${ctx.version ?? 'v1'}`,
      '-c', `kind=${ctx.kind ?? 'web'}`, '-c', `bundling=${ctx.bundling ?? 'local'}`,
      ...Object.entries({
        appVersion: ctx.appVersion,
        retention: ctx.retention,
        endpoints: ctx.endpoints,
        stable: ctx.stable,
        split: ctx.split,
        deployment: ctx.deployment,
        fail: ctx.fail,
        permissions: ctx.permissions,
      })
        .filter(([, v]) => v !== undefined).flatMap(([k, v]) => ['-c', `${k}=${v}`])];
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
  // The stack's own leftovers: the code bucket (emptied by the provider) and the provider's log groups.
  const stackName = `WebFnE2E-${s.id}`;
  const buckets = await new S3Client({ region: HOME, credentials }).send(new ListBucketsCommand({ Prefix: stackName.toLowerCase() }));
  const bucketsLeft = (buckets.Buckets ?? []).map((b) => b.Name!);
  s.check('code bucket deleted', bucketsLeft.length === 0, bucketsLeft.join(', '));
  const providerLogs: string[] = [];
  for (const prefix of [stackName, `/aws/lambda/${stackName}`]) {
    const r = await logsIn(HOME).send(new DescribeLogGroupsCommand({ logGroupNamePrefix: prefix }));
    for (const g of r.logGroups ?? []) providerLogs.push(g.logGroupName!);
  }
  s.check('custom resource provider log groups deleted', providerLogs.length === 0, providerLogs.join(', '));
}

async function revisionIds(functionName: string): Promise<string[]> {
  const r = await web.send(new ListWebFunctionRevisionsCommand({ functionName }));
  return (r.revisions ?? []).map((rev) => rev.revisionId!).sort();
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
  const importer = await assume(out.ImporterRoleArn);
  const imported = await callUntil(url, importer, 200);
  s.check(`${label}: role granted through WebFunction.fromWebFunctionArn() is allowed`, imported.status === 200, `status=${imported.status}`);
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
    s.check('old revision kept as a rollback target', JSON.stringify(await revisionIds(out.FunctionName)) === JSON.stringify([before.RevisionId, out.RevisionId].sort()),
      (await revisionIds(out.FunctionName)).join(', '));

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
  return nodejsScenario(new Scenario('D', 'NodejsWebFunction: TypeScript bundled with esbuild, source maps in Lambda'), 'local');
}

async function scenarioNodejsDocker(): Promise<Scenario> {
  return nodejsScenario(new Scenario('E', 'NodejsWebFunction bundled in Docker (forceDockerBundling)'), 'docker');
}

async function nodejsScenario(s: Scenario, bundling: 'local' | 'docker'): Promise<Scenario> {
  const ctx: Context = { endpointType: 'HOME_REGION', regions: [], auth: 'NONE', kind: 'nodejs', bundling };
  let out: Outputs | undefined;
  try {
    out = await s.deploy(ctx);
    const res = await callUntil(out.Url, undefined, 200, 60_000);
    s.check('bundled TypeScript server is served', res.status === 200 && res.body?.ok === true, `status=${res.status}`);
    s.check('bundled AWS SDK client loads (the runtime has none)', res.body?.sdk === 'function', `sdk=${res.body?.sdk}`);
    s.check('CommonJS dependency loads in the ESM bundle (require shim)', res.body?.commonJs === 'object', `commonJs=${res.body?.commonJs}`);
    s.check('stack traces map to the TypeScript source (NODE_OPTIONS=--enable-source-maps)', /server\.ts/.test(res.body?.stack ?? ''),
      String(res.body?.stack ?? '').split('\n')[1]?.trim());
    s.check('stack traces show the source next to the bundle, not a build-machine path', /\/var\/task\/test\/fixtures\/nodejs\/server\.ts/.test(res.body?.stack ?? ''),
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

async function scenarioEndpointsAndRevisions(): Promise<Scenario> {
  const s = new Scenario('F', 'several endpoints, revision retention, pinning and a 50/50 split');
  const base: Context = { endpointType: 'HOME_REGION', regions: [], endpoints: 'many', retention: 2 };
  let ctx: Context = { ...base, appVersion: 'a1' };
  let out: Outputs | undefined;
  const admin = await adminCredentials();
  const servedBy = async (url: string, signed: boolean) => (await callUntil(url, signed ? admin : undefined, 200, 120_000)).body?.appVersion;
  const checkAllServe = async (o: Outputs, version: string) => {
    s.check(`default endpoint (IAM) serves ${version}`, await servedBy(o.Url, true) === version);
    s.check(`Public endpoint (NONE) serves ${version} unsigned`, await servedBy(o.PublicUrl, false) === version);
    s.check(`Global endpoint (MULTI_REGION, IAM) serves ${version}`, await servedBy(o.GlobalUrl, true) === version);
  };
  try {
    // 1. Three endpoints on one revision.
    out = await s.deploy(ctx);
    const r1 = out.RevisionId;
    await checkAllServe(out, 'a1');
    const endpoints = await web.send(new ListWebFunctionEndpointsCommand({ functionName: out.FunctionName }));
    s.check('three endpoints', (endpoints.endpoints ?? []).length === 3, (endpoints.endpoints ?? []).map((e) => e.endpointName).join(', '));
    const consumer = await assume(out.ConsumerRoleArn);
    s.check('Global endpoint: role with endpoint.grantInvoke() is allowed', (await callUntil(out.GlobalUrl, consumer, 200)).status === 200);
    const unsignedGlobal = await call(out.GlobalUrl);
    s.check('Global endpoint: unsigned request rejected', unsignedGlobal.status === 403, `status=${unsignedGlobal.status}`);
    const usLocal = await logGroup('us-east-1', `${out.LogGroupName}.local`);
    s.check('us-east-1 .local group owned for the added endpoint', usLocal?.retentionInDays === RETENTION_DAYS, `retention=${usLocal?.retentionInDays ?? 'missing'}`);

    // 2. A new revision; the previous one is kept.
    ctx = { ...base, appVersion: 'a2' };
    out = await s.deploy(ctx);
    const r2 = out.RevisionId;
    await checkAllServe(out, 'a2');
    s.check('revisions after 2 deploys: both kept', JSON.stringify(await revisionIds(out.FunctionName)) === JSON.stringify([r1, r2].sort()), (await revisionIds(out.FunctionName)).join(', '));

    // 3. Pin a Stable endpoint to r1 and split the default endpoint 50/50 between r2 and the new r3.
    ctx = { ...base, appVersion: 'a3', stable: r1, split: r2 };
    out = await s.deploy(ctx);
    const r3 = out.RevisionId;
    s.check('Stable endpoint pinned to the first revision serves a1', await servedBy(out.StableUrl, false) === 'a1');
    s.check('Public endpoint follows the current revision (a3)', await servedBy(out.PublicUrl, false) === 'a3');
    const seen = new Set<string>();
    for (let i = 0; i < 24; i++) seen.add((await call(out.Url, admin)).body?.appVersion);
    s.check('default endpoint splits traffic between a2 and a3', seen.has('a2') && seen.has('a3') && seen.size === 2, [...seen].join(', '));
    s.check('revisions in use are kept beyond revisionRetention (3 > 2)', JSON.stringify(await revisionIds(out.FunctionName)) === JSON.stringify([r1, r2, r3].sort()),
      (await revisionIds(out.FunctionName)).join(', '));

    // 4. Remove the pin and the split: the previous deployment's revisions stay (rollback targets).
    ctx = { ...base, appVersion: 'a4' };
    out = await s.deploy(ctx);
    const r4 = out.RevisionId;
    await checkAllServe(out, 'a4');
    const afterUnpin = await web.send(new ListWebFunctionEndpointsCommand({ functionName: out.FunctionName }));
    s.check('Stable endpoint deleted', (afterUnpin.endpoints ?? []).length === 3);
    s.check('the previous deployment\'s revisions are kept as rollback targets', JSON.stringify(await revisionIds(out.FunctionName)) === JSON.stringify([r1, r2, r3, r4].sort()),
      (await revisionIds(out.FunctionName)).join(', '));

    // 5. Next deployment: only the newest 2 remain.
    ctx = { ...base, appVersion: 'a5' };
    out = await s.deploy(ctx);
    await checkAllServe(out, 'a5');
    s.check('cleanup keeps the newest revisionRetention (2)', JSON.stringify(await revisionIds(out.FunctionName)) === JSON.stringify([r4, out.RevisionId].sort()),
      (await revisionIds(out.FunctionName)).join(', '));
  } catch (e) {
    s.check('scenario ran to completion', false, (e as Error).message);
  } finally {
    await s.destroy(ctx).catch((e) => s.check('destroy', false, (e as Error).message));
    if (out) await checkNothingLeft(s, out);
  }
  return s;
}

/** An endpoint's weights (`rev:weight,...`), and whether every region has applied them. */
async function endpointWeights(functionName: string, endpointName: string) {
  const e = await web.send(new GetWebFunctionEndpointCommand({ functionName, endpointName }));
  const key = (ws?: { revisionId?: string; weight?: number }[]) => (ws ?? []).map((w) => `${w.revisionId}:${w.weight}`).sort().join(',');
  const weights = key(e.revisionWeights);
  const regions = Object.values(e.regionalEndpoints ?? {});
  // An endpoint that was never updated may report no update status, and its regions no weights.
  const done = (status?: string) => status === undefined || status === 'Successful';
  const settled = done(e.updateStatus)
    && regions.every((r) => done(r.updateStatus) && (!r.revisionWeights?.length || key(r.revisionWeights) === weights));
  return { weights, settled, status: e.updateStatus, regions: regions.length };
}

/** Records every distinct (settled) weight state of the endpoints while `during` runs, starting with `initial`. */
async function watchWeights(functionName: string, initial: Map<string, string>, during: Promise<unknown>) {
  const endpointNames = [...initial.keys()];
  const seen = new Map<string, string[]>(endpointNames.map((n) => [n, [initial.get(n)!]]));
  let done = false;
  const finished = during.finally(() => { done = true; });
  while (!done) {
    for (const name of endpointNames) {
      const w = await endpointWeights(functionName, name).catch(() => undefined);
      const states = seen.get(name)!;
      if (w?.settled && states[states.length - 1] !== w.weights) states.push(w.weights);
    }
    await Promise.race([sleep(5_000), finished.catch(() => {})]);
  }
  return seen;
}

async function scenarioProgressive(): Promise<Scenario> {
  const s = new Scenario('G', 'progressive deployments: canary (MULTI_REGION) and linear endpoints, rollback on an alarm');
  const base: Context = { endpointType: 'MULTI_REGION', regions: ['us-east-1'], deployment: 'progressive' };
  let ctx: Context = { ...base, appVersion: 'g1' };
  let out: Outputs | undefined;
  const admin = await adminCredentials();
  const versions = async (url: string, signed: boolean, n: number) => {
    const seen = new Set<string>();
    for (let i = 0; i < n; i++) seen.add((await call(url, signed ? admin : undefined)).body?.appVersion);
    return [...seen].sort();
  };
  try {
    // 1. First deploy: no previous revision, so both endpoints are created serving it.
    let started = Date.now();
    out = await s.deploy(ctx);
    const r1 = out.RevisionId;
    s.check('first deploy: default (canary) endpoint serves g1', JSON.stringify(await versions(out.Url, true, 3)) === '["g1"]');
    s.check('first deploy: Public (linear) endpoint serves g1', JSON.stringify(await versions(out.PublicUrl, false, 3)) === '["g1"]');
    s.check('first deploy does not wait for a bake', Date.now() - started < 8 * 60_000, `${Math.round((Date.now() - started) / 1000)}s`);

    // 2. A new revision: the default endpoint runs a 20% canary for 2 minutes, Public moves 50% a minute.
    ctx = { ...base, appVersion: 'g2' };
    const initial = new Map<string, string>();
    for (const name of [out.EndpointName, out.PublicEndpointName]) {
      const w = await endpointWeights(out.FunctionName, name);
      s.log(`${name} before the deployment: ${w.weights} (status ${w.status ?? 'none'})`);
      initial.set(name, w.weights);
    }
    started = Date.now();
    const deploying = s.deploy(ctx);
    const sampled = (async () => {
      // During the canary: sample the default endpoint once every region has the 80/20 split.
      for (let i = 0; i < 60; i++) {
        const w = await endpointWeights(out!.FunctionName, out!.EndpointName);
        if (w.settled && /:20/.test(w.weights)) return versions(out!.Url, true, 30);
        await sleep(5_000);
      }
      return [];
    })();
    const seen = await watchWeights(out.FunctionName, initial, deploying);
    out = await deploying;
    const r2 = out.RevisionId;
    const elapsed = Math.round((Date.now() - started) / 1000);
    s.check('canary: the default endpoint went 100 → 80/20 → 100 in every region',
      JSON.stringify(seen.get(out.EndpointName)) === JSON.stringify([`${r1}:100`, [`${r1}:80`, `${r2}:20`].sort().join(','), `${r2}:100`]),
      (seen.get(out.EndpointName) ?? []).join(' → '));
    s.check('canary: both revisions served during the bake', JSON.stringify(await sampled) === '["g1","g2"]', (await sampled).join(', '));
    s.check('linear: Public went 100 → 50/50 → 100',
      JSON.stringify(seen.get(out.PublicEndpointName)) === JSON.stringify([`${r1}:100`, [`${r1}:50`, `${r2}:50`].sort().join(','), `${r2}:100`]),
      (seen.get(out.PublicEndpointName) ?? []).join(' → '));
    s.check('the deployment waited for the 2-minute bake', elapsed >= 120, `${elapsed}s`);
    s.check('after the deployment both endpoints serve g2',
      JSON.stringify(await versions(out.Url, true, 5)) === '["g2"]' && JSON.stringify(await versions(out.PublicUrl, false, 5)) === '["g2"]');

    // 3. Another revision, rolled back by the alarm during the canary.
    const before = out;
    ctx = { ...base, appVersion: 'g3' };
    const failing = s.deploy(ctx).then(() => undefined, (e: Error) => e);
    let alarmed = false;
    for (let i = 0; i < 60 && !alarmed; i++) {
      const w = await endpointWeights(before.FunctionName, before.EndpointName);
      if (w.settled && /:20/.test(w.weights)) {
        // A breaching data point keeps the alarm in ALARM; setting the state makes it immediate (alarms evaluate once a minute).
        await cloudwatch.send(new PutMetricDataCommand({ Namespace: 'WebFnE2E/G', MetricData: [{ MetricName: 'ForcedErrors', Value: 5 }] }));
        await cloudwatch.send(new SetAlarmStateCommand({ AlarmName: before.AlarmName, StateValue: 'ALARM', StateReason: 'e2e: forced rollback' }));
        alarmed = true;
        s.log(`canary at ${w.weights}: alarm ${before.AlarmName} forced into ALARM`);
      } else {
        await sleep(5_000);
      }
    }
    const error = await failing;
    s.check('the alarm failed the deployment', alarmed && error !== undefined && /went into ALARM/.test(error.message), (error?.message ?? 'deploy succeeded').split('\n').slice(0, 3).join(' | '));
    const after = await endpointWeights(before.FunctionName, before.EndpointName);
    const pubAfter = await endpointWeights(before.FunctionName, before.PublicEndpointName);
    s.check('rollback: the default endpoint is back on g2 in every region', after.settled && after.weights === `${r2}:100`, after.weights);
    s.check('rollback: Public is back on g2 in every region', pubAfter.settled && pubAfter.weights === `${r2}:100`, pubAfter.weights);
    s.check('rollback: both endpoints serve g2',
      JSON.stringify(await versions(before.Url, true, 10)) === '["g2"]' && JSON.stringify(await versions(before.PublicUrl, false, 10)) === '["g2"]');
    ctx = { ...base, appVersion: 'g2' };
  } catch (e) {
    s.check('scenario ran to completion', false, (e as Error).message);
  } finally {
    await s.destroy(ctx).catch((e) => s.check('destroy', false, (e as Error).message));
    if (out) await checkNothingLeft(s, out);
  }
  return s;
}

async function alarmsNamed(region: string, names: string[]) {
  const r = await new CloudWatchClient({ region, credentials }).send(new DescribeAlarmsCommand({ AlarmNames: names }));
  return r.MetricAlarms ?? [];
}

async function scenarioRollbackOn(): Promise<Scenario> {
  const s = new Scenario('H', 'rollbackOn: endpoint alarms in every region, a real 5XX rate rolls a canary back');
  const base: Context = { endpointType: 'MULTI_REGION', regions: ['us-east-1'], deployment: 'rollbackOn' };
  let ctx: Context = { ...base, appVersion: 'h1' };
  let out: Outputs | undefined;
  let remoteAlarm = '';
  const admin = await adminCredentials();
  try {
    // 1. First deploy: the endpoint's alarms exist at home and in us-east-1.
    out = await s.deploy(ctx);
    const r1 = out.RevisionId;
    remoteAlarm = `LambdaWeb-${out.FunctionName}-${out.EndpointName}-5xx-rate`;
    const [home] = await alarmsNamed(HOME, [out.HomeRollbackAlarm]);
    s.check('home-region rollback alarm exists', home?.Threshold === 10 && home?.EvaluationPeriods === 1, `${home?.AlarmName} threshold=${home?.Threshold}`);
    const [remote] = await alarmsNamed('us-east-1', [remoteAlarm]);
    s.check('us-east-1 rollback alarm exists with the same rule', remote?.Threshold === 10
      && (remote?.Metrics ?? []).some((m) => m.Expression === 'IF(requests >= 5, 100 * FILL(errors, 0) / requests, 0)'), remote?.AlarmName ?? 'missing');
    s.check('first deploy serves h1', (await callUntil(out.Url, admin, 200, 120_000)).body?.appVersion === 'h1');

    // 2. A revision that answers 500: the canary sends it half the traffic until the 5XX alarm rolls it back.
    const before = out;
    ctx = { ...base, appVersion: 'h2', fail: true };
    const started = Date.now();
    let settled = false;
    const failing = s.deploy(ctx).then(() => undefined, (e: Error) => e).finally(() => { settled = true; });
    const statuses: Record<string, number> = {};
    while (!settled) {
      const res = await call(before.Url, admin).catch(() => ({ status: 0, body: undefined }));
      const key = `${res.status} ${res.body?.appVersion ?? '-'}`;
      statuses[key] = (statuses[key] ?? 0) + 1;
      await sleep(300);
    }
    const error = await failing;
    const minutes = Math.round((Date.now() - started) / 6000) / 10;
    s.log(`traffic during the canary: ${JSON.stringify(statuses)}`);
    s.check('the failing revision served 500s during the canary', (statuses['500 h2'] ?? 0) > 0, JSON.stringify(statuses));
    s.check('the endpoint\'s own 5XX alarm failed the deployment', error !== undefined && /went into ALARM/.test(error.message) && error.message.includes(before.HomeRollbackAlarm),
      (error?.message ?? 'deploy succeeded').split('\n').slice(0, 3).join(' | '));
    s.check('it rolled back before the 8-minute bake ended', minutes < 11, `${minutes} min`);
    const after = await endpointWeights(before.FunctionName, before.EndpointName);
    s.check('rollback: the endpoint is back on the first revision in every region', after.settled && after.weights === `${r1}:100`, after.weights);
    const served = await call(before.Url, admin);
    s.check('rollback: serves h1 again', served.status === 200 && served.body?.appVersion === 'h1', `${served.status} ${served.body?.appVersion}`);
    ctx = { ...base, appVersion: 'h1' };
  } catch (e) {
    s.check('scenario ran to completion', false, (e as Error).message);
  } finally {
    await s.destroy(ctx).catch((e) => s.check('destroy', false, (e as Error).message));
    if (out) {
      await checkNothingLeft(s, out);
      s.check('rollback alarms deleted at home and in us-east-1',
        (await alarmsNamed(HOME, [out.HomeRollbackAlarm])).length === 0 && (await alarmsNamed('us-east-1', [remoteAlarm])).length === 0);
    }
  }
  return s;
}

async function resourcePolicySids(functionArn: string): Promise<string[] | undefined> {
  try {
    const r = await web.send(new GetResourcePolicyCommand({ resourceArn: functionArn }));
    return JSON.parse(r.policy!).Statement.map((s: { Sid?: string }) => s.Sid ?? '(none)');
  } catch (e) {
    if ((e as Error).name === 'ResourceNotFoundException') return undefined;
    throw e;
  }
}

async function scenarioResourcePolicy(): Promise<Scenario> {
  const s = new Scenario('P', 'resource policy: addPermission, service grants, removal');
  let ctx: Context = { endpointType: 'PER_REGION', regions: ['us-east-1'], permissions: 'on' };
  let out: Outputs | undefined;
  try {
    out = await s.deploy(ctx);
    const functionArn = `arn:aws:lambda:${HOME}:${(await sts.send(new GetCallerIdentityCommand({}))).Account}:web-function/${out.FunctionName}`;
    const sids = await resourcePolicySids(functionArn);
    s.check('one resource policy with every statement (Sid from addPermission; none from a grant)',
      JSON.stringify(sids) === JSON.stringify(['E2eCaller', 'Cdn', '(none)']), `sids=${JSON.stringify(sids)}`);
    const caller = await assume(out.PolicyCallerRoleArn);
    const outsider = await assume(out.OutsiderRoleArn);
    for (const region of ['ap-south-1', 'us-east-1']) {
      const url = out[`Url${region.replace(/-/g, '')}`];
      const allowed = await callUntil(url, caller, 200, 120_000);
      s.check(`${region}: role allowed only by the resource policy is served`, allowed.status === 200, `status=${allowed.status}`);
      const denied = await call(url, outsider);
      s.check(`${region}: role in neither policy is denied`, denied.status === 403, `status=${denied.status}`);
    }

    // Removing every statement deletes the policy, and the caller loses access in every region.
    ctx = { ...ctx, permissions: 'none' };
    out = await s.deploy(ctx);
    s.check('no statements left: resource policy deleted', (await resourcePolicySids(functionArn)) === undefined);
    for (const region of ['ap-south-1', 'us-east-1']) {
      const revoked = await callUntil(out[`Url${region.replace(/-/g, '')}`], caller, 403, 120_000);
      s.check(`${region}: caller denied once the policy is gone`, revoked.status === 403, `status=${revoked.status}`);
    }
  } catch (e) {
    s.check('scenario ran to completion', false, (e as Error).message);
  } finally {
    await s.destroy(ctx).catch((e) => s.check('destroy', false, (e as Error).message));
    if (out) await checkNothingLeft(s, out);
  }
  return s;
}

async function main() {
  const all: Record<string, () => Promise<Scenario>> = {
    A: scenarioPerRegion,
    B: scenarioMultiRegion,
    C: scenarioPublicHome,
    D: scenarioNodejs,
    E: scenarioNodejsDocker,
    F: scenarioEndpointsAndRevisions,
    G: scenarioProgressive,
    H: scenarioRollbackOn,
    P: scenarioResourcePolicy,
  };
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
