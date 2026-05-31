# Phase 2: Stability - Pattern Map

**Mapped:** 2026-05-31
**Files analyzed:** 11 (10 source + package.json) — all MODIFIED, zero new files
**Analogs found:** 10 / 11 (1 follows a TS-convention with no in-repo analog)

> **Phase character:** This is a refactor-IN-PLACE phase. Almost every change replaces a current
> anti-pattern with a pattern ALREADY present elsewhere in this same repo. The "closest analog"
> is usually a sibling already in the codebase (e.g. the `react-dropzone` optional-peer line is the
> analog for the devtools optional-peer; the local `isBoolean`/`isFunction`/`deepEqual` are the
> analogs for the lodash swaps; the `useSubscribe`→`useWatch`/`useFormState` swap mirrors RHF public
> hooks already imported elsewhere). The planner should COPY the in-repo pattern, not invent one.

---

## File Classification

| Modified File | Role | Change Type | Closest Analog | Match Quality |
|---------------|------|-------------|----------------|---------------|
| `src/useForge/useForge.tsx` | hook | control-augmentation (D-11) | itself: current `{...methods.control}` spread (`:73-78`) → in-place `Object.assign` | self-rewrite (anti-pattern → pattern) |
| `src/useFieldArray/useFieldArray.tsx` | hook | decorate-on-top rewrite (D-05/06/07) | RHF public `useFieldArray` + existing per-item `useMemo` map (`:288-296`) | role-match (RHF hook) + in-file keeper |
| `src/useForgeValues/useForgeValues.tsx` | hook | collapse to thin wrapper (D-03/04) | `Forger.tsx:27-30` `useController`+`useFormContext` public-method pattern | role-match (public-method delegation) |
| `src/usePersist/usePersist.tsx` | hook | public subscription (D-12) | `useFieldArray`'s `handlerRef` ref-stability idiom (`:21-22` in usePersist itself) + RHF `useWatch`/`useFormState` | role-match |
| `src/Forge/Forge.tsx` | component | devtools (D-08/09) + child-walker retype (D-10) | devtools: `package.json` `react-dropzone` peer (`:50-54`); walker: existing `isValidElement`-style guards already in `processChildrenRecursively` | exact (peer) / self-retype (walker) |
| `src/types.ts` | types | type-hardening sweep (D-10) | `ForgeControl<T>` already-correct `Control<T,any> &` augmentation shape (`:17-32`) — KEEP shape, drop `any`s | self-sweep |
| `src/utils.ts` | utility | lodash swap (D-13) | LOCAL `isBoolean` (`:37`), `isFunction` (`:137`), `deepEqual` (`:448`) — already native | exact (local helpers exist) |
| `src/validateField.ts` | utility | lodash swap (D-13) | `utils.ts` local `isBoolean`/`isFunction`/`isString` | exact (import-rewire) |
| `src/Forger/Forger.tsx` | component | lodash `isEqual` swap (D-13) | `utils.ts` default-export `deepEqual` (`:448`) | exact (direct replacement) |
| `src/logic/getDirtyFields.ts` | logic | lodash swap (D-13) | shared `isObject` from `utils.ts` (to be centralized) + local `isUndefined` | exact (import-rewire) |
| `package.json` | config | dependency move (D-08/13) | `peerDependenciesMeta.react-dropzone` (`:50-54`) | exact |

---

## Pattern Assignments

### `src/useForge/useForge.tsx` (hook, control-augmentation D-11)

**Analog:** ITSELF — the current spread is the anti-pattern; the fix mirrors RESEARCH Pattern 4.

**Anti-pattern being REMOVED** (`:71-79`) — drops RHF prototype + new identity every render:
```tsx
return {
  ...methods,
  control: {
    ...methods.control,    // <-- BUG: spread degrades RHF control, new identity each render
    hasFields,
    fields,
    ...wizardProps
  }
};
```

**Replacement pattern (D-11, in-place mutate):**
```tsx
const forgeProps = { hasFields, fields, ...wizardProps };
Object.assign(methods.control, forgeProps);            // same instance, prototype + _* intact
return { ...methods, control: methods.control as ForgeControl<TFieldValues, TFieldProps> };
```

**Also in this file (discretionary, D-50 cleanups):**
- Delete dead `"use strict";` at `:1`.
- The `useState(initialStep)` `currentStep` (`:37`) STAYS — wizard re-render flows from React state, NOT control identity (confirmed in RESEARCH D-11 safety).
- `...(props as any)` at `:30` — sweep target; narrow if it does not cascade.
- `wizardProps` object (`:60-69`) keeps the SAME shape — only the attach mechanism changes.

---

### `src/useFieldArray/useFieldArray.tsx` (hook, decorate-on-top D-05/06/07)

**Analog:** RHF's public `useFieldArray` (role-match) + the KEEPER per-item map already in this file.

**KEEPER pattern to PRESERVE** (`:288-296`) — the per-item `inputProps` decoration (D-05, the entire reason this hook was hand-rolled):
```tsx
fields: React.useMemo(
  () =>
    fields.map((field, index) => ({
      ...field,
      inputProps,                          // <-- D-05 KEEPER: client-side per-item attribute layer
      id: ids.current[index] || generateId(),
    })) as FieldsArray<InputProps>[],
  [fields, keyName]
),
```

**ALL of these `_*` sites get DELETED** (RHF's public hook does them internally — RESEARCH RISK-02 table):
- `control._getFieldArray(name)` (`:62, 137, 153, 167, 184, 202`)
- `control._names.array.add(name)` (`:73`), `control._names.focus` (`:140, 173, 264-277`)
- `control._subjects.array` subscribe (`:86-96`) — delete the manual `useSubscribe`
- `control._setFieldArray` / `control._formValues` (`:99`)
- `control._fields` / `field._f.mount` unmount cleanup (`:101-112`)
- `(control as any)._updateFieldArray?.(...)` (`:124`)
- `control._state.action` (`:213`), `isWatched(...) && control._subjects.state?.next(...)` (`:215-218`)
- manual `validateField(...)` post-mutation block (`:228-256`)
- `control._subjects.values?.next(...)` (`:259-262`)
- **the unstable `useEffect` with `[fields, name, control]` (`:280`) — deleted entirely (D-07)**

**Replacement pattern (RESEARCH Pattern 1, decorate-on-top, ZERO `_*`):**
```tsx
const rhf = useRHFFieldArray<TFieldValues, TFieldArrayName, TKeyName>({
  control, name, keyName, rules: props.rules, shouldUnregister: props.shouldUnregister,
});
const fields = React.useMemo(
  () => rhf.fields.map((field) => ({ ...field, inputProps })),   // KEEPER preserved
  [rhf.fields, inputProps]
);
return { ...rhf, fields };   // append/remove/insert/swap/update/replace straight from RHF
```
Post-mutation validation re-homes to RHF `rules` (auto, 7.34.0+) OR explicit `methods.trigger(name)` inside the wrappers (RESEARCH Open Q #1 — planner picks).

---

### `src/useForgeValues/useForgeValues.tsx` (hook, thin wrapper D-03/04)

**Analog:** `Forger.tsx:27-30` — the established public-method-delegation idiom (`useFormContext` + destructure RHF methods, no `_*`).

**Forger's delegation analog** (`Forger.tsx:27-30`):
```tsx
const {
  field: { onBlur, onChange, value, ref },
  fieldState: { error },
} = useController<TFieldValues>({ name, rules, control: methods?.control });
```

**Anti-pattern being DELETED** — the ~562-line re-implementation, ending in the typed lie (`:554`):
```tsx
return undefined as any;    // <-- D-04: replace with a Forge-named throw
```
(plus lodash `isObject`/`isString`/`isUndefined` import at `:37` — drop per D-13.)

**Replacement pattern (RESEARCH Pattern 2):**
```tsx
export const useForgeValues = <T extends FieldValues>({ control }: { control: ForgeControl<T> }) => {
  const ctx = useFormContext<T>();          // mirrors Forger's useFormContext fallback idiom
  const getValue = <N extends Path<T>>(name: N): PathValue<T, N> => {
    const all = ctx.getValues();
    if (!hasPath(all, name)) {              // RISK-01 dot-path key-presence (NOT _names)
      throw new Error(`useForgeValues.getValue: field "${String(name)}" is not registered`);
    }
    return ctx.getValues(name);
  };
  return { setValue: ctx.setValue, getValue, getValues: ctx.getValues };
};
```
`hasPath` helper from RESEARCH "Code Examples — RISK-01" (dot-path + bracket normalization). **No `as any`.**

---

### `src/usePersist/usePersist.tsx` (hook, public subscription D-12)

**Analog:** the file's OWN `handlerRef` ref-stability idiom (`:21-22`) — keep it; swap only the subscription source.

**KEEPER idiom (`:21-22`)** — stable handler ref, preserve:
```tsx
const handlerRef = React.useRef(handler);
handlerRef.current = handler;
```

**Anti-pattern being REMOVED** (`:24-30`) — `_subjects.state` firehose via `useSubscribe`:
```tsx
useSubscribe({
  disabled: false,
  subject: (control as any)._subjects.state,    // <-- D-12: private + `as any`
  next: (formState) => {
    handlerRef.current((formState as any).values, (formState as any));
  },
});
```

**Replacement pattern (RESEARCH Pattern 3):**
```tsx
const values = useWatch({ control });                    // reactive values, public
const { isDirty, isValid } = useFormState({ control });  // scoped state, public
const handlerRef = React.useRef(handler); handlerRef.current = handler;
React.useEffect(() => {
  handlerRef.current(values, { isDirty, isValid });      // NEW lighter signature (documented break)
}, [values, isDirty, isValid]);
```
NOTE: `ForgePersist` handler type (`:5-15`) changes to `(values, { isDirty, isValid })` — D-01 documented break. After this rewrite `useSubscribe` no longer feeds RHF `_subjects` (becomes internal-only).

---

### `src/Forge/Forge.tsx` (component, devtools D-08/09 + child-walker retype D-10)

**Analog A (devtools):** `package.json:50-54` `react-dropzone` optional-peer (see package.json section).
**Analog B (child-walker):** the walker's existing branch structure — retype only, NO runtime change (RISK-04).

**Anti-pattern A being REMOVED** — unconditional top-level devtools import (`:29`) + unguarded render (`:323`):
```tsx
import { DevTool } from "@hookform/devtools";   // :29  — forces into production bundle
// ...
{debug && <DevTool control={control} />}        // :323 — import already bloated bundle
```

**Replacement A (RESEARCH "RISK-03 — synchronous guarded require"):**
```tsx
function loadDevTool(): React.ComponentType<{ control: unknown }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("@hookform/devtools").DevTool;   // synchronous; external in rollup
  } catch {
    throw new Error(
      "Forge: debug mode requires '@hookform/devtools'. Install it with `npm i -D @hookform/devtools`."
    );
  }
}
// render path:
let devtools: React.ReactNode = null;
if (debug) { const DevTool = loadDevTool(); devtools = <DevTool control={control} />; }
```
(Must also add `@hookform/devtools` to rollup `external` list — verify in Phase 2 manual gate.)

**Anti-pattern B being SWEPT** — child-walker `as any` casts (~14, D-10). Examples:
- `(child as any).props as any` (`:113`)
- `cloneElement(child, {...childProps, onClick, ...} as any)` (`:101-103, 136-143`)
- `{...(control as unknown as any)} control={control as unknown as any}` (FormProvider, `:301-303`)

**Replacement B (RESEARCH "RISK-04 — typed child-walker", type-only):**
```tsx
type AnyElement = React.ReactElement<Record<string, unknown>>;
// inside Children.map:
if (!isValidElement(child)) return child;     // narrows to ReactElement
const el = child as AnyElement;
const childProps = el.props;                  // typed, no `as any`
// every branch + cloneElement/createElement prop-merge stays byte-for-byte identical
```
**MANDATORY manual gate (RISK-04, no tests):** native `<form>` submit (`:315-318`), Enter-to-submit, wizard last-step submit (`:124-126, 253-257`), button onClick wiring (`:101-108`) must all still fire. Retype must NOT change which branch runs.

**Also (discretionary):** commented-out imports `:18-26` (`// isWeb`, `// mergePlatformProps`, `// REACT_NATIVE_COMPONENTS`) — delete; `key={index}` at `:281` → stable key.

---

### `src/types.ts` (types, hardening sweep D-10)

**Analog:** the `ForgeControl<T>` augmentation SHAPE is already correct (`:17-32`) — KEEP the shape (success criterion #5 locks it), only remove `any`s and fix `JSX.Element`.

**KEEP this shape (`:17-32`)** — D-11's in-place mutation produces exactly this; do NOT split it out:
```tsx
export type ForgeControl<T extends FieldValues, TFieldProps = unknown> = Control<T, any> & {
  fields?: FieldProps<TFieldProps>[];
  hasFields: boolean;
  isWizard?: boolean; currentStep?: number; totalSteps?: number;
  isFirstStep?: boolean; isLastStep?: boolean;
  handleNext?: () => void; handlePrevious?: () => void;
  handleWizardSubmit?: (onSubmit?: (data: any) => void) => () => void;
};
```

**Sweep targets in this file:**
- `:2` `import { Accept } from "react-dropzone";` → **`import type { Accept } from "react-dropzone";`** (D-10 — erased at runtime; fixes module-not-found for consumers without react-dropzone). NOTE: no existing `import type` in the repo, so this follows the TS convention from RESEARCH, not an in-repo analog.
- `:43` `component: any;` → `component: React.ElementType;` (RESEARCH RISK-04 decision — do NOT use a `ForgerSlotProps` generic constraint).
- `:44` `label?: string | JSX.Element;` → `label?: string | React.ReactElement;` (no global JSX namespace under `jsx: react-jsx`).
- `:49, :68` `& Record<string, any>` → `& Record<string, unknown>` where it does not cascade errors.
- `:64` `component: Component<ForgerSlotProps>;` → `component: React.ElementType;` (current type is WRONG — types an instance, not a component type).
- `:82` `typeof Component<ForgerSlotProps> | any` → `React.ElementType`.

---

### `src/utils.ts` (utility, lodash swap D-13)

**Analog:** LOCAL native helpers ALREADY in this file — only the lodash import (`:22`) needs replacing.

**Confirmed already-local (reuse, do NOT rewrite):**
| Helper | Line | Status |
|--------|------|--------|
| `isBoolean` | `:37` | local native (`typeof === "boolean"`) — **export it** for `validateField.ts` |
| `isFunction` | `:137` | local native (`typeof === "function"`) — already exported |
| `deepEqual` | `:448` (default export) | local, cycle-safe — the `isEqual` replacement |
| `isNullOrUndefined` | `:24` | local |

**Lodash import being REMOVED** (`:22`):
```ts
import { isUndefined, isObject, isString, isNumber } from "lodash";
```

**Replacement (add local helpers, RESEARCH lodash table):**
```ts
const isUndefined = (v: unknown): v is undefined => v === undefined;
const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number";
// CRITICAL — lodash isObject semantics (true for fn/array, false for null):
export const isObject = (v: unknown): v is object =>
  v !== null && (typeof v === "object" || typeof v === "function");
```
Centralize `isObject` HERE and export it so `getDirtyFields.ts` reuses it (RESEARCH Pitfall 4 — bare `typeof === "object"` is WRONG).

---

### `src/validateField.ts` (utility, lodash swap D-13)

**Analog:** `utils.ts` local `isBoolean`/`isFunction`/`isString`/`isObject`/`isUndefined`.

**Lodash import being REMOVED** (`:33`):
```ts
import { isBoolean, isFunction, isObject, isString, isUndefined } from "lodash";
```

**Replacement:** import the centralized helpers from `../utils` (now exported per the utils.ts section). Call sites unchanged (`:102,118-119,157,162,173-174,205,252,260,287,311,329,346`) — pure import-rewire, behavior identical.

---

### `src/Forger/Forger.tsx` (component, lodash isEqual swap D-13)

**Analog:** `utils.ts:448` default-export `deepEqual` (cycle-safe, ref-key-skipping — built for exactly this memo comparator).

**Lodash import being REMOVED** (`:3`):
```ts
import { isEqual } from "lodash";
```

**Single call site** (`:105`, memo comparator):
```tsx
if (!isEqual(rest, others)) { return false; }   // → if (!deepEqual(rest, others)) { ... }
```

**Replacement:** `import deepEqual from "../utils";` then `!deepEqual(rest, others)`. RESEARCH confirms `deepEqual` handles the memo-prop edge cases (NaN/RegExp acceptable for a memo bail-out). Also: `const Component = component as any;` (`:31`) → `const Component = component;` once `ForgerControllerProps.component` is typed `React.ElementType` (ties to types.ts sweep).

---

### `src/logic/getDirtyFields.ts` (logic, lodash swap D-13)

**Analog:** shared `isObject` from `utils.ts` (centralized per utils.ts section) + local `isUndefined`.

**Lodash import being REMOVED** (`:1`):
```ts
import { isObject, isUndefined } from "lodash";
```
(Note `:2` already imports `deepEqual, isNullOrUndefined, isPrimitive, objectHasFunction` from `../utils` — the analog is RIGHT THERE; just extend it.)

**Replacement:** import `isObject` (+ a local/imported `isUndefined`) from `../utils`. Call sites (`:7,11,34,38,41`) unchanged. CRITICAL: `isObject` MUST keep lodash semantics (functions→true, null→false) or `markFieldsDirty`/`getDirtyFieldsFromDefaultValues` misclassify (RESEARCH Pitfall 4).

---

### `package.json` (config, dependency move D-08/13)

**Analog:** the EXISTING `react-dropzone` optional-peer declaration (`:50-54`) — copy this exact shape for `@hookform/devtools`.

**Existing analog to mirror (`:50-54`):**
```json
"peerDependenciesMeta": {
  "react-dropzone": { "optional": true }
}
```

**Changes:**
```jsonc
// REMOVE from "dependencies" (:42-45) — leaving it {} or removed:
//   "@hookform/devtools": "^4.3.1",
//   "lodash": "^4.17.21"

// "peerDependencies" (:46-49): raise/lower RHF floor:
"react-hook-form": "^7.34.0"          // was ^7.50.1 (RESEARCH: 7.34.0 = useFieldArray rules floor)

// "peerDependenciesMeta" (:50-54): ADD devtools, mirroring react-dropzone:
"@hookform/devtools": { "optional": true }

// "devDependencies" (:55-69):
//   ADD "@hookform/devtools": "^4.3.1"
//   REMOVE "@types/lodash": "^4.14.202"
```
Post-edit: `npm install` + `rollup -c` to flush `lodash`/`devtools` from the runtime tree (RESEARCH Runtime State Inventory).

---

## Shared Patterns

### Public-method delegation (replaces all `_*` access)
**Source:** `src/Forger/Forger.tsx:27-30` (`useController` via `useFormContext`) — the ONE place already doing it right.
**Apply to:** `useForgeValues` (setValue/getValues/trigger), `usePersist` (useWatch/useFormState), `useFieldArray` (public useFieldArray).
**Rule:** derive RHF methods from `useFormContext()` / passed `control`; NEVER touch `control._*`.

### Local native predicates (replaces lodash)
**Source:** `src/utils.ts` — `isBoolean` (`:37`), `isFunction` (`:137`), `deepEqual` (`:448`), `isNullOrUndefined` (`:24`).
**Apply to:** `utils.ts`, `validateField.ts`, `Forger.tsx`, `getDirtyFields.ts`, `useForgeValues.tsx`.
**Rule:** centralize one `isObject` in `utils.ts` (lodash semantics: fn→true, null→false), export + reuse. `isEqual`→`deepEqual`. NO new deep-compare.

### Optional-peer + guarded-load (replaces hard import)
**Source:** `package.json:50-54` `react-dropzone` optional-peer; `src/types.ts:2` `react-dropzone` `import type` (target shape).
**Apply to:** `@hookform/devtools` in `package.json` (optional peer + devDep) and `Forge.tsx` (synchronous guarded `require` behind `if (debug)`).
**Rule:** runtime-needed-but-optional packages get `import type` (types) or guarded `require` (runtime) + optional-peer declaration — never a top-level value import.

### In-place control augmentation (replaces spread)
**Source:** RESEARCH Pattern 4 (no in-repo analog — the repo currently does it WRONG at `useForge.tsx:73`).
**Apply to:** `useForge.tsx` only. `Object.assign(methods.control, forgeProps)` + return the same instance. Every consumer (`Forge.tsx`, `Forger.tsx`) keeps reading the same property names (`control.hasFields`, `control.fields`, `control.handleWizardSubmit`).

---

## No Analog Found

| File / Change | Reason | Planner guidance |
|---------------|--------|------------------|
| `types.ts:2` `import` → `import type` (react-dropzone) | NO existing `import type` anywhere in `src/` (grep confirmed zero matches) | Follow standard TS convention from RESEARCH D-10; this is the FIRST `import type` in the repo |
| `useForge.tsx` `Object.assign` augmentation | The current code is the anti-pattern; no correct in-repo precedent | Copy RESEARCH Pattern 4 verbatim |
| `Forge.tsx` guarded `require` for devtools | No existing guarded-require in repo | Copy RESEARCH "RISK-03 — synchronous guarded require" verbatim; add rollup `external` |

---

## Metadata

**Analog search scope:** `src/` (all hooks, components, utils, logic, types), `package.json`, RHF public surface.
**Files scanned:** 11 modified targets + `useSubscribe.ts` (subscription idiom) + grep across `src/` for `import type` / lodash sites.
**Key confirmations:**
- `isBoolean` (`utils.ts:37`) and `isFunction` (`utils.ts:137`) ALREADY exist locally — only need EXPORT, not authoring.
- `deepEqual` (`utils.ts:448`, default export) is the `isEqual` replacement — no new code.
- `isObject`/`isUndefined`/`isString`/`isNumber` are currently lodash-imported in `utils.ts:22` — these DO need local authoring (one shared `isObject` is net-new).
- ZERO `import type` usages exist in `src/` — react-dropzone `import type` fix has no in-repo precedent.
- `react-dropzone` optional-peer (`package.json:50-54`) is the exact template for the devtools optional-peer move.
**Pattern extraction date:** 2026-05-31

## PATTERN MAPPING COMPLETE
