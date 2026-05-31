<!-- GSD:project-start source:PROJECT.md -->
## Project

**Forge**

Forge is a cross-platform (Web + React Native) React form library that wraps [react-hook-form](https://react-hook-form.com/) with a more streamlined, composable API. A developer calls `useForge(...)` to get react-hook-form's full toolkit plus an augmented `control`, renders a `<Forge control={...}>` form, and drops in `<Forger>` field wrappers around any custom input — web or native. It also ships reactive hooks (`usePersist`, `useForgeValues`, `useFieldArray`, `useSubscribe`), standalone `validateField`, platform detection, and a wizard/multi-step mode. This milestone turns the code (just extracted from the orbipayx app into this standalone repo) into a polished, well-tested, documented open-source npm package.

**Core Value:** A React developer — on web **or** React Native — can install Forge, follow the README, and build a working, validated form with custom components in minutes, and it behaves correctly (real form submit, fields re-render, clear errors) and stays stable across react-hook-form updates.

### Constraints

- **Tech stack**: TypeScript 5.x strict, React ≥18, react-hook-form ^7.x. Prefer public RHF APIs so the library survives routine RHF updates (currently violated via `control._*`).
- **Platform**: Cross-platform Web + React Native for v1 (no hard `react-native` import — support is via runtime detection; RN remains an optional peer for consumers using RN components).
- **Packaging**: Ships CJS + ESM + TypeScript declarations under the `@adexdsamson` scope; semver via conventional commits.
- **Bundle**: Keep runtime light — externalize React/RHF as peers; remove lodash; keep devtools out of production.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.3.3 — all source files under `src/`; strict mode enabled
- JavaScript (ESM) — `rollup.config.mjs` build config only
## Runtime
- Node.js 20 (pinned in CI via `actions/setup-node@v3` with `node-version: 20` in `.github/workflows/publish.yml`)
- No `.nvmrc` or `.node-version` file present in the repo root; version is enforced only in CI
- npm
- Lockfile: `package-lock.json` present (committed)
## Frameworks
- React 18 (`react@^18.2.0` peer dep, `^18.2.0` in devDependencies) — JSX transform via `react-jsx` (`tsconfig.json` `"jsx": "react-jsx"`)
- react-hook-form 7.x (`^7.50.1`) — peer dependency; this library is a thin orchestration wrapper around it
- Rollup 4.x (`^4.12.0`) — dual-output bundler, configured in `rollup.config.mjs`
- TypeScript compiler (`tsc`) — used only for `typecheck` (`tsc --noEmit`); declaration emit is handled by rollup-plugin-dts
## Key Dependencies
### Runtime (`dependencies` — bundled into dist or expected at consumer install time)
| Package | Version | Notes |
|---------|---------|-------|
| `@hookform/devtools` | `^4.3.1` | **Hard-imported** at the top of `src/Forge/Forge.tsx` as `import { DevTool } from "@hookform/devtools"`. Rendered unconditionally when `debug={true}`. This is a **dev/debug-only tool being shipped as a runtime dependency** — it will bloat consumers' bundles unless tree-shaken. See Concerns. |
| `lodash` | `^4.17.21` | **Runtime dependency** used throughout: `isUndefined`, `isObject`, `isString`, `isNumber`, `isEqual`, `isBoolean`, `isFunction` imported in `src/utils.ts`, `src/Forger/Forger.tsx`, `src/validateField.ts`, `src/useForgeValues/useForgeValues.tsx`, `src/logic/getDirtyFields.ts`. Full lodash, not `lodash-es`. |
### Peer Dependencies (consumer must supply)
| Package | Version | Required |
|---------|---------|---------|
| `react` | `>=18` | Required |
| `react-hook-form` | `^7.50.1` | Required |
| `react-dropzone` | (any) | Optional (`peerDependenciesMeta.react-dropzone.optional: true`) |
### Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `rollup` | `^4.12.0` | Build bundler |
| `rollup-plugin-dts` | `^6.1.0` | Generates `dist/index.d.ts` from TypeScript source |
| `@rollup/plugin-typescript` | `^11.1.6` | TS → JS transpilation inside Rollup |
| `@rollup/plugin-commonjs` | `^25.0.7` | Converts CJS deps to ESM within bundle |
| `@rollup/plugin-node-resolve` | `^15.2.3` | Resolves node_modules for bundling |
| `typescript` | `^5.3.3` | Type checking (`tsc --noEmit`) and type source |
| `tslib` | `^2.6.2` | TypeScript helper functions (reduces output size) |
| `react` | `^18.2.0` | Available locally for type resolution |
| `react-dom` | `^18.2.0` | Available locally for type resolution |
| `react-dropzone` | `^14.2.3` | Available locally; typed usage in `src/types.ts` (`import { Accept } from "react-dropzone"`) |
| `@types/react` | `^18.2.55` | React type definitions |
| `@types/lodash` | `^4.14.202` | Lodash type definitions |
## Module Output Format
| File | Format | Field in `package.json` |
|------|--------|------------------------|
| `dist/index.cjs.js` | CommonJS (CJS) | `"main"` |
| `dist/index.esm.js` | ES Module (ESM) | `"module"` |
| `dist/index.d.ts` | TypeScript declarations | `"types"` |
### `exports` map (`package.json`)
### Build process (`rollup.config.mjs`)
- Plugins: `@rollup/plugin-node-resolve`, `@rollup/plugin-commonjs`, `@rollup/plugin-typescript`
- Outputs: CJS + ESM both with `sourcemap: true`
- `declaration: false` on the typescript plugin (declarations handled separately)
- Plugin: `rollup-plugin-dts`
- Output: `dist/index.d.ts` in ESM format
## Configuration Files
| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript compiler config; target ES2019, moduleResolution `node`, strict mode, lib includes DOM (web-first) |
| `rollup.config.mjs` | Rollup bundler config — dual CJS+ESM output + dts |
| `package.json` | Package metadata, scripts, dependency declarations, `exports` map, `publishConfig` |
## TypeScript Configuration Details
- **`lib: ["DOM"]`** — includes browser DOM types. The library also supports React Native but does NOT include RN types in tsconfig. RN is supported via runtime feature detection only (see below).
- **`moduleResolution: "node"`** — legacy resolver; not `bundler` or `node16`. No path aliases configured.
## React Native Support Model
- `src/Forge/Forge.tsx` — platform routing for `isRNMode`
- `src/Forger/Forger.tsx` — RN-specific event handler wiring (`onChangeText`, `onValueChange`)
- `src/validateField.ts` — `setCustomValidity` uses `setNativeProps` on RN, `reportValidity` on web
- `src/reactNative.ts` — platform-specific event/value prop name mappings, helpers
- `src/utils.ts` — `cloneObject` guards `Blob`/`FileList` (web) vs `uri`/`_dispatchInstances` (RN)
## CI / Publish Pipeline
- Trigger: push to `main` branch or manual dispatch
- Runner: `ubuntu-latest`
- Node: 20
- Publish command: `npm publish --access public` run from the **`dist/` directory** (not the project root)
- Registry: `https://registry.npmjs.org` (overrides the `publishConfig` in `package.json` which points to GitHub Package Registry)
- Auth: `NODE_AUTH_TOKEN` from `secrets.NPM_ACCESS_TOKEN`
## Platform Requirements
- Node.js 20+
- npm (lockfile present)
- No test runner configured; no test scripts in `package.json`
- React >= 18
- react-hook-form ^7.50.1
- Optionally: react-dropzone (for file input accept types)
## MAPPING COMPLETE
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component / Hook | Responsibility | File |
|-----------------|----------------|------|
| `useForge` | Initializes `useForm`, augments `control` with `hasFields`, optional `fields` array, and wizard navigation state | `src/useForge/useForge.tsx` |
| `Forge` | `FormProvider` host; recursively walks children tree; wires submit buttons, wizard nav buttons, RN inputs; renders declarative field list via `Forger` when `control.hasFields` | `src/Forge/Forge.tsx` |
| `Forger` | Thin adapter: reads `useFormContext` (or prop `control`), wraps `MemorizeController` in a `Slot` | `src/Forger/Forger.tsx` |
| `ForgerController` | Calls `useController` to subscribe to a single field; resolves platform-appropriate event handler name; applies `transform.input/output`; renders user-supplied `component` | `src/Forger/Forger.tsx` |
| `MemorizeController` | `React.memo` wrapper around `ForgerController`; compares `dependencies`, `formState.isDirty`, and other props to prevent unnecessary re-renders | `src/Forger/Forger.tsx` |
| `useFieldArray` | Manages dynamic field arrays: `append`, `remove`, `insert`, `swap`, `update`; subscribes to `control._subjects.array`; runs field validation after mutations | `src/useFieldArray/useFieldArray.tsx` |
| `usePersist` | Subscribes to `control._subjects.state`; fires a caller-supplied `handler` on every form-state change (useful for persistence/autosave) | `src/usePersist/usePersist.tsx` |
| `useForgeValues` | Exposes `setValue`, `getValue`, `getValues`; re-implements RHF internal dirty/touch tracking and schema/built-in validation triggering against `ForgeControl` | `src/useForgeValues/useForgeValues.tsx` |
| `useSubscribe` | Generic observer adapter: subscribes to any RHF `Subject<T>`, cleans up on unmount | `src/useSubscribe.ts` |
| `validateField` | Async field validator: required, min/max, maxLength/minLength, pattern, custom `validate` fn — platform-aware for web and React Native | `src/validateField.ts` |
## Pattern Overview
- Forge does not maintain its own form state; all state lives in RHF's `Control` object.
- `ForgeControl` = RHF's `Control` object augmented with Forge-specific metadata (`hasFields`, `fields[]`, wizard state).
- Components read from `FormProvider` context (via `useFormContext`) rather than prop-drilling `control` past the first level.
- Platform duality is handled at the event-handler level, not by separate component trees.
## Layers
- Purpose: Configure a form instance and return an augmented control handle
- Location: `src/useForge/`
- Contains: `useForge` hook
- Depends on: `react-hook-form/useForm`, `src/types`
- Used by: Consumer code; passes `control` into `<Forge>`
- Purpose: Render the form DOM/RN container; inject form wiring into the child tree at runtime
- Location: `src/Forge/`
- Contains: `Forge` component
- Depends on: `react-hook-form/FormProvider`, `src/Forger`, `src/utils` (slot guards), `src/reactNative`
- Used by: Consumer; wraps all form children
- Purpose: Connect a single field to RHF state via `useController`; apply transforms and platform events
- Location: `src/Forger/`
- Contains: `Forger`, `ForgerController`, `MemorizeController`
- Depends on: `react-hook-form/useController`, `react-hook-form/useFormContext`, `src/utils`
- Used by: `Forge` (declarative field list), consumer JSX directly
- Purpose: Let consumers observe and manipulate form state without re-rendering Forge itself
- Location: `src/useFieldArray/`, `src/usePersist/`, `src/useForgeValues/`, `src/useSubscribe.ts`
- Contains: four hooks
- Depends on: RHF internal `_subjects`, `src/utils`, `src/logic/`, `src/validateField`
- Used by: Consumer code
- Purpose: Pure functions used by `useForgeValues` and `useFieldArray` for validation, dirty tracking, value coercion
- Location: `src/logic/`
- Contains: `getDirtyFields`, `getFieldValueAs`, `getResolverOptions`, `hasPromiseValidation`, `updateFieldArrayRootError`
- Depends on: `src/utils`, `react-hook-form` types
- Used by: `src/useForgeValues/`, `src/useFieldArray/`, `src/validateField`
- Purpose: Runtime detection and component/event-name mapping for web vs React Native
- Location: `src/utils.ts` (detection booleans), `src/reactNative.ts` (mapping helpers)
- Contains: `isWeb`, `isReactNative`, `isMobile`; `getEventHandlerName`, `getComponentType`, `mergePlatformProps`, `REACT_NATIVE_COMPONENTS`
- Depends on: nothing (pure env sniffing)
- Used by: `Forge`, `Forger/ForgerController`, `validateField`
## Data Flow
### Primary Request Path (controlled field change)
### Form Submission Path
### Wizard Navigation Path
### Dynamic Field Array Path
## Key Abstractions
- Purpose: Extends RHF `Control<T>` with Forge metadata and wizard navigation functions
- Defined: `src/types.ts:17-32`
- Created: `src/useForge/useForge.tsx:64-72` — spreads `methods.control` and overlays Forge fields
- Consumed by: `Forge` (tree-walker), `Forger` (passed as prop fallback), `usePersist`, `useForgeValues`
- Purpose: Thin pass-through component that merges style arrays in RN, enforces single-child constraint
- Defined: `src/utils.ts:406-423`
- Used by: `Forger` to wrap `MemorizeController` output
- Purpose: `React.memo` wrapper with a custom comparator that prevents re-renders unless `dependencies`, `formState.isDirty`, or other props change
- Defined: `src/Forger/Forger.tsx:81-111`
- Critical for performance when many fields share a parent re-render trigger
- Purpose: Subscribe to any RHF `Subject<T>` observable, clean up on unmount or `disabled` flag change
- Defined: `src/useSubscribe.ts:25-43`
- Used by: `useFieldArray`, `usePersist`
- Purpose: Optional `{ input, output }` pair for value coercion — `output` transforms value before writing to RHF; `input` transforms value before passing to the component
- Defined: `src/types.ts:52-68`
- Applied in: `src/Forger/Forger.tsx:32-38`
## Entry Points
- Location: `src/index.ts`
- Triggers: Tree-shaken by bundler consumers
- Responsibilities: Re-exports every public symbol (see Public API Surface below)
- Location: `src/index.ts` (also the Rollup input, `rollup.config.mjs:23`)
- Outputs: `dist/index.cjs.js`, `dist/index.esm.js`, `dist/index.d.ts`
## Public API Surface (export → source file)
| Export | Source File |
|--------|-------------|
| `Forge` | `src/Forge/Forge.tsx` |
| `Forger` | `src/Forger/Forger.tsx` |
| `useForge` | `src/useForge/useForge.tsx` |
| `usePersist` | `src/usePersist/usePersist.tsx` |
| `useFieldArray` | `src/useFieldArray/useFieldArray.tsx` |
| `useForgeValues` | `src/useForgeValues/useForgeValues.tsx` |
| `ForgeControl`, `ForgeProps`, `ForgerProps`, `ForgerControllerProps`, `ForgerSlotProps`, `TForgerProps`, `FieldProps`, `UseForgeProps`, `UseForgeResult`, `ReactNativeInputProps`, `PlatformSpecificProps`, `CrossPlatformForgerProps`, `FormPropsRef` | `src/types.ts` |
| `REACT_NATIVE_COMPONENTS`, `getEventHandlerName`, `getValuePropertyName`, `setReactNativeError`, `getComponentType`, `mergePlatformProps`, `REACT_NATIVE_VALIDATION_RULES`, `handleReactNativeFile`, `getPlatform`, `isValidReactNativeComponent` | `src/reactNative.ts` |
| `isWeb`, `isReactNative`, `isMobile`, `isTextInput`, `isCheckBoxInput`, `isRadioInput`, `isPicker`, `isSwitch`, `isSlider` | `src/utils.ts` |
## Platform Duality
```typescript
```
## Wizard Mode
```
```
- Renders only `childrenArray[currentStep]` when `isWizard` is true (`src/Forge/Forge.tsx:219-226`)
- Injects `onClick` onto `data-wizard-nav="next"` and `data-wizard-nav="previous"` buttons during tree traversal (`src/Forge/Forge.tsx:106-133`)
- Passes `{ currentStep, totalSteps, isFirstStep, isLastStep, handleNext, handlePrevious, handleWizardSubmit }` as extra props to non-container children via `cloneElement` so nested components can consume them
- Displays a `<div className="wizard-info">` step counter at the bottom of the form (`src/Forge/Forge.tsx:256-261`)
## `logic/` Helper Layer
| File | Purpose |
|------|---------|
| `src/logic/getDirtyFields.ts` | Deep-compares default values vs current values to build a `dirtyFields` map |
| `src/logic/getFieldValueAs.ts` | Coerces a raw field value using `valueAsNumber`, `valueAsDate`, or `setValueAs` from the field definition |
| `src/logic/getResolverOptions.ts` | Builds the options object passed to a Zod/Yup/etc. resolver: field names, `_f` metadata, criteria mode |
| `src/logic/hasPromiseValidation.ts` | Detects whether a field's `validate` function (or any in a map) is async — used to conditionally set `validatingFields` state |
| `src/logic/updateFieldArrayRootError.ts` | Attaches a root-level error to a field array's error slot in the errors object |
## Architectural Constraints
- **Threading:** Single-threaded React render model. `useForge`'s wizard `currentStep` is standard React state; all other form state is mutated synchronously inside RHF's `Control` and broadcast via synchronous subjects.
- **Global state:** `isWeb` and `isReactNative` in `src/utils.ts` are module-level constants evaluated once at import time. This means platform cannot be changed at runtime per-instance.
- **FormProvider dependency:** `Forger` calls `useFormContext()` and falls back to `props.control`. Fields rendered outside a `<Forge>` (thus outside `FormProvider`) must explicitly receive `control` as a prop.
- **Circular imports:** None detected. `Forge` imports `Forger`; `Forger` does not import `Forge`.
- **`useForgeValues` accesses RHF internals:** `useForgeValues` directly reads `control._formValues`, `control._fields`, `control._subjects`, `control._names`, `control._state`, and `control._options` — these are RHF private APIs prefixed with `_` and may break on RHF minor updates.
- **`@hookform/devtools` in production bundle:** `DevTool` is imported unconditionally and only conditionally rendered (`debug` prop), but it is included in the bundle regardless. Declared as a regular `dependency`, not `devDependency`.
## Error Handling
- `ForgerController` reads `fieldState.error.message` from `useController` and forwards it as the `error` string prop to the user's `component` (`src/Forger/Forger.tsx:73`)
- `useForgeValues.executeBuiltInValidation` runs `validateField` per field and pushes errors into `control._formState.errors` then broadcasts via `control._subjects.state` (`src/useForgeValues/useForgeValues.tsx:259-325`)
- Schema validation (Zod, Yup, etc.) is delegated entirely to the resolver passed via `useForge({ resolver })` and invoked by RHF's `handleSubmit`
- `validateField` calls `inputRef.setCustomValidity` (web) or `setNativeProps({ error })` (RN) for native browser/component validation feedback
## Cross-Cutting Concerns
## MAPPING COMPLETE
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
