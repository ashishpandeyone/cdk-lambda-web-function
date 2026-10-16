import { Duration, Token } from 'aws-cdk-lib';
import type * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

/** Longest total wait of a deployment: the deployment step must finish within CloudFormation's 1-hour custom resource limit. */
const MAX_TOTAL_WAIT_MINUTES = 45;
/** Most traffic steps: each one also waits for the endpoint to update in every region. */
const MAX_STEPS = 20;

/**
 * Options for a canary deployment.
 */
export interface WebFunctionCanaryDeploymentOptions {
  /**
   * The share of traffic, in whole percent (1-99), that the new revision gets first.
   */
  readonly percent: number;

  /**
   * How long the new revision serves `percent` before it gets all traffic (1-45 minutes).
   * Make it longer than the time your alarms need to fire (period × evaluation periods).
   */
  readonly bake: Duration;

  /**
   * Alarms that stop the deployment: if one is in ALARM, the endpoint goes back to the previous
   * revision and the deployment fails, so CloudFormation rolls the stack back.
   *
   * They're checked before traffic moves, during the bake, and once the new revision has all traffic.
   * Use alarms in any region (by ARN), including composite alarms.
   *
   * @default - no alarms: traffic moves on a timer
   */
  readonly alarms?: cloudwatch.IAlarm[];
}

/**
 * Options for a linear deployment.
 */
export interface WebFunctionLinearDeploymentOptions {
  /**
   * The share of traffic, in whole percent (5-50), that moves to the new revision at each step.
   */
  readonly percent: number;

  /**
   * How long each step serves before the next one (at least 1 minute, and at most 45 minutes in total).
   */
  readonly interval: Duration;

  /**
   * Alarms that stop the deployment: if one is in ALARM, the endpoint goes back to the previous
   * revision and the deployment fails, so CloudFormation rolls the stack back.
   *
   * They're checked before traffic moves, during every step, and once the new revision has all traffic.
   * Use alarms in any region (by ARN), including composite alarms.
   *
   * @default - no alarms: traffic moves on a timer
   */
  readonly alarms?: cloudwatch.IAlarm[];
}

/**
 * How an endpoint moves its traffic to a new revision.
 */
export class WebFunctionDeployment {
  /**
   * All traffic moves to the new revision at once, as soon as it's ready (the default).
   */
  public static allAtOnce(): WebFunctionDeployment {
    return new WebFunctionDeployment('allAtOnce', [100], 0, []);
  }

  /**
   * The new revision first gets `percent` of the traffic for `bake`, then all of it.
   */
  public static canary(options: WebFunctionCanaryDeploymentOptions): WebFunctionDeployment {
    const percent = wholePercent('canary', 'percent', options.percent, 1, 99);
    const bake = minutes('canary', 'bake', options.bake, MAX_TOTAL_WAIT_MINUTES);
    return new WebFunctionDeployment('canary', [percent, 100], bake.toSeconds(), options.alarms ?? []);
  }

  /**
   * The new revision gets `percent` more of the traffic every `interval` until it has all of it.
   */
  public static linear(options: WebFunctionLinearDeploymentOptions): WebFunctionDeployment {
    const percent = wholePercent('linear', 'percent', options.percent, 100 / MAX_STEPS, 50);
    const interval = minutes('linear', 'interval', options.interval, MAX_TOTAL_WAIT_MINUTES);
    const steps: number[] = [];
    for (let p = percent; p < 100; p += percent) steps.push(p);
    steps.push(100);
    const total = interval.toSeconds() * (steps.length - 1);
    if (total > MAX_TOTAL_WAIT_MINUTES * 60) {
      throw new Error(`WebFunctionDeployment.linear: ${steps.length - 1} intervals of ${interval.toHumanString()} take ${total / 60} minutes; at most ${MAX_TOTAL_WAIT_MINUTES} are allowed`);
    }
    return new WebFunctionDeployment('linear', steps, interval.toSeconds(), options.alarms ?? []);
  }

  /**
   * The new revision's share of traffic at each step, in percent; the last is 100.
   *
   * @internal
   */
  public readonly _steps: number[];

  /**
   * Seconds each step serves before the next.
   *
   * @internal
   */
  public readonly _waitSeconds: number;

  /** @internal */
  public readonly _alarms: cloudwatch.IAlarm[];

  /** @internal */
  public readonly _kind: string;

  private constructor(kind: string, steps: number[], waitSeconds: number, alarms: cloudwatch.IAlarm[]) {
    this._kind = kind;
    this._steps = steps;
    this._waitSeconds = waitSeconds;
    this._alarms = alarms;
  }

  /**
   * Whether traffic moves in steps (canary or linear) rather than all at once.
   *
   * @internal
   */
  public get _gradual(): boolean {
    return this._steps.length > 1;
  }
}

function wholePercent(kind: string, name: string, value: number, min: number, max: number): number {
  if (Token.isUnresolved(value) || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`WebFunctionDeployment.${kind}: ${name} must be a whole number from ${Math.ceil(min)} to ${max}, got ${value}`);
  }
  return value;
}

function minutes(kind: string, name: string, value: Duration, maxMinutes: number): Duration {
  const seconds = value.toSeconds();
  if (Token.isUnresolved(seconds) || seconds < 60 || seconds > maxMinutes * 60) {
    throw new Error(`WebFunctionDeployment.${kind}: ${name} must be from 1 to ${maxMinutes} minutes, got ${Token.isUnresolved(seconds) ? 'a token' : value.toHumanString()}`);
  }
  return Duration.seconds(seconds);
}
