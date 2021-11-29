import * as fc from '../../../../lib/fast-check';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';

const truncatedSignal: any = Symbol();

export type ShrinkTree<T> = [T, ShrinkTree<T>[]];

export function buildNextShrinkTree<T>(
  arb: Arbitrary<T>,
  v: NextValue<T>,
  lengthLimiter: { numItems: number } = { numItems: Number.POSITIVE_INFINITY }
): ShrinkTree<T> {
  --lengthLimiter.numItems;
  const value = v.value;
  const context = v.context;
  const shrinks: ShrinkTree<T>[] = [];
  for (const nv of arb.shrink(value, context)) {
    if (lengthLimiter.numItems <= 0) {
      shrinks.push([truncatedSignal, []]);
      break;
    }
    shrinks.push(buildNextShrinkTree(arb, nv, lengthLimiter));
  }
  return [value, shrinks];
}

export function renderTree<T>(tree: ShrinkTree<T>): string[] {
  const [current, subTrees] = tree;
  const lines = [current !== truncatedSignal ? fc.stringify(current) : `\u2026`];
  for (let index = 0; index !== subTrees.length; ++index) {
    const subTree = subTrees[index];
    const isLastSubTree = index === subTrees.length - 1;
    const firstPrefix = isLastSubTree ? '└> ' : '├> ';
    const otherPrefix = isLastSubTree ? '   ' : '|  ';
    const subRender = renderTree(subTree);
    for (let renderedIndex = 0; renderedIndex !== subRender.length; ++renderedIndex) {
      if (renderedIndex === 0) {
        lines.push(`${firstPrefix}${subRender[renderedIndex]}`);
      } else {
        lines.push(`${otherPrefix}${subRender[renderedIndex]}`);
      }
    }
  }
  return lines;
}

export function walkTree<T>(tree: ShrinkTree<T>, visit: (t: T) => void): void {
  visit(tree[0]);
  for (const subTree of tree[1]) {
    walkTree(subTree, visit);
  }
}
