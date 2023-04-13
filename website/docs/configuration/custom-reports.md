---
slug: /configuration/custom-reports
---

# Custom Reports

Customize how to report failures.

## Default Report

When failing `assert` automatically format the errors for you, with something like:

```txt
**FAIL**  sort.test.mjs > should sort numeric elements from the smallest to the largest one
Error: Property failed after 1 tests
{ seed: -1819918769, path: "0:...:3", endOnFailure: true }
Counterexample: [[2,1000000000]]
Shrunk 66 time(s)
Got error: AssertionError: expected 1000000000 to be less than or equal to 2
```

While easily redeable, you may want to format it differently. Explaining how you can do that is the aim of this page.

:::info How to read such reports?
If you want to know more concerning how to read such reports, you may refer to the [Read Test Reports](/docs/tutorials/quick-start/read-test-reports) section of our [Quick Start](/docs/category/quick-start) tutorial.
:::

## Verbosity

The simplest and built-in way to change how to format the errors in a different way is verbosity. Verbosity can be either 0, 1 or 2 and is defaulted to 1. It can be changed at `assert`'s level, by passing the option `verbose: <your-value>` to it.

You may refer to [Read Test Reports](/docs/tutorials/quick-start/read-test-reports#how-to-increase-verbosity) for more details on it.

## New Reporter

In some cases you might be interested into fully customizing, extending or even changing what should be a failure or how it should be formated. You can define your own reporting strategy by passing a custom reporter to `assert` as follow:

```javascript
fc.assert(
  // You can either use it with `fc.property`
  // or `fc.asyncProperty`
  fc.property(...),
  {
    reporter(out) {
      // Let's say we want to re-create the default reporter of `assert`
      if (out.failed) {
        // `defaultReportMessage` is an utility that make you able to have the exact
        // same report as the one that would have been generated by `assert`
        throw new Error(fc.defaultReportMessage(out));
      }
    }
  }
)
```

In case your reporter is relying on asynchronous code, you can specify it by setting `asyncReporter` instead of `reporter`.
Contrary to `reporter` that will be used for both synchronous and asynchronous properties, `asyncReporter` is forbidden for synchronous properties and makes them throw.

:::info Before `reporter` and `asyncReporter`
In the past, writing your own reporter would have been done as follow:

```js
const throwIfFailed = (out) => {
  if (out.failed) {
    throw new Error(fc.defaultReportMessage(out));
  }
};
const myCustomAssert = (property, parameters) => {
  const out = fc.check(property, parameters);

  if (property.isAsync()) {
    return out.then((runDetails) => {
      throwIfFailed(runDetails);
    });
  }
  throwIfFailed(out);
};
```

:::

## CodeSandbox Reporter

In some situations, it can be useful to directly publish a minimal reproduction of an issue in order to be able to play with it. Custom reporters can be used to provide such capabilities.

For instance, you can automatically generate CodeSandbox environments in case of failed property with the snippet below:

```js
import { getParameters } from 'codesandbox/lib/api/define';

const buildCodeSandboxReporter = (createFiles) => {
  return function reporter(runDetails) {
    if (!runDetails.failed) {
      return;
    }
    const counterexample = runDetails.counterexample;
    const originalErrorMessage = fc.defaultReportMessage(runDetails);
    if (counterexample === undefined) {
      throw new Error(originalErrorMessage);
    }
    const files = {
      ...createFiles(counterexample),
      'counterexample.js': {
        content: `export const counterexample = ${fc.stringify(counterexample)}`
      },
      'report.txt': {
        content: originalErrorMessage
      }
    }
    const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${getParameters({ files })}`;
    throw new Error(`${originalErrorMessage}\n\nPlay with the failure here: ${url}`);
  }
}

fc.assert(
  fc.property(...),
  {
    reporter: buildCodeSandboxReporter(counterexample => ({
      'index.js': {
        content: 'console.log("Code to reproduce the issue")'
      }
    }))
  }
)
```

:::info CodeSandbox documentation
The official documentation explaining how to build CodeSandbox environments from an url is available here: https://codesandbox.io/docs/importing#get-request.
:::