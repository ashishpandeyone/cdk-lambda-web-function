import { PropertyInjectors } from 'aws-cdk-lib';
import type { Construct, IConstruct } from 'constructs';

/**
 * Applies the nearest property injector registered for `uniqueId` above `scope` (`PropertyInjectors.of(app).add(...)`),
 * the same lookup aws-cdk-lib's own constructs do through their `@propertyInjectable` decorator.
 */
export function injectProps<T>(uniqueId: string, props: T, scope: Construct, id: string): T {
  for (let c: IConstruct | undefined = scope; c !== undefined; c = c.node.scope) {
    if (!PropertyInjectors.hasPropertyInjectors(c)) continue;
    const injector = PropertyInjectors.of(c).for(uniqueId);
    if (injector) return injector.inject(props, { scope, id });
  }
  return props;
}
