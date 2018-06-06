import Random from '../../../random/generator/Random';
import Stream from '../../../stream/Stream';
import Shrinkable from './Shrinkable';

/**
 * Abstract class able to generate values on type `T`
 *
 * The values generated by an instance of Arbitrary can be previewed - with {@link sample}
 * - or classified - with {@link statistics}.
 */
export default abstract class Arbitrary<T> {
  /**
   * Generate a value of type `T` along with its shrink method
   * based on the provided random number generator
   *
   * @param mrng Random number generator
   * @returns Random value of type `T` and its shrinker
   */
  abstract generate(mrng: Random): Shrinkable<T>;

  /**
   * Create another arbitrary by filtering values against `predicate`
   *
   * All the values produced by the resulting arbitrary
   * satisfy `predicate(value) == true`
   *
   * @example
   * ```typescript
   * const integerGenerator: Arbitrary<number> = ...;
   * const evenIntegerGenerator: Arbitrary<number> = integerGenerator.filter(e => e % 2 === 0);
   * // new Arbitrary only keeps even values
   * ```
   *
   * @param predicate Predicate, to test each produced element. Return true to keep the element, false otherwise
   * @returns New arbitrary filtered using predicate
   */
  filter(predicate: (t: T) => boolean): Arbitrary<T> {
    const arb = this;
    return new class extends Arbitrary<T> {
      generate(mrng: Random): Shrinkable<T> {
        let g = arb.generate(mrng);
        while (!predicate(g.value)) {
          g = arb.generate(mrng);
        }
        return g.filter(predicate);
      }
      withBias(freq: number) {
        return arb.withBias(freq).filter(predicate);
      }
    }();
  }

  /**
   * Create another arbitrary by mapping all produced values using the provided `mapper`
   * Values produced by the new arbitrary are the result of applying `mapper` value by value
   *
   * @example
   * ```typescript
   * const rgbChannels: Arbitrary<{r:number,g:number,b:number}> = ...;
   * const color: Arbitrary<string> = rgbChannels.map(ch => `#${(ch.r*65536 + ch.g*256 + ch.b).toString(16).padStart(6, '0')}`);
   * // transform an Arbitrary producing {r,g,b} integers into an Arbitrary of '#rrggbb'
   * ```
   *
   * @param mapper Map function, to produce a new element based on an old one
   * @returns New arbitrary with mapped elements
   */
  map<U>(mapper: (t: T) => U): Arbitrary<U> {
    const arb = this;
    return new class extends Arbitrary<U> {
      generate(mrng: Random): Shrinkable<U> {
        return arb.generate(mrng).map(mapper);
      }
      withBias(freq: number): Arbitrary<U> {
        return arb.withBias(freq).map(mapper);
      }
    }();
  }

  /**
   * Create another arbitrary by mapping a value from a base Arbirary using the provided `fmapper`
   * Values produced by the new arbitrary are the result of the arbitrary generated by applying `fmapper` to a value
   * @example
   * ```typescript
   * const arrayAndLimitArbitrary = fc.nat().chain((c: number) => fc.tuple( fc.array(fc.nat(c)), fc.constant(c)));
   * ```
   *
   * @param fmapper Then function, to produce a new Arbitrary using a value from another Arbitrary
   * @returns New arbitrary of new type
   */
  chain<U>(fmapper: (t: T) => Arbitrary<U>): Arbitrary<U> {
    const arb = this;
    return new class extends Arbitrary<U> {
      generate(mrng: Random): Shrinkable<U> {
        const stepMrng = mrng.clone();
        const base = arb.generate(stepMrng);
        const mappedArb = fmapper(base.value);
        return mappedArb.generate(stepMrng);
      }
      withBias(freq: number): Arbitrary<U> {
        return arb.withBias(freq).chain(fmapper);
      }
    }();
  }

  /**
   * Create another Arbitrary with no shrink values
   *
   * @example
   * ```typescript
   * const dataGenerator: Arbitrary<string> = ...;
   * const unshrinkableDataGenerator: Arbitrary<string> = dataGenerator.noShrink();
   * // same values no shrink
   * ```
   *
   * @returns Create another arbitrary with no shrink values
   */
  noShrink(): Arbitrary<T> {
    const arb = this;
    return new class extends Arbitrary<T> {
      generate(mrng: Random): Shrinkable<T> {
        return new Shrinkable(arb.generate(mrng).value);
      }
      withBias(freq: number) {
        return arb.withBias(freq).noShrink();
      }
    }();
  }

  /**
   * Create another Arbitrary having bias - by default return itself
   *
   * @param freq The biased version will be used one time over freq - if it exists - freq must be superior or equal to 2 to avoid any lock
   */
  withBias(freq: number): Arbitrary<T> {
    return this;
  }

  /**
   * Create another Arbitrary that cannot be biased
   *
   * @param freq The biased version will be used one time over freq - if it exists
   */
  noBias(): Arbitrary<T> {
    const arb = this;
    return new class extends Arbitrary<T> {
      generate(mrng: Random): Shrinkable<T> {
        return arb.generate(mrng);
      }
    }();
  }
}

export { Arbitrary };
