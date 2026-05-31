<!-- refreshed: 2026-05-31 -->
# Architecture

**Analysis Date:** 2026-05-31

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                        Consumer App                              │
│  useForge() → { control }   <Forge control={...}>  <Forger />   │
└────────┬────────────────────────┬───────────────────────┬────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐  ┌────────────────────────┐  ┌──────────────────────┐
│   useForge      │  │       Forge             │  │       Forger         │
│ `src/useForge/` │  │   `src/Forge/`          │  │   `src/Forger/`      │
│                 │  │                         │  │                      │
│ Wraps useForm() │  │ FormProvider wrapper    │  │ MemorizeController   │
│ Extends Control │  │ Children tree walker    │  │ → ForgerController   │
│ Adds wizard     │  │ Submit/wizard wiring    │  │ → useController()    │
│ state           │  │ RN input registration   │  │ Platform events      │
└────────┬────────┘  └────────────────────────┘  └──────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│               react-hook-form  (peer dependency)                 │
│   Control  •  useForm  •  useController  •  FormProvider         │
│   _subjects.state  •  _subjects.array  •  _formValues            │
└──────────────────────────────────────────────────────────────────┘
         ▲
         │  subscribe via useSubscribe
┌────────┴──────────────────────────────────────────────────────┐
│                      Subscription Hooks                        │
│  useFieldArray  `src/useFieldArray/`  — array CRUD + sync     │
│  usePersist     `src/usePersist/`     — state change listener  │
│  useForgeValues `src/useForgeValues/` — setValue / getValue    │
│  useSubscribe   `src/useSubscribe.ts` — raw subject adapter    │
└───────────────────────────────────────────────────────────────┘
         ▲
         │  utilities
┌────────┴──────────────────────────────────────────────────────┐
│  logic/  `src/logic/`           utils  `src/utils.ts`         │
│  getDirtyFields                 platform detection booleans    │
│  getFieldValueAs                element-type guards            │
│  getResolverOptions             path/object helpers            │
│  hasPromiseValidation           Slot component                 │
│  updateFieldArrayRootError      deepEqual / cloneObject        │
└───────────────────────────────────────────────────────────────┘
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

**Overall:** Thin-wrapper / decorator pattern over react-hook-form.

**Key Characteristics:**
- Forge does not maintain its own form state; all state lives in RHF's `Control` object.
- `ForgeControl` = RHF's `Control` object augmented with Forge-specific metadata (`hasFields`, `fields[]`, wizard state).
- Components read from `FormProvider` context (via `useFormContext`) rather than prop-drilling `control` past the first level.
- Platform duality is handled at the event-handler level, not by separate component trees.

## Layers

**Hook Initialization Layer:**
- Purpose: Configure a form instance and return an augmented control handle
- Location: `src/useForge/`
- Contains: `useForge` hook
- Depends on: `react-hook-form/useForm`, `src/types`
- Used by: Consumer code; passes `control` into `<Forge>`

**Provider / Tree-Walker Layer:**
- Purpose: Render the form DOM/RN container; inject form wiring into the child tree at runtime
- Location: `src/Forge/`
- Contains: `Forge` component
- Depends on: `react-hook-form/FormProvider`, `src/Forger`, `src/utils` (slot guards), `src/reactNative`
- Used by: Consumer; wraps all form children

**Field Controller Layer:**
- Purpose: Connect a single field to RHF state via `useController`; apply transforms and platform events
- Location: `src/Forger/`
- Contains: `Forger`, `ForgerController`, `MemorizeController`
- Depends on: `react-hook-form/useController`, `react-hook-form/useFormContext`, `src/utils`
- Used by: `Forge` (declarative field list), consumer JSX directly

**Subscription / Utility Hook Layer:**
- Purpose: Let consumers observe and manipulate form state without re-rendering Forge itself
- Location: `src/useFieldArray/`, `src/usePersist/`, `src/useForgeValues/`, `src/useSubscribe.ts`
- Contains: four hooks
- Depends on: RHF internal `_subjects`, `src/utils`, `src/logic/`, `src/validateField`
- Used by: Consumer code

**Logic Helper Layer:**
- Purpose: Pure functions used by `useForgeValues` and `useFieldArray` for validation, dirty tracking, value coercion
- Location: `src/logic/`
- Contains: `getDirtyFields`, `getFieldValueAs`, `getResolverOptions`, `hasPromiseValidation`, `updateFieldArrayRootError`
- Depends on: `src/utils`, `react-hook-form` types
- Used by: `src/useForgeValues/`, `src/useFieldArray/`, `src/validateField`

**Platform Abstraction Layer:**
- Purpose: Runtime detection and component/event-name mapping for web vs React Native
- Location: `src/utils.ts` (detection booleans), `src/reactNative.ts` (mapping helpers)
- Contains: `isWeb`, `isReactNative`, `isMobile`; `getEventHandlerName`, `getComponentType`, `mergePlatformProps`, `REACT_NATIVE_COMPONENTS`
- Depends on: nothing (pure env sniffing)
- Used by: `Forge`, `Forger/ForgerController`, `validateField`

## Data Flow

### Primary Request Path (controlled field change)

1. User types in a field rendered by `<Forger component={MyInput} name="email" />` (`src/Forger/Forger.tsx:113`)
2. `ForgerController.getEventHandlers()` resolves the correct handler (`onChange` / `onChangeText` / `onValueChange`) and calls RHF's `onChange` from `useController` (`src/Forger/Forger.tsx:41-65`)
3. RHF updates `control._formValues.email` and broadcasts to `control._subjects.state`
4. Any active `usePersist` handler receives the new state snapshot (`src/usePersist/usePersist.tsx:24-31`)
5. `useForgeValues.setValue` (if used) can further push values back into `control._formValues` and re-broadcast (`src/useForgeValues/useForgeValues.tsx:484-529`)

### Form Submission Path

1. `<Forge>` clones a `type="submit"` button and attaches `control.handleSubmit(onSubmit)` as its `onClick` (`src/Forge/Forge.tsx:94-99`)
2. RHF's `handleSubmit` validates all mounted fields, then calls `onSubmit(data)` if valid

### Wizard Navigation Path

1. Consumer calls `useForge({ isWizard: true, totalSteps: N })` → `currentStep` state initialises at `initialStep` (`src/useForge/useForge.tsx:37`)
2. `handleNext` / `handlePrevious` increment/decrement `currentStep`, updating `control.currentStep` (`src/useForge/useForge.tsx:40-50`)
3. `<Forge>` detects `control.isWizard`; in wizard mode it renders only `childrenArray[currentStep]` (`src/Forge/Forge.tsx:219-226`)
4. Buttons bearing `data-wizard-nav="next"` or `data-wizard-nav="previous"` are wired to these handlers by `Forge`'s tree-walker (`src/Forge/Forge.tsx:106-133`)
5. On the last step, `data-wizard-nav="next"` triggers `handleWizardSubmit` (currently not separately defined; falls back to standard submit)

### Dynamic Field Array Path

1. Consumer calls `useFieldArray({ control, name: "items", inputProps })` (`src/useFieldArray/useFieldArray.tsx:50`)
2. Hook subscribes to `control._subjects.array` via `useSubscribe`; local `fields` state mirrors RHF's internal array (`src/useFieldArray/useFieldArray.tsx:86-97`)
3. `append` / `remove` / `insert` / `swap` / `update` mutate the array, call `control._updateFieldArray`, and call `setFields` (`src/useFieldArray/useFieldArray.tsx:130-211`)
4. After each mutation `useEffect` optionally triggers field-level validation and broadcasts via `control._subjects.values` (`src/useFieldArray/useFieldArray.tsx:213-281`)

**State Management:**
All mutable form state (values, errors, dirty/touched flags, validation state) lives exclusively inside RHF's `Control` object. Forge never duplicates this state — it only reads and writes through the `control` reference. The sole exception is wizard step state: `currentStep` is a `useState` local to `useForge`.

## Key Abstractions

**`ForgeControl<T, TFieldProps>`:**
- Purpose: Extends RHF `Control<T>` with Forge metadata and wizard navigation functions
- Defined: `src/types.ts:17-32`
- Created: `src/useForge/useForge.tsx:64-72` — spreads `methods.control` and overlays Forge fields
- Consumed by: `Forge` (tree-walker), `Forger` (passed as prop fallback), `usePersist`, `useForgeValues`

**`Slot`:**
- Purpose: Thin pass-through component that merges style arrays in RN, enforces single-child constraint
- Defined: `src/utils.ts:406-423`
- Used by: `Forger` to wrap `MemorizeController` output

**`MemorizeController`:**
- Purpose: `React.memo` wrapper with a custom comparator that prevents re-renders unless `dependencies`, `formState.isDirty`, or other props change
- Defined: `src/Forger/Forger.tsx:81-111`
- Critical for performance when many fields share a parent re-render trigger

**`useSubscribe`:**
- Purpose: Subscribe to any RHF `Subject<T>` observable, clean up on unmount or `disabled` flag change
- Defined: `src/useSubscribe.ts:25-43`
- Used by: `useFieldArray`, `usePersist`

**`ForgerControllerProps.transform`:**
- Purpose: Optional `{ input, output }` pair for value coercion — `output` transforms value before writing to RHF; `input` transforms value before passing to the component
- Defined: `src/types.ts:52-68`
- Applied in: `src/Forger/Forger.tsx:32-38`

## Entry Points

**Library Entry Point:**
- Location: `src/index.ts`
- Triggers: Tree-shaken by bundler consumers
- Responsibilities: Re-exports every public symbol (see Public API Surface below)

**Build Entry Point:**
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

Platform is resolved at module load time via constants in `src/utils.ts`:

```typescript
// src/utils.ts:94-99
export const isWeb =
  typeof window !== "undefined" &&
  typeof window.HTMLElement !== "undefined" &&
  typeof document !== "undefined";
export const isReactNative =
  !isWeb && typeof navigator !== "undefined" && navigator.product === "ReactNative";
```

These booleans gate behaviour in three places:

1. **`Forge` component** (`src/Forge/Forge.tsx:40-44`): `platform` prop (default `"auto"`) + `isNative` prop determine `isRNMode`; RN mode routes input registration through `getEventHandlerName` rather than standard `onChange`.

2. **`ForgerController`** (`src/Forger/Forger.tsx:41-63`): `getEventHandlers()` dispatches on `isReactNative` and component `displayName`/type to return the right handler key:
   - `TextInput` → `onChangeText`
   - `Switch` / `Picker` / `Slider` → `onValueChange`
   - Web / unknown → `onChange`
   - `handler` prop overrides everything

3. **`validateField`** (`src/validateField.ts:154-166`): native validation feedback uses `inputRef.setCustomValidity` + `reportValidity` on web; `setNativeProps({ error })` on React Native.

The `src/reactNative.ts` module provides a lookup table (`REACT_NATIVE_COMPONENTS`) and helper functions (`getEventHandlerName`, `getValuePropertyName`, `mergePlatformProps`) used by `Forge` and consumable by library users.

## Wizard Mode

Wizard state is owned entirely by `useForge` and stored as React component state:

```
useForge({ isWizard: true, totalSteps: 3 })
  → useState(initialStep)  // currentStep
  → handleNext / handlePrevious mutate currentStep
  → spreads onto control: { isWizard, currentStep, totalSteps, isFirstStep, isLastStep, handleNext, handlePrevious }
```

`Forge` reads these from `control` and:
- Renders only `childrenArray[currentStep]` when `isWizard` is true (`src/Forge/Forge.tsx:219-226`)
- Injects `onClick` onto `data-wizard-nav="next"` and `data-wizard-nav="previous"` buttons during tree traversal (`src/Forge/Forge.tsx:106-133`)
- Passes `{ currentStep, totalSteps, isFirstStep, isLastStep, handleNext, handlePrevious, handleWizardSubmit }` as extra props to non-container children via `cloneElement` so nested components can consume them
- Displays a `<div className="wizard-info">` step counter at the bottom of the form (`src/Forge/Forge.tsx:256-261`)

`handleWizardSubmit` is referenced on `control` but is never populated in `useForge` — calling `handleWizardSubmit` on the last step currently fires `undefined` (see CONCERNS.md).

## `logic/` Helper Layer

Pure utility functions called by `useForgeValues` and `useFieldArray`; not exported publicly.

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

**Strategy:** Delegate to react-hook-form's error model. Forge does not define its own error types.

**Patterns:**
- `ForgerController` reads `fieldState.error.message` from `useController` and forwards it as the `error` string prop to the user's `component` (`src/Forger/Forger.tsx:73`)
- `useForgeValues.executeBuiltInValidation` runs `validateField` per field and pushes errors into `control._formState.errors` then broadcasts via `control._subjects.state` (`src/useForgeValues/useForgeValues.tsx:259-325`)
- Schema validation (Zod, Yup, etc.) is delegated entirely to the resolver passed via `useForge({ resolver })` and invoked by RHF's `handleSubmit`
- `validateField` calls `inputRef.setCustomValidity` (web) or `setNativeProps({ error })` (RN) for native browser/component validation feedback

## Cross-Cutting Concerns

**Logging:** `console.error` used only in `useForgeValues.getValue` as a fallback when `getValues` cannot be resolved (`src/useForgeValues/useForgeValues.tsx:553`). No structured logging.

**Validation:** Two paths — RHF built-in rules (required, min, max, pattern, validate) executed by `validateField`; or external schema resolvers (Zod, Yup, etc.) passed to `useForge`.

**Authentication:** Not applicable — this is a form library with no auth concerns.

---

*Architecture analysis: 2026-05-31*

## MAPPING COMPLETE
