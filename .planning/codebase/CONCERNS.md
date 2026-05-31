# Codebase Concerns

**Analysis Date:** 2026-05-31

---

## CORR-01: Memo Comparator — VERIFIED FIXED

`src/Forger/Forger.tsx` lines 81–108: the `MemorizeController` comparator correctly returns `false` (trigger re-render) when dependencies change, form state changes, or other props change, and returns `true` (skip render) otherwise. The fix is in place. This issue is closed.

---

## CORR-02: `<Forge>` Renders a `<div>`, Not a `<form>`

**Severity:** High

**Evidence:** `src/Forge/Forge.tsx` line 253:
```tsx
<div className={className}>
  {renderFieldProps}
  {updatedChildren}
  ...
</div>
```

**Impact:**
- No browser-native form submission. Pressing Enter inside an input does not submit the form on any browser.
- No `action` / `method` semantics; the component cannot function as a progressive-enhancement form.
- Screen readers do not identify the form region as a landmark, harming accessibility (WCAG 1.3.1, 4.1.2).
- `type="submit"` buttons injected by the component (line 96) fire `onClick` handlers but never trigger `HTMLFormElement.submit()`, so native browser validation (`required`, `pattern`, etc.) is never invoked.
- Password managers may not recognise the field group as a login or registration form.

**Fix approach:** Replace `<div>` with `<form>`, wire `onSubmit={control.handleSubmit(onSubmit)}` on the element, and change injected submit buttons to omit the `onClick` override (let the form's native submit bubble). Remove the `useImperativeHandle` workaround for `onSubmit` once the form element handles it natively.

---

## CORR-03: `Slot` Error Message and `Forger` Guard

**Severity:** Medium

**Evidence — generic error string:** `src/utils.ts` lines 407–409:
```ts
if (React.Children.count(children) > 1) {
  throw new Error("Only one child allowed");
}
```
The error text does not mention `Slot`, `Forger`, or the call site. When thrown from deep inside `Forger → Slot`, the React error boundary or console output gives developers no indication of which component threw or what to do.

**Evidence — no null/invalid-child guard:** `src/utils.ts` line 411:
```ts
if (React.isValidElement(children)) { ... }
return null;
```
When `children` is a non-null non-ReactElement value (e.g. a plain string, a number, or `false`), `Slot` silently returns `null`. The consumer sees nothing rendered with no warning.

**Evidence — `Forger` has no named guard:** `src/Forger/Forger.tsx` line 113:
```tsx
export const Forger = <T extends FieldValues>(props: ForgerProps<T>) => {
  const methods = useFormContext() ?? { control: props?.control };
  return (
    <Slot>
      <MemorizeController ... />
    </Slot>
  );
};
```
`Forger` always passes exactly one child (`MemorizeController`), so the multiple-children guard never fires in normal usage. However, `Slot` is exported and used independently (`src/index.ts` re-exports via `utils`), so the generic error is public API surface.

**Fix approach:**
1. Add the component name to the error: `throw new Error("Slot: only one child is allowed")`.
2. Add a `console.warn` (rather than silent `null` return) when children is a valid React node but not a `ReactElement`.
3. Consider adding `Forger.displayName = "Forger"` for clearer React DevTools and error stack traces.

---

## CORR-04: Stale JSDoc in `useForge`

**Severity:** Low

**Evidence:** `src/useForge/useForge.tsx` lines 9–10:
```ts
/**
 * @param {ForgeFormProps} options - The options for the form.
 * @returns {UseForgeFormResult} - The form control functions and the form component.
 */
```
Neither `ForgeFormProps` nor `UseForgeFormResult` exists anywhere in the codebase. The actual parameter type is `UseForgeProps` (`src/types.ts` line 91) and the return type is `UseForgeResult` (`src/types.ts` line 108).

**Impact:** IDE hover documentation shows phantom type names. Consumers reading JSDoc to understand the API are actively misled. Type-doc generators will fail to resolve links.

**Fix approach:** Update `@param` to `{UseForgeProps}` and `@returns` to `{UseForgeResult}`. Both types are already imported/exported from `src/types.ts`.

---

## Stability: Heavy Private RHF API Access

**Severity:** Critical

**Evidence — call sites across three files (118 total occurrences):**

`src/useFieldArray/useFieldArray.tsx` (36 occurrences) — representative sites:
- Line 62: `control._getFieldArray(name)`
- Line 73: `control._names.array.add(name)`
- Line 97: `control._subjects.array`
- Line 100: `control._formValues`
- Line 110: `control._options.shouldUnregister`
- Line 141: `control._names.focus`
- Line 214: `control._state.action = false`
- Line 217–219: `control._subjects.state?.next({ ...control._formState })`
- Line 241: `control._formValues`, `control._options.criteriaMode`
- Line 261: `(control as any)._subjects.values?.next(...)`
- Line 266: `control._fields`
- Line 125: `(control as any)._updateFieldArray?.(name, updatedFieldArrayValues)` — cast to `any` with optional chain, implying the author already knows this may not exist

`src/usePersist/usePersist.tsx` line 26:
- `(control as any)._subjects.state`

`src/useForgeValues/useForgeValues.tsx` (74 occurrences) — representative sites:
- Line 95: `control._options.criteriaMode`
- Lines 105, 108, 113–115: `control._names.mount`, `control._formState.validatingFields`, `control._subjects.state.next(...)`
- Line 139: `control._getDirty()`
- Line 144: `control._defaultValues`
- Line 216: `control._state.mount`

**Impact:**
- All of these symbols (`_getFieldArray`, `_subjects`, `_names`, `_formValues`, `_setFieldArray`, `_fields`, `_options`, `_state`, `_formState`, `_defaultValues`, `_getDirty`, `_updateFieldArray`) are undocumented private internals of react-hook-form. The RHF maintainers explicitly state no stability guarantees for `_`-prefixed members.
- Any patch release of `react-hook-form` (currently pegged at `^7.50.1`) can rename, remove, or restructure these. The `^` semver range means a breaking `7.x` update auto-installs.
- `_updateFieldArray` is already cast to `any` with `?.` (line 125), indicating it was observed to be missing in some versions.
- `useForgeValues` effectively re-implements a large portion of RHF's internal `setValue`/`trigger` pipeline (~250 lines), duplicating logic that diverges silently when RHF changes.

**Fix approach (priority order):**
1. Pin the exact RHF version in `peerDependencies` (e.g. `"react-hook-form": "7.50.x"`) rather than `^7.50.1`, and document the constraint until private API usage is removed.
2. Replace `useFieldArray` with a thin wrapper around RHF's public `useFieldArray` hook plus the custom `inputProps` injection, eliminating all `_`-prefixed access.
3. Replace `usePersist`'s `_subjects.state` subscription with `useWatch` or `watch()` from the public API.
4. Replace `useForgeValues` with calls to the public `setValue`, `getValues`, and `trigger` returned by `useForm`/`useFormContext`.

---

## DevTools Shipped to Production

**Severity:** High

**Evidence:** `src/Forge/Forge.tsx` line 27:
```ts
import { DevTool } from "@hookform/devtools";
```
`src/Forge/Forge.tsx` line 265:
```tsx
{debug && <DevTool control={control} />}
```
`package.json` line 43:
```json
"dependencies": {
  "@hookform/devtools": "^4.3.1",
  ...
}
```

**Impact:**
- `@hookform/devtools` is listed in `dependencies` (not `devDependencies`), so it is installed in every consumer's `node_modules`.
- Even though the `DevTool` component is gated on `{debug && ...}`, the import at line 27 is unconditional — the module is always bundled. Rollup's external list (`rollup.config.mjs` line 10) includes `dependencies`, so `@hookform/devtools` IS externalised from the Rollup output, but it remains a runtime `dependencies` install requirement for all consumers regardless of whether they use `debug`.
- The `^4.3.1` range for a dev-only tool pins consumers to a devtools package they did not ask for.

**Fix approach:**
1. Move `@hookform/devtools` to `devDependencies` in `package.json`.
2. Guard the import with a dynamic import or conditional require so it is tree-shaken from production bundles when `debug` is absent:
   ```tsx
   // Option A: dynamic import
   const DevTool = debug ? (await import("@hookform/devtools")).DevTool : null;
   
   // Option B: lazy React.lazy
   const DevTool = React.lazy(() => import("@hookform/devtools").then(m => ({ default: m.DevTool })));
   ```
3. Document `debug` prop as a development-only feature requiring a separate install of `@hookform/devtools`.

---

## `lodash` as a Runtime Dependency

**Severity:** Medium

**Evidence:** `package.json` line 44:
```json
"lodash": "^4.17.21"
```
Import sites: `src/utils.ts` line 23, `src/useForgeValues/useForgeValues.tsx` line 37, `src/validateField.ts` line 33.

Usages are limited to named imports: `isUndefined`, `isObject`, `isString`, `isNumber`, `isBoolean`, `isFunction`.

**Impact:**
- Lodash 4 does not support ES module tree-shaking from its main entry. Importing even one utility pulls the full ~71 KB (minified) bundle into environments that do not have Rollup-level dead-code elimination (e.g. Jest, CJS consumers, some bundler configs).
- Adds an unnecessary peer dependency for consumers of a form utility library.
- All six lodash functions used have one-line native equivalents (e.g. `typeof x === 'undefined'`, `typeof x === 'string'`).

**Fix approach:** Replace the six lodash utility calls with inline native checks and remove `lodash` from `dependencies`. Use `lodash-es` (with named imports) only if specific lodash semantics (e.g. deep-isObject behaviour) are required.

---

## `handleWizardSubmit` Never Implemented in `useForge`

**Severity:** High

**Evidence:**
- `src/types.ts` line 31: `handleWizardSubmit?: () => void` declared as optional on `ForgeControl`.
- `src/Forge/Forge.tsx` line 60: destructured from `control` with no fallback.
- `src/Forge/Forge.tsx` lines 86, 113, 189, 209: passed into wizard navigation `onClick` handlers.
- `src/useForge/useForge.tsx` lines 54–72: `wizardProps` object returned inside `control` — `handleWizardSubmit` is **absent**.

**Impact:** In wizard mode (`isWizard: true`), when the user reaches the last step and clicks the "next/submit" button with `data-wizard-nav="next"`, `onClick` is bound to `undefined`. Clicking the button is a silent no-op — the form never submits. This is a functional regression in the wizard feature.

**Fix approach:** Add `handleWizardSubmit` to the `wizardProps` object in `useForge.tsx`:
```ts
const wizardProps = isWizard ? {
  isWizard,
  currentStep,
  totalSteps,
  isFirstStep: currentStep === 0,
  isLastStep: currentStep === totalSteps - 1,
  handleNext,
  handlePrevious,
  handleWizardSubmit: methods.handleSubmit,   // <-- add this
} : {};
```

---

## Augmenting RHF's `control` Object

**Severity:** Medium

**Evidence:** `src/useForge/useForge.tsx` lines 64–72:
```ts
return {
  ...methods,
  control: {
    ...methods.control,   // spread RHF's opaque Control object
    hasFields,
    fields,
    ...wizardProps        // isWizard, currentStep, handleNext, etc.
  }
};
```

**Impact:**
- `methods.control` is a class instance or opaque object created by `createFormControl` inside RHF. Object-spreading it discards prototype methods and any non-enumerable properties. RHF's internal hooks that call `control` methods (e.g. `useController`, `useWatch`) receive the spread copy, not the original instance, which may cause unexpected behaviour in certain RHF versions.
- The augmented object is typed as `ForgeControl<T>` (`types.ts` line 20), which extends RHF's `Control<T>`. TypeScript accepts it, but runtime behaviour differs.
- Wizard props (`isWizard`, `currentStep`, etc.) pollute the `control` namespace, clashing with any future RHF property additions.
- Consumers who pass `control` to third-party RHF-compatible components will receive an object that does not satisfy the original `Control` interface contract at runtime.

**Fix approach:** Carry Forge-specific state separately from `control`. Return a `forgeControl` (or `forgeProps`) object alongside the unmodified `methods.control`:
```ts
return {
  ...methods,
  forgeControl: { hasFields, fields, ...wizardProps }
};
```
Update `<Forge>` and `<Forger>` to accept a separate `forgeControl` prop, leaving `control` as the raw RHF `Control` instance. This is a breaking API change and warrants a semver-major bump.

---

## No Tests

**Severity:** High

**Evidence:** No `*.test.*` or `*.spec.*` files exist anywhere under `src/`. No `jest.config.*`, `vitest.config.*`, or test runner entry in `package.json` scripts.

**Impact:**
- None of the concerns above have regression coverage. CORR-02 (div vs form), the wizard submit bug, and private API breakage can all regress silently.
- The library cannot be published to the npm public registry with any confidence of correctness.
- CI (`publish.yml`) runs `npm publish` with no test or build verification step preceding it.

**Fix approach:** Add Vitest (compatible with Rollup/ESM) with `@testing-library/react`. Priority test targets: `useForge` wizard flow, `Forge` submit behaviour, `Forger` rendering, and `useFieldArray` append/remove.

---

## No Lint Configuration

**Severity:** Medium

**Evidence:** No `.eslintrc*`, `eslint.config.*`, or `biome.json` at the repository root (only matches inside `node_modules`). No `lint` script in `package.json`.

**Impact:** Code quality issues (e.g. `as any` casts, `any` parameters, missing `useEffect` dependency arrays) go undetected. The `useFieldArray` `useEffect` dependency array at line 281 (`[fields, name, control]`) includes `control` as a dependency, which changes identity on every render and may cause infinite loops — a linter with `exhaustive-deps` would flag this.

**Fix approach:** Add `eslint` with `eslint-plugin-react-hooks` and `@typescript-eslint/eslint-plugin`. Add a `lint` script and a lint step before publish in CI.

---

## `publishConfig` / CI Target Mismatch

**Severity:** Medium

**Evidence:**
- `package.json` line 25: `"registry": "https://npm.pkg.github.com/adexdsamson"` (GitHub Packages).
- `.github/workflows/publish.yml` line 23: `registry-url: https://registry.npmjs.org` (npmjs.com).
- `publish.yml` line 27: `run: npm publish --access public` from `working-directory: dist` — publishes the raw `dist/` folder as a package root, not the repository root, so the `package.json` at the repo root (with `files`, `exports`, `types` fields) is not the one being published.

**Impact:**
- If `publishConfig` is honoured, the package lands on GitHub Packages, not npmjs. If the workflow registry override wins, the package lands on npmjs without the `package.json` metadata from the root.
- Publishing from `dist/` means the published package lacks `files`, `exports`, `types`, and `publishConfig` — breaking ESM consumers and TypeScript users.
- `NODE_AUTH_TOKEN` is set but there is no `npm ci` or `npm run build` step before publish — CI publishes whatever is already in `dist/` (stale or missing).

**Fix approach:**
1. Align `publishConfig.registry` with the intended target (`https://registry.npmjs.org` for public npm).
2. Publish from the repo root, not `dist/`: remove `working-directory: dist`.
3. Add `npm ci` and `npm run build` steps before the publish step.
4. Add `npm test` (once tests exist) before publish.

---

## `useEffect` with Unstable `control` Dependency

**Severity:** Medium

**Evidence:** `src/useFieldArray/useFieldArray.tsx` line 281:
```ts
}, [fields, name, control]);
```
`control` is an object spread copy (from `useForge`) or a class instance (when used with raw RHF). In either case, it is referentially unstable on each render cycle.

**Impact:** The `useEffect` at lines 213–281 re-fires on every render, not only when the field array changes. Inside the effect, `control._state.action = false` and `control._subjects.state?.next(...)` are called — meaning form state subscribers receive spurious notifications on every render. In forms with many fields this produces noticeable performance degradation and potential infinite render loops.

**Fix approach:** Remove `control` from the dependency array (it should be a stable ref). If `control` properties are needed as deps, extract specific stable values (e.g. `control._options.mode`) or wrap the whole hook in a `useRef` guard pattern.

---

## `useForgeValues` Duplicates RHF Internal Logic

**Severity:** High

**Evidence:** `src/useForgeValues/useForgeValues.tsx` — 562 lines reimplementing `setValue`, `trigger`, `getValues`, plus internal helpers `updateTouchAndDirty`, `_setValid`, `executeBuiltInValidation`, `executeSchemaAndUpdateState`, `_runSchema`.

These are direct copies of RHF source, reading 20+ private `_`-prefixed properties. RHF provides all of these via its public `UseFormReturn` interface.

**Impact:** Every RHF release that changes any private internal will silently diverge from the copy in `useForgeValues`, producing subtly wrong dirty/touched/error state. The duplication also means consumers calling `setValue` via `useForgeValues` follow a different code path than RHF's own `setValue`, making bug reproduction against RHF's issue tracker impossible.

**Fix approach:** Delete `useForgeValues` entirely. Consumers should use `methods.setValue`, `methods.getValues`, and `methods.trigger` returned directly by `useForge` (which already re-exports `...methods`). If a wrapper for convenience is needed, implement it as a thin pass-through with no internal RHF access.

---

## MAPPING COMPLETE
