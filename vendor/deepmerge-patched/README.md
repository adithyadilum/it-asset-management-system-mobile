# deepmerge security backport

Source: the `dist/cjs.js` distribution of `deepmerge@4.3.1` (https://github.com/TehShrike/deepmerge), under the included MIT licence. The public API and clone/customMerge/arrayMerge behavior are preserved.

Advisory: https://github.com/advisories/GHSA-gcqx-w48m-w2h4. Upstream has no published fixed release as of 2026-11-06.

The security change adds `setOwnProperty` and replaces all three `destination[key] = value` assignments with descriptor-based own-property definitions. This covers copying target keys as well as merging source keys, preventing an own `__proto__` property from invoking the prototype setter. The existing upstream unsafe-property checks remain in place.

Regression tests use the actual merge implementation resolved by `jest-config`, including poisoned target/source objects, nested clones, arrays, symbols and custom array merging. Run `npm run test:dependencies`.

Remove this local package and its override after Jest can consume an upstream fixed implementation and the regression tests still pass. Do not substitute an unpatched older release just to change the audit result.
