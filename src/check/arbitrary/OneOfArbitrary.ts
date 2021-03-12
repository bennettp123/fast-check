import { Arbitrary } from './definition/Arbitrary';
import { FrequencyArbitrary } from './FrequencyArbitrary';

/**
 * Infer the type of the Arbitrary produced by {@link oneof}
 * given the type of the source arbitraries
 *
 * @remarks Since 2.2.0
 * @public
 */
export type OneOfValue<Ts extends Arbitrary<unknown>[]> = {
  [K in keyof Ts]: Ts[K] extends Arbitrary<infer U> ? U : never;
}[number];

/**
 * For one of the values generated by `...arbs` - with all `...arbs` equiprobable
 *
 * **WARNING**: It expects at least one arbitrary
 *
 * @param arbs - Arbitraries that might be called to produce a value
 *
 * @remarks Since 0.0.1
 * @public
 */
function oneof<Ts extends Arbitrary<unknown>[]>(...arbs: Ts): Arbitrary<OneOfValue<Ts>> {
  const weightedArbs = (arbs as Arbitrary<OneOfValue<Ts>>[]).map((arbitrary) => ({ arbitrary, weight: 1 }));
  return FrequencyArbitrary.from(weightedArbs, {}, 'fc.oneof');
}

export { oneof };
