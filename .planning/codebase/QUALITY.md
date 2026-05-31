# Code Quality Analysis

**Analysis Date:** 2026-05-31

---

## Summary

Forge is a small, focused library (~15 source files). The TypeScript compiler is configured with `strict: true`, but the codebase systematically defeats that strictness through pervasive `any` annotations. There are zero tests, no linter, no formatter, and the CI pipeline skips both build and test steps entirely. These are the primary quality risks before a public npm release.

---

## 1. Test Coverage

**Status: Zero tests exist.**

There are no `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files anywhere under `src/`. No test runner is configured — `package.json` has no `test` script, no `jest`, `vitest`, or `@testing-library/*` dependency. The CI workflow (`/.github/workflows/publish.yml`) runs only `npm publish` — it does not build, type-check, or test before publishing.

The MIGRATION.md documentation (line 329) instructs users to "Run your existing tests" and references `__tests__/` directories that do not exist. This is misleading documentation.

**Untested critical paths:**

| Area | File | Risk |
|------|------|------|
| Wizard step navigation | `src/Forge/Forge.tsx` | Off-by-one when `currentStep` exceeds `totalSteps` |
| Field array mutations | `src/useFieldArray/useFieldArray.tsx` | `swap`, `insert`, `update` are untested |
| `useForgeValues.getValue` fallback chain | `src/useForgeValues/useForgeValues.tsx:540–554` | Returns `undefined as any` on failure; no test catches this |
| Cross-platform event dispatch | `src/Forger/Forger.tsx:41–63` | RN vs web branching untested |
| `validateField` all branches | `src/validateField.ts` | Min/max, pattern, and async validate paths all untested |

**Fix approach:** Add `vitest` + `@testing-library/react` as dev dependencies. Write unit tests for `utils.ts` (pure functions, easiest wins), `validateField.ts` (most complex logic), and hook tests via `renderHook` for `useForge`, `useFieldArray`, and `useForgeValues`.

---

## 2. TypeScript Strictness vs Actual Type Safety

**`tsconfig.json` declares `"strict": true`.** In practice, the codebase contains approximately **46 `as any` casts** and **30+ explicit `any` type annotations** across 15 files. Strict mode is largely decorative.

### 2a. `as any` cast inventory

**`src/Forge/Forge.tsx` — 14 casts (worst offender)**

The entire `processChildrenRecursively` function (lines 64–215) operates on `children: any` and applies repeated `(child as any).props as any` casts because `Children.map` returns `ReactNode`, which does not expose `.props`. This is a design consequence of using child-scanning for form wiring.

Key examples:
```typescript
// Line 64
const processChildrenRecursively = (children: any, depth = 0): any => {

// Lines 103, 138, 161, 174 — repeated pattern
const childProps = (child as any).props as any;

// Lines 250–251 — double cast on FormProvider
{...(control as unknown as any)}
control={control as unknown as any}
```

**`src/useForgeValues/useForgeValues.tsx` — 8 casts**

Most dangerous: lines 542–554 implement a fallback chain that tries three runtime property lookups on `control` before giving up and returning `undefined as any` (line 554). This silently returns `undefined` typed as the generic return type — a lie to the type system that will cause downstream runtime errors.

```typescript
// Line 554 — typed lie
return undefined as any;
```

**`src/types.ts` — structural `any` in public API**

The public-facing `ForgerProps` and `ForgerControllerProps` types use `any` in exported positions:
```typescript
component: any;                  // line 43
} & Record<string, any>;         // line 49 (ForgerProps)
dependencies?: any[];            // line 67
} & Record<string, any>;         // line 68 (ForgerControllerProps)
```
`Record<string, any>` open-ended spreads on public props mean consumers get no IDE autocomplete or error checking for custom props.

**`src/reactNative.ts` — pervasive `any` parameters**

`getComponentType`, `mergePlatformProps`, `handleReactNativeFile`, `setReactNativeError`, and `isValidReactNativeComponent` all take `any` parameters. These are exported public API surface.

### 2b. Correct uses of `any`

A small subset of `any` uses are defensible: `baseGet` in `src/utils.ts:46` operates on deeply-nested unknown structure (equivalent to a path traversal utility). `cloneObject` in `src/utils.ts:197` similarly requires `any` for generic deep clone.

### 2c. `JSX.Element` instead of `ReactElement`

`src/types.ts:44` uses deprecated `JSX.Element` (`label?: string | JSX.Element`). This requires the global JSX namespace, which is not guaranteed with modern `jsx: "react-jsx"`. Should be `React.ReactElement`.

### 2d. `"use strict"` pragma in wrong place

`src/useForge/useForge.tsx:1` has `"use strict"` as a string directive. This is a CommonJS Node.js convention that has no effect in ES modules / TypeScript files. It is dead code.

---

## 3. Linting and Formatting

**No ESLint config exists in the project root.** No `.eslintrc.*`, `eslint.config.*`, or Biome config is present. The only ESLint configs found are inside `node_modules/`.

**No Prettier or formatter config exists.** No `.prettierrc`, `prettier.config.*`, or `biome.json`.

**Consequences observed:**
- Inconsistent trailing commas: some functions use them, some don't.
- Mixed single/double quotes: `src/utils.ts` uses double quotes; `src/reactNative.ts` uses single quotes throughout.
- Inconsistent spacing: `src/utils.ts:98–99` has two long lines without line breaks; `src/utils.ts:412` has a double space before `??`.
- The `"use strict"` pragma in `src/useForge/useForge.tsx:1` would be caught by `no-restricted-syntax` or similar rule.
- Commented-out import blocks in `src/Forge/Forge.tsx:18–24` (`// isWeb`, `// mergePlatformProps`, `// REACT_NATIVE_COMPONENTS`) would be caught by `no-unused-disable-directives` or `no-commented-out-code`.

**Fix approach:** Add `eslint` + `eslint-plugin-react` + `eslint-plugin-react-hooks` + `@typescript-eslint/eslint-plugin`. Add a `lint` script to `package.json`. Use `prettier` with a single `.prettierrc`. Consider adding `lint-staged` + `husky` for pre-commit enforcement.

---

## 4. Documentation State

### README.md

Present and covers: installation, basic web and RN usage, platform detection, component support, validation, TypeScript usage. **Quality concerns:**

- Installation block (line 17–20) says `npm install react-hook-form` and then "The forge library is included in your project" — this is placeholder text that does not describe how to install `@adexdsamson/forge` from npm.
- All code examples import from `'./lib/forge'` (a local path), not the published package name.
- "License" section (line 355) says "part of the Swifter project" — this is leftover app-context text that must be removed before OSS release.
- No changelog or version history section.

### MIGRATION.md

Present and detailed. However:
- References `__tests__/` directories (line 329, 345–351) that do not exist.
- Migration steps describe features (platform-specific props via `web={}` and `reactNative={}` on `Forger`) that do not appear to be implemented — `src/Forger/Forger.tsx` does not consume `platformProps.web` or `platformProps.reactNative`; those props would silently pass through as rest props.

### JSDoc

Only two files have JSDoc: `src/useForge/useForge.tsx` (lines 8–11) and `src/useForgeValues/useForgeValues.tsx` (lines 73–76). Both use incorrect type names in `@param` tags (`{ForgeFormProps}` and `{UseForgeValuesProps}` respectively — the first type doesn't exist, the real type is `UseForgeProps`). All other exported functions, hooks, and components have no JSDoc.

---

## 5. Conventions and Consistency

### What is consistent

- All hooks are named `useXxx` and live in `src/useXxx/` subdirectories with an `index.ts` re-export. This pattern is followed without exception.
- All components use named exports (no default component exports in the public API).
- Generic type parameters are named `TFieldValues` and `TFieldProps` throughout, matching react-hook-form conventions.
- `"use client"` directive is consistently applied to the two component files that need it (`src/Forge/Forge.tsx:1`, `src/Forger/Forger.tsx:1`).

### What is inconsistent

**Import style:**
- `src/utils.ts` uses React named imports: `import React, { Children, ReactElement, ... }`.
- `src/Forger/Forger.tsx` imports `memo` as a named import but uses `React.useMemo` inline.
- `src/useFieldArray/useFieldArray.tsx` mixes `import React` with both `React.useEffect` and bare `useEffect` imports.

**Function vs arrow function:**
- Utilities in `src/utils.ts` mix arrow functions (`export const compact = ...`) with regular function declarations (`export function cloneObject<T>`, `export function unset`). No consistent rule.

**Duplicated logic in `src/logic/` vs `src/utils.ts`:**
- `src/logic/updateFieldArrayRootError.ts` is a standalone file that duplicates the same function exported from `src/utils.ts:312`. Both are imported in different files. This is a direct duplication: `src/useFieldArray/useFieldArray.tsx` imports from `src/utils.ts`; `src/useForgeValues/useForgeValues.tsx` imports from `src/utils.ts`. The `src/logic/updateFieldArrayRootError.ts` file appears to be a leftover from refactoring.

**`Slot` component placement:**
- `src/utils.ts` exports `Slot` — a React component — mixed among pure utility functions. Components should not live in utility modules.

**Commented-out imports:**
- `src/Forge/Forge.tsx:18–24` has three commented-out imports that serve no documentation purpose and indicate incomplete cleanup.

---

## 6. Maintainability Risks

### 6a. Dependency on react-hook-form private/internal API

`src/useFieldArray/useFieldArray.tsx` and `src/useForgeValues/useForgeValues.tsx` access internal react-hook-form properties that are not part of the public API:

```typescript
// useFieldArray.tsx:125 — prefixed with underscore (private convention)
(control as any)._updateFieldArray?.(name, updatedFieldArrayValues);

// useFieldArray.tsx:260
(control as any)._subjects.values?.next({...});

// usePersist.tsx:26
subject: (control as any)._subjects.state,

// useForge.tsx:30
...(props as any),   // spreads unknown extra props onto useForm
```

These properties (`_updateFieldArray`, `_subjects`, `_formValues`, `_fields`, `_names`, `_state`, `_options`, `_getDirty`, `_defaultValues`, `_formState`) are all cast through `any` to bypass TypeScript, indicating they are not part of the published `Control` interface. A minor version bump of `react-hook-form` could silently break these integrations with no compile-time warning.

### 6b. `handleWizardSubmit` never set

`src/types.ts:31` declares `handleWizardSubmit?: () => void` on `ForgeControl`. `src/useForge/useForge.tsx:54–62` constructs `wizardProps` and does not include `handleWizardSubmit`. `src/Forge/Forge.tsx:60` destructures it and it will always be `undefined`. When a user clicks the last-step button in wizard mode, `onClick = handleWizardSubmit` (line 113) will set `onClick` to `undefined`, silently failing to submit.

### 6c. `@hookform/devtools` in production bundle

`@hookform/devtools` is listed under `dependencies` (not `devDependencies`) in `package.json`. It will be bundled into the published package or installed as a transitive dependency in consumers' projects. The `DevTool` component is only rendered when `debug={true}`, but the package itself ships as a full production dependency. This is a library maintenance anti-pattern.

### 6d. `react-dropzone` import in `src/types.ts` with no runtime guard

`src/types.ts:2` imports `Accept` from `react-dropzone`. The package is listed only as an optional peer dependency, but the import is unconditional. Any consumer who has not installed `react-dropzone` will get a module-not-found error when importing `@adexdsamson/forge`, even if they never use `Accept`.

### 6e. CI publishes from `dist/` directory without building

`.github/workflows/publish.yml` runs `npm publish --access public` with `working-directory: dist` — but no build step (`npm run build`) precedes it. If `dist/` is stale or absent, the workflow publishes nothing or publishes old built files. There is also no `npm ci` or dependency install step.

### 6f. `key={index}` in field array rendering

`src/Forge/Forge.tsx:244`: `control?.fields?.map((inputs, index) => <Forger key={index} .../>)`. Using array index as React key causes reconciliation bugs when items are reordered or removed.

---

## 7. Type Safety Prescriptions

For future code additions, follow these rules:

**Do not use `any` for component props.** Use `React.ComponentType<unknown>` or a constrained generic:
```typescript
// Bad (current pattern in types.ts:43)
component: any;

// Better
component: React.ComponentType<ForgerSlotProps>;
```

**Do not spread `Record<string, any>` on public types.** Use explicit optional props or a constrained generic `TExtraProps extends object = object`.

**Do not access react-hook-form `_`-prefixed internals.** All `_subjects`, `_formValues`, `_fields`, `_names` accesses in `useFieldArray` and `useForgeValues` should be replaced with public `useFormContext()` and official `useController()` hooks.

**Do not return `undefined as any`.** The fallback in `src/useForgeValues/useForgeValues.tsx:554` should `throw new Error(...)` or return a typed `undefined` with an explicit `| undefined` return type.

---

## 8. Quality Gaps Checklist (pre-OSS release)

| Gap | Severity | File(s) |
|-----|----------|---------|
| Zero tests | Critical | entire `src/` |
| No test runner configured | Critical | `package.json` |
| CI publishes without build step | Critical | `.github/workflows/publish.yml` |
| `handleWizardSubmit` always undefined | High | `src/useForge/useForge.tsx`, `src/Forge/Forge.tsx` |
| `react-dropzone` unconditional import | High | `src/types.ts:2` |
| `@hookform/devtools` in dependencies not devDependencies | High | `package.json` |
| Private RHF API access via `as any` | High | `src/useFieldArray/useFieldArray.tsx`, `src/useForgeValues/useForgeValues.tsx`, `src/usePersist/usePersist.tsx` |
| No ESLint config | Medium | repo root |
| No Prettier config | Medium | repo root |
| 46 `as any` casts defeating `strict: true` | Medium | `src/Forge/Forge.tsx`, `src/utils.ts`, `src/types.ts`, `src/reactNative.ts` |
| `return undefined as any` typed lie | Medium | `src/useForgeValues/useForgeValues.tsx:554` |
| README install instructions placeholder | Medium | `README.md` |
| README "Swifter project" license text | Medium | `README.md:355` |
| Duplicate `updateFieldArrayRootError` | Low | `src/utils.ts:312`, `src/logic/updateFieldArrayRootError.ts` |
| `JSX.Element` deprecated usage | Low | `src/types.ts:44` |
| `"use strict"` dead directive | Low | `src/useForge/useForge.tsx:1` |
| `key={index}` on field array items | Low | `src/Forge/Forge.tsx:244` |
| Commented-out dead imports | Low | `src/Forge/Forge.tsx:18–24` |
| `Slot` component in utils module | Low | `src/utils.ts:401–422` |
| MIGRATION.md references non-existent `__tests__/` | Low | `MIGRATION.md` |
| Sparse JSDoc — only 2 of 15 files | Low | `src/useForge/useForge.tsx`, `src/useForgeValues/useForgeValues.tsx` only |

---

## MAPPING COMPLETE
