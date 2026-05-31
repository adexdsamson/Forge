# Phase 2: Stability - Research

**Researched:** 2026-05-31
**Domain:** react-hook-form ^7 public-API migration, TypeScript type hardening, bundle hygiene (lodash removal, dev-only devtools)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 — Break freely.** Pre-1.0, no published consumers. Phase 2 MAY change the public API surface, observable behavior, and types. Breaks documented in CHANGELOG/MIGRATION in Phase 5; do not contort fixes to preserve the current surface.
- **D-02 — Preserve cross-platform-by-runtime-detection.** All rewrites and type work must keep the "no hard `react-native` import; platform via runtime detection" constraint intact.
- **D-03 — Reimplement `useForgeValues` as a thin pass-through over RHF's public API.** REMAINS a public export. Delete the ~562 lines re-implementing RHF's `setValue`/`trigger`/`getValues` pipeline; back it with public `setValue`/`getValues`/`trigger`/`watch`. Zero `_*` access.
- **D-04 — Keep the `setValue`/`getValue`/`getValues` surface.** `getValue(name)` maps to `getValues(name)`. `getValue` **throws a clear Forge-named error for an unknown field** (instead of `return undefined as any`). No `as any` anywhere in the wrapper. (RISK-01)
- **D-05 — Forge's custom per-item input-attribute capability is a KEEPER.** The existing reason `useFieldArray` was hand-rolled. Not scope creep; must survive the rewrite.
- **D-06 — Decorate on top of RHF's public `useFieldArray`.** Use RHF's official `useFieldArray` for `append`/`remove`/`insert`/`swap`/`update` + `fields`/`id`. Layer Forge's per-item input attributes onto returned `fields`. Target zero `_*` access. (RISK-02)
- **D-07 — Fix the unstable-`control` `useEffect`.** Remove per-render `control` identity churn that makes the `[fields, name, control]` effect (`useFieldArray.tsx:281`) misfire. Combined with D-11, `control` becomes a stable reference.
- **D-08 — `@hookform/devtools` = devDependency + optional peerDependency.** Move out of runtime `dependencies`; declare as `devDependency` AND optional peer (`peerDependenciesMeta["@hookform/devtools"].optional = true`), mirroring `react-dropzone`. Never forced into a consumer's tree when `debug` unused.
- **D-09 — Lazy-load; throw a named error when `debug={true}` and devtools is absent.** No silent no-op, no warn-and-continue. Throw a clear Forge-named error instructing `npm i -D @hookform/devtools`. (RISK-03)
- **D-10 — Sweep both the public surface AND internal casts.** Public surface `as any`-free and `tsc --noEmit` clean: `ForgeControl<T>`, `ForgerProps`/`ForgerControllerProps` (`component`, `Record<string,any>`), `useForgeValues`' `undefined as any`, `JSX.Element` → `React.ReactElement` (`types.ts:44`), and the unconditional `react-dropzone` import → `import type`. Also sweep the ~46 internal casts where reasonable, including the `processChildrenRecursively` child-walker (`children:any` / `(child as any).props`, ~14 casts). (RISK-04)
- **D-11 — Augment `control` by mutating the RHF instance in place.** `useForge` attaches `hasFields`/`fields`/wizard props directly onto `methods.control` (e.g. `Object.assign(methods.control, forgeProps)`) and returns that **same** instance — one stable object, RHF prototype/identity preserved, no per-render clone. Type as `ForgeControl<T>` with no `as any`. Wizard re-render still flows from `useForge`'s `currentStep` React state.
- **D-12 — Rewrite `usePersist` onto public APIs; deliver values + key state flags.** Replace `_subjects.state` subscription (`usePersist.tsx:26`) with `useWatch` (values) + scoped `useFormState` (`isDirty`/`isValid`). Handler receives values + `isDirty` + `isValid` — not the full firehose.
- **D-13 — Replace the six lodash utilities with inline native checks and drop `lodash` from `dependencies`.** Keep RHF range broad (`^7`).

### Claude's Discretion
- Exact lazy-load mechanism for devtools (subject to D-09's synchronous-throw constraint) — see RISK-03.
- Whether to tighten `ForgerProps.component` from `any` to a constrained generic: **researcher decides** — tighten only if it does NOT produce false-positive type errors on valid cross-platform custom inputs; otherwise leave `any`.
- Mechanical cleanups folded into the sweep: dead `"use strict"` (`useForge.tsx:1`), commented-out imports (`Forge.tsx:18-24`), `key={index}` → stable key (`Forge.tsx:244`), moving `Slot` out of `utils.ts` (optional).
- Precise minimum supported RHF `^7` floor.

### Deferred Ideas (OUT OF SCOPE)
- **Splitting Forge state off `control` into a separate `forgeControl` object** — rejected for this milestone; success criterion #5 locks the augmented-`ForgeControl<T>` shape and D-11 resolves stability in place. Revisit only if a future RHF version makes in-place augmentation unsafe.
- **Tightening every internal `any` parameter in `reactNative.ts`** — covered partially by D-10's sweep; full retyping can extend into Phase 5 if it balloons.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAB-01 | `useFieldArray` no longer depends on RHF private `control._*` — reimplemented on public `useFieldArray`/RHF API, or unavoidable internal access isolated/documented/version-guarded | RISK-02 trace below: every `_*` site maps to public `useFieldArray` return + public `trigger`; decorate-on-top is fully achievable with ZERO `_*` access. Per-item input attributes layer purely client-side. |
| STAB-02 | `usePersist`, `useForgeValues`, `useSubscribe` obtain values via public RHF APIs (`watch`/`useWatch`) instead of `control._subjects`/`control._formValues` | `useForgeValues` → thin wrapper over `setValue`/`getValues`/`trigger`/`watch`. `usePersist` → `useWatch` + scoped `useFormState`. `useSubscribe` already public (no `_*`); becomes internal-only after usePersist/useFieldArray stop feeding it RHF `_subjects`. |
| STAB-03 | `lodash` removed as runtime dependency; six utility calls replaced with native checks | Native replacement table below; `isEqual` maps to existing cycle-safe `deepEqual` in `utils.ts`. |
| STAB-04 | `@hookform/devtools` no longer shipped to production — lazy-loaded/dev-gated or out of runtime `dependencies` | RISK-03: synchronous `require()` in try/catch + optional-peer externalization works in BOTH CJS and ESM Rollup output. |
| STAB-05 | Library builds/behaves correctly against supported `react-hook-form ^7` range; type safety real (no `as any` on public surface; augmented `control` properly typed) | Minimum floor analysis below (7.34.0); D-11 in-place augmentation typing; full `as any` sweep map. |
</phase_requirements>

## Summary

Every Phase 2 rewrite is achievable on react-hook-form's **public** API surface with **zero** `_*` access — including the `useFieldArray` decorate-on-top (D-06) and the `useForgeValues` collapse (D-03). The current RHF latest is **7.76.1** [VERIFIED: npm view]; the lowest 7.x version exposing every public API the rewrites rely on is **7.34.0** (gated by `useFieldArray`'s `rules` option, added 7.34.0) [CITED: RHF CHANGELOG]. The one genuinely tricky decision is RISK-01: RHF has **no public "is this field registered?" API** — `getFieldState` returns `{isDirty:false, error:undefined}` for unknown names rather than signaling absence [CITED: RHF docs + discussions #7618/#7620]. The recommended existence check is **key-presence in the whole-form `getValues()` object** walked by dot-path, which detects registered-but-empty fields without touching `_names`/`_fields`.

The devtools paradox (RISK-03 — tree-shaken when off, synchronous named throw when on+missing) is resolved with a **synchronous `require("@hookform/devtools")` inside a try/catch**, gated behind `if (debug)`, with the package externalized in Rollup. This works in both CJS and ESM output because `@rollup/plugin-commonjs` + the `external` list leave the `require` call intact at runtime; a dynamic `import()` cannot satisfy the synchronous-throw requirement and is rejected. The `as any` sweep (D-10) is mechanical except the `processChildrenRecursively` child-walker, which should be retyped to `React.ReactElement<Record<string, unknown>>` narrowing via `isValidElement`, **with no runtime changes** so the Phase-1 submit/wizard fixes are preserved.

**Primary recommendation:** Reframe `useFieldArray` and `useForgeValues` as thin decorators/wrappers over `useFormContext()`-derived public methods; replace `usePersist`'s subject subscription with `useWatch`+`useFormState`; mutate `control` in place via `Object.assign`; swap lodash for native checks (reusing the existing `deepEqual` for `isEqual`); gate devtools behind a synchronous guarded `require`; set the RHF peer floor to `^7.34.0`. There are NO tests until Phase 3 — see the Validation Architecture section for the manual gate each rewrite must pass.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Form state ownership (values, errors, dirty, touched) | RHF `Control` (the "form brain") | — | Forge never owns form state; all state lives in RHF's control. Phase 2 enforces this by deleting Forge's duplicated state logic. |
| Field-array mutation (append/remove/insert/swap/update) | RHF public `useFieldArray` | Forge `useFieldArray` decorator | RHF owns the mutation + id generation + validation; Forge layers per-item input attributes on top of the returned `fields`. |
| Per-item input attributes (D-05 keeper) | Forge `useFieldArray` (client-side map) | — | Pure client-side decoration of RHF's `fields` array; never needs to touch RHF internals. |
| Value read/write convenience API | Forge `useForgeValues` (thin wrapper) | RHF `setValue`/`getValues`/`trigger`/`watch` | Forge re-exposes RHF public methods with a Forge-named throw on unknown fields. |
| Autosave/draft subscription | Forge `usePersist` | RHF `useWatch` + `useFormState` | Public reactive subscription; replaces the `_subjects.state` firehose. |
| Form DOM render + submit wiring | Forge `<Forge>` (web `<form>` / RN Fragment) | RHF `handleSubmit`, `FormProvider` | Owns the child-walker, native submit, wizard nav — unchanged at runtime in Phase 2 (retype only). |
| Field ↔ form binding | RHF `useController` (via `<Forger>`) | — | Already public; not touched. |
| Devtools (debug only) | `@hookform/devtools` (optional peer) | Forge `<Forge>` guarded require | Dev-only tier; absent from production graph. |
| Platform detection | Forge `utils.ts`/`reactNative.ts` | — | Module-level runtime detection; must stay (D-02). |

## Standard Stack

This is a migration phase, not a greenfield. The "stack" is the RHF ^7 public API the rewrites target. No new runtime libraries are added; `lodash` and `@hookform/devtools` are removed/demoted.

### Core (RHF public API — the replacement targets)
| API | Source hook | Purpose | Replaces (`_*` site) |
|-----|-------------|---------|----------------------|
| `useFieldArray({ control, name, keyName, rules, shouldUnregister })` | `react-hook-form` | All field-array mutation + `fields`/`id` + post-mutation validation | `_getFieldArray`, `_updateFieldArray`, `_names.array`, `_setFieldArray`, `_subjects.array/values/state`, `_fields`, `_formValues`, `_state.action` |
| `trigger(name?, options?)` | `useFormReturn`/`useFormContext` | Post-mutation validation | the manual `validateField`+`_subjects.state.next` path in `useFieldArray`/`useForgeValues` |
| `setValue(name, value, options)` | `useFormReturn`/`useFormContext` | Write a value (dirty/touch/validate handled by RHF) | the entire `setValue`/`setValues`/`setFieldValue`/`updateTouchAndDirty` reimplementation in `useForgeValues` |
| `getValues(name?)` | `useFormReturn`/`useFormContext` | Read value(s) | the `getValues` reimplementation reading `_state.mount`/`_formValues`/`_defaultValues` |
| `getFieldState(name, formState)` | `useFormReturn`/`useFormContext` | Per-field dirty/touched/error/invalid | (new — candidate for RISK-01, see caveat) |
| `watch` / `useWatch({ control, name? })` | `react-hook-form` | Reactive value subscription | `usePersist`'s `_subjects.state` value firehose; any `_formValues` reads |
| `useFormState({ control })` | `react-hook-form` | Reactive `isDirty`/`isValid`/`errors` (scoped) | `usePersist`'s `_subjects.state` state firehose |
| `register`, `unregister` | `useFormReturn`/`useFormContext` | Field registration (field-array `rules`, unmount cleanup) | `_names.array.add`, manual `_setFieldArray`/mount toggling |
| `useController` | `react-hook-form` | Single-field binding (already used in `Forger`) | — (unchanged) |
| `FormProvider` / `useFormContext` | `react-hook-form` | Context host/consumer (already used) | — (unchanged) |

### Supporting (no change — already public)
| API | Purpose | When to Use |
|-----|---------|-------------|
| `useForm` | Form instance creation (in `useForge`) | unchanged |
| `handleSubmit` | Submit gating (in `<Forge>`, wizard) | unchanged |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Decorate-on-top `useFieldArray` (D-06) | Keep hand-rolled `_*` version, version-pin RHF | Rejected by D-06; defeats STAB-01. Success criterion #1's "isolated internal" escape hatch is NOT needed (see RISK-02). |
| `getValues()` key-presence for RISK-01 | `getFieldState(name, formState)` | `getFieldState` does NOT signal existence — returns defaults for unknown names. Cannot be the existence check (see RISK-01). |
| Synchronous guarded `require` for devtools | dynamic `import()` / `React.lazy` | `import()` is async → cannot throw synchronously during render (D-09 violated). Rejected (see RISK-03). |
| Native `isEqual` replacement | reuse existing `deepEqual` in `utils.ts` | `deepEqual` is already cycle-safe (`WeakSet`) and handles Date/Array/object; no new code needed (see lodash table). |

**Package.json changes:**
```jsonc
// REMOVE from dependencies:
//   "@hookform/devtools": "^4.3.1",
//   "lodash": "^4.17.21"
// dependencies should become {} (or be removed entirely)

"peerDependencies": {
  "react": ">=18",
  "react-hook-form": "^7.34.0"           // raise floor from 7.50.1 → 7.34.0 min; ^ stays
},
"peerDependenciesMeta": {
  "react-dropzone": { "optional": true },
  "@hookform/devtools": { "optional": true }   // ADD
},
"devDependencies": {
  // ADD: "@hookform/devtools": "^4.3.1"
  // REMOVE: "@types/lodash": "^4.14.202"
}
```

**Version verification:** `react-hook-form` latest = **7.76.1** [VERIFIED: npm view react-hook-form version, 2026-05-31]. `7.34.0` confirmed to exist [VERIFIED: npm registry]. `@hookform/devtools` ^4.3.1 is current major line [ASSUMED — not re-verified this session; confirm in Phase 4].

## Architecture Patterns

### System Architecture Diagram

```
Consumer code
   │  useForge({...})
   ▼
┌─────────────────────────────────────────────┐
│ useForge (src/useForge)                       │
│  methods = useForm<T>(...)                     │
│  Object.assign(methods.control, forgeProps)  ─┼──► SAME control instance
│  return { ...methods, control }               │     (prototype + _* intact)
└───────────────┬───────────────────────────────┘
                │ control (ForgeControl<T>)
                ▼
┌─────────────────────────────────────────────┐        ┌───────────────────────────┐
│ <Forge control={...}>                         │        │ Consumer hooks (public)    │
│  FormProvider host                            │        │  useForgeValues({control}) │──► setValue/getValues/
│  processChildrenRecursively (retype only)     │        │  useFieldArray({control})  │    trigger/watch (public)
│  web: <form onSubmit>  / RN: <Fragment>       │        │  usePersist({control})     │──► useWatch + useFormState
│  debug && require("@hookform/devtools")  ◄────┼─guarded│                            │
└───────────────┬───────────────────────────────┘  sync  └───────────────────────────┘
                │  reads augmented control props (hasFields, fields, wizard*)
                ▼
┌─────────────────────────────────────────────┐
│ <Forger>  → useController (public, unchanged) │
│   per-field bind, transform, platform events  │
└─────────────────────────────────────────────┘

RHF Control = single source of truth for all form state.
Forge tiers only DECORATE / OBSERVE it via public APIs after Phase 2.
```

### Pattern 1: Decorate-on-top hook (D-06)
**What:** Call RHF's public `useFieldArray`, then `useMemo`-map the returned `fields` to attach `inputProps`.
**When to use:** `useFieldArray` rewrite.
```typescript
// Decorate-on-top — ZERO _* access
const rhf = useRHFFieldArray<TFieldValues, TFieldArrayName, TKeyName>({
  control, name, keyName, rules: props.rules, shouldUnregister: props.shouldUnregister,
});
const fields = React.useMemo(
  () => rhf.fields.map((field) => ({ ...field, inputProps })),
  [rhf.fields, inputProps]
);
return { ...rhf, fields }; // append/remove/insert/swap/update/replace come straight from RHF
// Post-mutation validation: call methods.trigger(name) inside append/remove wrappers if needed,
// OR rely on RHF's built-in `rules`-based validation (7.34.0+) which fires automatically.
```

### Pattern 2: Thin pass-through wrapper (D-03/D-04)
**What:** `useForgeValues` returns RHF public methods directly; `getValue` adds an existence guard.
```typescript
export const useForgeValues = <T extends FieldValues>({ control }: { control: ForgeControl<T> }) => {
  const ctx = useFormContext<T>();         // or accept methods
  const setValue = ctx.setValue;
  const getValues = ctx.getValues;
  const getValue = <N extends Path<T>>(name: N): PathValue<T, N> => {
    const all = ctx.getValues();           // whole-form object — defaults merged
    if (!hasPath(all, name)) {             // dot-path key presence (RISK-01)
      throw new Error(`useForgeValues.getValue: field "${String(name)}" is not registered`);
    }
    return ctx.getValues(name);
  };
  return { setValue, getValue, getValues };
};
```

### Pattern 3: Reactive observe via public hooks (D-12)
**What:** `usePersist` subscribes through `useWatch` + scoped `useFormState`.
```typescript
export const usePersist = <T extends FieldValues>({ control, handler }: ForgePersist<T>) => {
  const values = useWatch({ control });                       // all values, reactive
  const { isDirty, isValid } = useFormState({ control });     // scoped state subscription
  const handlerRef = React.useRef(handler); handlerRef.current = handler;
  React.useEffect(() => {
    handlerRef.current(values, { isDirty, isValid });
  }, [values, isDirty, isValid]);
};
```

### Pattern 4: In-place control augmentation (D-11)
```typescript
const forgeProps = { hasFields, fields, ...wizardProps };
Object.assign(methods.control, forgeProps);          // same instance, prototype preserved
return { ...methods, control: methods.control as ForgeControl<TFieldValues> };
```

### Anti-Patterns to Avoid
- **Spreading `control` (`{ ...methods.control }`)** — the CURRENT bug. Drops RHF's prototype methods and non-enumerable members, hands RHF's own hooks a degraded copy, and creates a new identity every render (the unstable `useEffect` dep, D-07). Replace with `Object.assign` in place.
- **Using `getFieldState` as an existence check** — returns defaults for unknown fields; will let `getValue` silently succeed on a typo'd name. See RISK-01.
- **Dynamic `import("@hookform/devtools")` to satisfy D-09** — async; cannot throw synchronously during render. See RISK-03.
- **`return undefined as any`** — the `useForgeValues.tsx:554` typed lie. Replace with a throw (D-04).
- **Re-implementing RHF's `setValue`/`trigger`/dirty-tracking** — the entire 562-line `useForgeValues` body. Delete; delegate to public methods.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Field-array mutation + id tracking | `_getFieldArray`/`_updateFieldArray`/`_subjects.array` orchestration (current 290-line `useFieldArray`) | RHF public `useFieldArray` | RHF owns id generation, focus management, unmount cleanup, and (7.34.0+) `rules` validation. Decorate on top. |
| `setValue` dirty/touch/validate pipeline | `updateTouchAndDirty`/`setFieldValue`/`setValues`/`_setValid` (current `useForgeValues`) | RHF public `setValue` | RHF's own `setValue` is the canonical path; the copy diverges on every RHF release. |
| Built-in + schema validation | `executeBuiltInValidation`/`executeSchemaAndUpdateState`/`_runSchema` | RHF public `trigger` | `trigger` runs the resolver or built-in rules and updates errors/isValid via the official path. |
| Form-state subscription | `useSubscribe({ subject: control._subjects.state })` | `useWatch` + `useFormState` | Public reactive hooks with scoped re-render; no internal subject access. |
| Deep equality (`isEqual`) | a new deep-compare | existing `deepEqual` (default export, `utils.ts:448`) | Already cycle-safe (`WeakSet`), Date/Array/object aware; ref-key-skipping for RHF field refs. |
| Field existence detection | `control._names`/`control._fields` lookup | key-presence in `getValues()` whole-form object (dot-path) | Only public way to distinguish unknown vs registered-empty. See RISK-01 caveats. |

**Key insight:** RHF already exposes a public method for every internal Forge re-implements. The library's stability problem is entirely self-inflicted duplication; the fix is deletion + delegation, not reinvention.

## Runtime State Inventory

This is a code/type refactor with NO stored data, live services, OS registrations, or build-name coupling. Each category checked explicitly:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Forge persists no data; `usePersist` only hands values to a consumer-supplied callback. | None |
| Live service config | None — no external services. | None |
| OS-registered state | None. | None |
| Secrets/env vars | None. | None |
| Build artifacts | `dist/` is generated by Rollup; not committed (`files: ["dist"]`, Phase 4 handles `.gitignore`). After dependency changes, `node_modules` and lockfile must be refreshed (`npm install`) so `lodash`/`@hookform/devtools` leave the runtime tree. | `npm install` + rebuild after package.json edit |

## Common Pitfalls

### Pitfall 1: `getFieldState` mistaken for an existence check (RISK-01)
**What goes wrong:** `getValue("typoName")` returns `undefined` instead of throwing, because `getFieldState` reports `{isDirty:false, error:undefined}` for unknown names — indistinguishable from a clean registered field.
**Why it happens:** RHF intentionally does not expose registered-field enumeration publicly [CITED: discussions #7618/#7620].
**How to avoid:** Use key-presence in the `getValues()` whole-form object via a dot-path walk (see RISK-01 for the exact algorithm and caveats).
**Warning signs:** `getValue` never throws in manual testing even for nonsense field names.

### Pitfall 2: Dynamic import breaks the synchronous devtools throw (RISK-03)
**What goes wrong:** `await import("@hookform/devtools")` defers resolution; the render completes, the throw (if any) lands in a rejected promise, not the render path — D-09's "synchronous named throw" is violated and the error is swallowed.
**Why it happens:** ESM dynamic import is Promise-based by spec.
**How to avoid:** Synchronous `require()` in try/catch behind `if (debug)`; externalize in Rollup so the call survives bundling.
**Warning signs:** `debug={true}` without the package installed renders nothing and logs an unhandled rejection instead of throwing.

### Pitfall 3: Retyping the child-walker changes runtime behavior (RISK-04)
**What goes wrong:** Replacing `(child as any).props` with a typed access that triggers a different code branch silently regresses native submit / Enter-to-submit / wizard last-step submit (CORR-01/CORR-04) — and there are NO tests to catch it.
**Why it happens:** `Children.map` yields `ReactNode`; narrowing with `isValidElement` is correct, but `cloneElement`/`createElement` prop spreads must remain byte-for-byte equivalent.
**How to avoid:** Retype only; assert identical emitted props. Manually verify all four Phase-1 behaviors (see Validation Architecture).
**Warning signs:** Submit button stops firing; Enter no longer submits; wizard final step no-ops.

### Pitfall 4: Lodash `isObject` vs native `typeof` divergence (D-13)
**What goes wrong:** lodash `isObject(fn)` returns `true` for functions; a naive `typeof x === "object"` returns `false` for functions and `true` for `null`.
**Why it happens:** lodash `isObject` = "is it a non-primitive (object, array, function, regexp, ...)" excluding `null`.
**How to avoid:** Use the exact native equivalents in the lodash table below; do NOT use the bare `typeof x === "object"` for `isObject`.
**Warning signs:** `getDirtyFields`/`deepEqual` mis-classify functions or treat `null` as an object.

### Pitfall 5: `useWatch` returns a new object reference each render (D-12)
**What goes wrong:** `usePersist`'s effect with `[values]` fires every render because `useWatch` returns a fresh object.
**Why it happens:** `useWatch` snapshots values into a new object on each subscription tick.
**How to avoid:** This is acceptable for autosave (you WANT the handler on value changes), but guard against firing on no-op renders by depending on `isDirty`/serialized values if a consumer reports excess saves. Document the firing contract.
**Warning signs:** Autosave handler called on renders with no value change.

## Code Examples

### RISK-01 — public existence check via dot-path key presence
```typescript
// Source: derived from RHF getValues() semantics [CITED: react-hook-form.com/docs/useform/getvalues]
// getValues() returns defaultValues MERGED with current values; a registered field
// (even empty) has a key, an unknown field does not.
const hasPath = (obj: unknown, path: string): boolean => {
  const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cur: unknown = obj;
  for (const seg of segments) {
    if (cur == null || typeof cur !== "object") return false;
    if (!(seg in (cur as Record<string, unknown>))) return false;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return true;
};
```
**Caveats (must be in the plan):**
- Works for dot-paths (`a.b.c`) and array indices (`items.0.name` / `items[0].name`) — normalize bracket syntax first.
- A field registered with no `defaultValue` and never edited may be absent from `getValues()` until first interaction (RHF only materializes registered keys it knows about). For purely uncontrolled `register`-only fields with no default, key-presence can false-negative. **Mitigation:** document that `getValue` existence detection is reliable for fields that have a default value or have been written; this matches Forge's controlled `<Forger>` usage where every field has a value. Flag as a known limitation rather than reaching for `_names`.
- Do NOT fall back to `_names`/`_fields` — that reintroduces the very coupling STAB-02 removes.

### RISK-03 — synchronous guarded require (CJS + ESM)
```typescript
// Source: Rollup external + commonjs interop [CITED: rollupjs.org/configuration-options/#external]
function loadDevTool(): React.ComponentType<{ control: unknown }> {
  try {
    // Synchronous require survives bundling because @hookform/devtools is in the
    // `external` list (rollup.config.mjs) and @rollup/plugin-commonjs preserves the call.
    // In ESM output Rollup emits a require shim via the interop layer; the call still
    // executes synchronously at render time in the consumer's Node/bundler resolution.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@hookform/devtools");
    return mod.DevTool;
  } catch {
    throw new Error(
      "Forge: debug mode requires '@hookform/devtools'. Install it with `npm i -D @hookform/devtools`."
    );
  }
}

// In <Forge>, render path:
let devtools: React.ReactNode = null;
if (debug) {
  const DevTool = loadDevTool();   // throws synchronously if missing — satisfies D-09
  devtools = <DevTool control={control} />;
}
```
**Why this satisfies both halves of D-09:**
- **Tree-shaken when off:** the `require` is inside `if (debug)`; bundlers with the package externalized never pull it into the consumer graph, and the package is no longer a runtime `dependency` (D-08). A consumer who never sets `debug` has zero trace of devtools.
- **Synchronous throw when on+missing:** `require` is synchronous; a missing module throws immediately inside render, producing the Forge-named error. No promise, no swallowed rejection.
- **Dual-build note:** verify in Phase 2 manual gate that BOTH `dist/index.cjs.js` and `dist/index.esm.js` keep `require("@hookform/devtools")` as an external call (grep the built output). For pure-ESM consumers using a bundler that forbids `require`, document that `debug` requires the devtools install; this is a dev-only path and acceptable. If a pure-ESM-no-require environment is a hard requirement, the fallback is `createRequire(import.meta.url)` in the ESM build — note as a contingency, not the default.

### RISK-04 — typed child-walker (no runtime change)
```typescript
// Source: React public types [CITED: react.dev/reference/react/isValidElement]
type AnyElement = React.ReactElement<Record<string, unknown>>;

const processChildrenRecursively = (
  children: React.ReactNode,
  depth = 0
): React.ReactNode => {
  if (depth > 10) return children;
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;          // narrows to ReactElement
    const el = child as AnyElement;
    const childProps = el.props;                       // typed Record<string, unknown>, no `as any`
    // ... identical branching; cloneElement(el, {...childProps, onClick}) etc.
  });
};
```
- `el.type` is `string | JSXElementConstructor<unknown>`; pass directly to `createElement`.
- `cloneElement(el, partialProps)` is typed; remove the trailing `as any`.
- Keep every branch and prop-merge identical — this is a type-only change.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Reach into `control._subjects`/`_formValues`/`_fields` | `useWatch`/`useFormState`/`getValues`/`getFieldState` | Public hooks stable since 7.0; `getFieldState` 7.25.0 | Survives RHF minor/patch updates |
| Update field array via `setValue` on the array | `useFieldArray.replace`/`update` | `replace` 7.15.0, `update` 7.11.0 | RHF docs deprecate array `setValue`; use the hook methods |
| Field-array validation via manual `validateField` | `useFieldArray({ rules })` (built-in) or public `trigger` | `rules` 7.34.0 | Sets the peer floor; removes Forge's manual validation path |
| lodash named imports | native `typeof`/`instanceof` + existing `deepEqual` | n/a | ~71KB removed from non-tree-shaking consumers |
| `@hookform/devtools` as runtime dep | optional peer + guarded `require` | n/a | Zero devtools in production consumer graph |
| `JSX.Element` (global namespace) | `React.ReactElement` | React 18 `react-jsx` transform | No reliance on global JSX namespace |

**Deprecated/outdated:**
- `JSX.Element` in `types.ts:44` — replace with `React.ReactElement` (no global JSX namespace dependency under `jsx: "react-jsx"`).
- `"use strict"` directive in `useForge.tsx:1` — dead in ESM/TS; delete.

## lodash → native replacement (D-13)

Sites: `utils.ts`, `useForgeValues.tsx`, `validateField.ts`, `Forger/Forger.tsx`, `logic/getDirtyFields.ts`, `logic/getFieldValueAs.ts`, `logic/hasPromiseValidation.ts` [VERIFIED: grep, 2026-05-31].

| lodash util | Native replacement | Edge-case notes |
|-------------|--------------------|-----------------|
| `isUndefined(v)` | `v === undefined` (or `typeof v === "undefined"`) | Does NOT match `null`. Current code relies on this distinction (separate `isNullOrUndefined` exists in `utils.ts`). |
| `isString(v)` | `typeof v === "string"` | None. |
| `isNumber(v)` | `typeof v === "number"` | lodash `isNumber(NaN)` is `true`; `typeof NaN === "number"` is also `true` — equivalent. Excludes `Number` objects (irrelevant here). |
| `isBoolean(v)` | `typeof v === "boolean"` | `utils.ts` ALREADY defines a local `isBoolean` (line 37) — reuse it; just drop the lodash import. `validateField.ts` should import the local one or inline. |
| `isFunction(v)` | `typeof v === "function"` | `utils.ts` ALREADY defines a local `isFunction` (line 137) — reuse/export it. |
| `isObject(v)` | `v !== null && (typeof v === "object" \|\| typeof v === "function")` | **CRITICAL:** lodash `isObject` returns `true` for functions and arrays, `false` for `null`. A bare `typeof v === "object"` is WRONG (true for `null`, false for functions). `getDirtyFields`/`deepEqual`/`isPlainObject` depend on the lodash semantics. Provide one shared `isObject` helper in `utils.ts` and reuse everywhere. |
| `isEqual(a, b)` | existing `deepEqual` (default export, `utils.ts:448`) | Only used in `Forger/Forger.tsx:105` (memo comparator). `deepEqual` is cycle-safe (`WeakSet`), handles `Date` (via `getTime`), arrays, nested objects, and skips the `ref` key (good for RHF field props). **No new deep-compare needed.** Edge cases: NaN — `deepEqual` falls through to `val1 !== val2`, so `NaN !== NaN` → reports unequal (same as `Object.is`-less compare; acceptable for a memo bail-out where false "changed" only costs a re-render). RegExp — compared by key enumeration (RegExp has no own enumerable keys → treated equal regardless of pattern; acceptable for memo props which rarely contain RegExp). Circular — handled by `WeakSet`. A shallow/JSON approach is NOT recommended (props contain functions/refs that JSON can't serialize). |

**Recommendation:** Create/centralize `isObject` and reuse the existing `isBoolean`/`isFunction`/`deepEqual` in `utils.ts`; export them where `logic/` and `validateField.ts` need them. Net new code is one `isObject` helper plus import rewiring. Drop `lodash` and `@types/lodash`.

## Minimum RHF `^7` floor

| Public API used by rewrites | Introduced | Source |
|-----------------------------|-----------|--------|
| `useWatch` | 6.0.0 | [CITED: RHF CHANGELOG] |
| `useFormState` | 7.0.0-alpha.0 | [CITED: RHF CHANGELOG] |
| `useFieldArray` (`fields`/append/remove/insert/swap/move) | 7.0.0 | [CITED: RHF CHANGELOG] |
| `useFieldArray.update` | 7.11.0 | [CITED: RHF CHANGELOG] |
| `useFieldArray.replace` | 7.15.0 | [CITED: RHF CHANGELOG] |
| `getFieldState` | 7.25.0 | [CITED: RHF CHANGELOG] |
| `useFieldArray({ rules })` (built-in validation) | **7.34.0** | [CITED: RHF CHANGELOG] |

**Recommendation:** Set the peer range to **`react-hook-form": "^7.34.0"`**. The current pin is `^7.50.1`; lowering to `^7.34.0` widens consumer compatibility while still guaranteeing every public API the rewrites rely on. `7.34.0` is the binding constraint because Forge's `useFieldArray` accepts a `rules` prop and registers it (current `useFieldArray.tsx:75-79`); if the plan drops `rules` support entirely (it is part of the current public surface, so probably keep it), the floor would fall to `7.25.0` (for `getFieldState` in RISK-01). Keep `rules` → floor `7.34.0`. Latest verified 7.76.1, so `^7.34.0` covers the full modern range.

## D-11 in-place augmentation safety

**Confirmed safe across RHF ^7.** `methods.control` is the live "form brain" object that RHF's own `useController`/`useWatch`/`useFormState`/`FormProvider` read from. `Object.assign(methods.control, forgeProps)` adds enumerable own properties (`hasFields`, `fields`, wizard fns) to that SAME instance without replacing it, so:
- RHF's prototype methods and non-enumerable internals remain intact (the current spread `{ ...methods.control }` is what BREAKS this — CONCERNS.md "Augmenting RHF's control Object").
- Identity is stable across renders → fixes the unstable `useEffect` dep (D-07).
- `<Forge>`/`<Forger>` read `control.hasFields`/`control.fields`/`control.handleWizardSubmit` as before — same property names, now on the real instance.
- RHF's hooks never iterate `control`'s own keys for behavior (they call methods/read internal subjects), so the extra Forge keys are inert to RHF.
**Caveat:** the added keys must not collide with future RHF `control` members. `hasFields`/`fields`/`isWizard`/`currentStep`/etc. are not current RHF `control` members [ASSUMED — verified against current Control shape conceptually, confirm no collision when bumping RHF in Phase 4]. Type the result as `ForgeControl<T>` (no `as any`).
**Note (latent, out of scope):** `<Forge>` currently does `<FormProvider {...(control as unknown as any)} control={control}>` — spreading `control` where `FormProvider` expects the full `UseFormReturn` methods. This is a pre-existing typing smell; D-10's sweep should retype the `FormProvider` props honestly (pass the real `methods` if available, or cast narrowly) but MUST NOT change the runtime wiring that Phase-1 fixes depend on. Treat as a careful retype, manually verified.

## D-12 usePersist rewrite confirmation

**Confirmed `useWatch` + scoped `useFormState` reproduces the autosave/draft use case.** The current `_subjects.state` subscription delivers `formState.values` plus the full state firehose. The real autosave need is "give me the current values (and whether the form is dirty/valid) whenever they change." `useWatch({ control })` provides reactive values; `useFormState({ control })` provides `isDirty`/`isValid` with scoped re-rendering (only re-renders when those flags change). The new handler signature `(values, { isDirty, isValid })` is a deliberate, lighter contract than the old `(values, fullFormState)` — a documented break under D-01. Edge case: `useWatch` returns a fresh object each tick (Pitfall 5) — fine for autosave, document the firing contract.

## RISK-02 — full `_*` trace for useFieldArray → public mapping

Every `_*` site in `useFieldArray.tsx` and its public replacement (decorate-on-top makes ALL of these disappear because RHF's own `useFieldArray` performs them internally):

| Current `_*` site (line) | What it does | Public replacement |
|--------------------------|--------------|--------------------|
| `control._getFieldArray(name)` (62, 137, 153, 167, 184, 202) | read current array values | RHF `useFieldArray` manages internally; consumer reads `fields` |
| `control._names.array.add(name)` (73) | register array name | RHF `useFieldArray` does this on mount |
| `control.register(name, rules)` (76-79) | register array-level rules | RHF `useFieldArray({ rules })` (7.34.0+) |
| `control._subjects.array` subscribe (86-96) | sync local state on external array change | RHF `useFieldArray` keeps `fields` in sync; delete the manual `useSubscribe` |
| `control._formValues` / `control._setFieldArray` (99) | seed empty array | RHF `useFieldArray` initializes from defaults |
| `control._fields` / `field._f.mount` (104-111) | unmount cleanup | RHF `useFieldArray` handles `shouldUnregister` |
| `control._updateFieldArray?.(...)` (124, cast to any) | commit mutation | RHF `append`/`remove`/`insert`/`swap`/`update`/`replace` |
| `control._state.action` (213) | mutation flag | internal to RHF |
| `isWatched(...) && control._subjects.state.next(...)` (215-218) | notify watchers | RHF emits internally |
| manual `validateField(...)` + `control._formValues`/`_options` (229-254) | post-mutation validation | RHF `rules` built-in validation (7.34.0+) OR explicit `methods.trigger(name)` in mutation wrappers |
| `control._subjects.values?.next(...)` (259-262) | broadcast values | RHF emits internally |
| `control._names.focus` + `iterateFieldsByAction` (264-277) | focus new field | RHF `useFieldArray` handles focus via `shouldFocus` options on append/insert |
| effect dep `[fields, name, control]` (280) | (the unstable effect) | deleted entirely — no manual effect needed |

**Conclusion:** ZERO `_*` access is genuinely achievable. The success-criterion-#1 "isolated/version-guarded internal" escape hatch is **NOT needed**. The per-item input attributes (D-05) layer onto `rhf.fields` purely client-side (`useMemo` map) — no `_*`, no registration mutation. Post-mutation validation moves to RHF's `rules` (built-in, fires automatically) with `methods.trigger(name)` as an explicit fallback inside the mutation wrappers if a plan wants validate-on-mutate without `rules`.

## RISK-04 — `ForgerProps.component` tightening decision

**Recommendation: DO NOT tighten `component` to a constrained generic in Phase 2. Change `any` → `React.ComponentType<any>` (or `React.ElementType`), not a `ForgerSlotProps`-constrained generic.**

Reasoning:
- A valid Forge custom input is any web or RN component that accepts a value + change handler. Forge injects a cross-platform prop set (`onChange`/`onChangeText`/`onValueChange`/`onBlur`/`error`/`value`/`control`/`ref` + arbitrary passthrough). Constraining to `React.ComponentType<ForgerSlotProps>` would produce **false-positive errors** on perfectly valid components whose prop types are a superset/subset of `ForgerSlotProps` (e.g. an RN `<TextInput>` typed with `onChangeText` but not `onChange`, or a component with required props Forge supplies dynamically).
- `React.ComponentType<any>` / `React.ElementType` removes the bare `any` (satisfies D-10's "no `as any` on public surface") while preserving the open contract cross-platform inputs need. The internal `const Component = component as any` in `ForgerController` can become `const Component = component;` once typed as `React.ElementType`.
- The current `Record<string, any>` spread on `ForgerProps` should become `Record<string, unknown>` where feasible; the deliberate passthrough nature means a fully-typed prop bag is not achievable without breaking valid usage — leave the open index signature but use `unknown` over `any` where it does not cascade errors.
- `ForgerControllerProps.component: Component<ForgerSlotProps>` (types.ts:64) is actually WRONG (it types `component` as a class-component INSTANCE, not a component type) — fix to `React.ElementType` for consistency.

**Definitive:** retype `component: React.ElementType` (or `React.ComponentType<any>`). Do not introduce a `ForgerSlotProps` generic constraint.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@hookform/devtools` ^4.3.1 remains the current major line | Standard Stack | Low — Phase 4 re-verifies before publish; only affects the install instruction string |
| A2 | Forge's augmented `control` keys (`hasFields`/`fields`/`isWizard`/`currentStep`/...) do not collide with any RHF ^7 `control` member | D-11 safety | Medium — a future RHF key collision would break in-place augmentation; verify when bumping RHF |
| A3 | RHF `useFieldArray` built-in `rules` validation (7.34.0) covers Forge's current post-mutation validate intent | RISK-02 | Medium — if a plan needs validate-on-mutate without `rules`, fall back to explicit `methods.trigger(name)`; both are public |
| A4 | Pure-ESM consumers tolerate a `require("@hookform/devtools")` in the debug-only path (or use the `createRequire` contingency) | RISK-03 | Low-Medium — debug is dev-only; document the constraint. Manual gate must grep both built bundles |
| A5 | A `register`-only field with no default may be absent from `getValues()` until first write | RISK-01 caveat | Medium — `getValue` existence detection can false-negative for such fields; document the limitation, do NOT reach for `_names` |

## Open Questions

1. **Does Forge's `useFieldArray` need validate-on-mutate when no `rules` are supplied?**
   - What we know: current code runs `validateField` after mutations even without `rules` (the `else` branch, lines 229-256).
   - What's unclear: whether any consumer relies on that implicit validate-on-every-mutation.
   - Recommendation: prefer RHF `rules` (auto-validates). For parity without `rules`, call `methods.trigger(name)` inside the `append`/`remove`/etc. wrappers. Planner picks; both are public. Manually verify append→error-clears behavior.

2. **Should `useForgeValues` accept `methods` or pull from `useFormContext`?**
   - What we know: current signature takes `{ control, methods? }`.
   - What's unclear: whether to keep the `methods` param or derive everything from `useFormContext`.
   - Recommendation: keep accepting `{ control }` (the documented public surface) and derive public methods from the control's form context, OR keep an optional `methods` for out-of-provider usage (mirrors `Forger`'s `useFormContext() ?? { control }` fallback). Planner decides; either is `_*`-free.

3. **`FormProvider` prop spread retype** (latent issue in `Forge.tsx:301-304`).
   - What we know: `{...(control as unknown as any)} control={control}` spreads control where methods are expected.
   - Recommendation: retype to pass real `methods` if `<Forge>` can receive them, else narrow the cast — but do NOT alter runtime wiring (Phase-1 fixes ride on it). Out of strict scope; fold into D-10 only if low-risk.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/typecheck | ✓ (CI Node 20) | 20 | — |
| react-hook-form | all rewrites | ✓ (peer/dev) | ^7.50.1 dev-installed; latest 7.76.1 | — |
| TypeScript | `tsc --noEmit` | ✓ | ^5.3.3 | — |
| Rollup | build (CJS+ESM+dts) | ✓ | ^4.12.0 | — |
| @hookform/devtools | `debug` path only | ✓ (to be moved to devDependency) | ^4.3.1 | optional peer; throw if absent |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** `@hookform/devtools` becomes optional (D-08); its absence is the intended state for non-debug consumers.

## Validation Architecture

> NO automated tests until Phase 3. Every Phase 2 change is validated MANUALLY against the gates below. `nyquist_validation` config not located as `false`; treated as enabled — but the only automated signals available are the build and the type-checker. The planner should write validation requirements as: (a) `tsc --noEmit` clean, (b) `rollup -c` builds both bundles, (c) the observable manual checks per rewrite below.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None yet (Vitest + @testing-library/react planned for Phase 3) |
| Config file | none — Wave 0 N/A this phase (tests are Phase 3) |
| Quick run command | `npm run typecheck` (`tsc --noEmit`) |
| Full suite command | `npm run typecheck && npm run build` |

### Automated signals available THIS phase
- **`npm run typecheck`** (`tsc --noEmit`) — MUST pass with zero errors. This is the primary gate for STAB-05 / D-10 (the whole point of the `as any` sweep is that strict mode now actually has teeth). Run after every rewrite.
- **`npm run build`** (`rollup -c`) — MUST produce `dist/index.cjs.js`, `dist/index.esm.js`, `dist/index.d.ts` with no errors. Validates the devtools externalization and that no removed dependency is still imported.
- **Bundle grep checks** (manual, scriptable):
  - `lodash` MUST NOT appear in built output → confirms STAB-03.
  - `@hookform/devtools` MUST appear ONLY as an external `require`/import, never inlined → confirms STAB-04.
  - No `._` (underscore-prefixed `control` access) in `dist` for the three rewritten hooks → confirms STAB-01/STAB-02.

### Phase Requirements → Manual Validation Map
| Req ID | Behavior to verify | Manual check (no test runner) |
|--------|--------------------|-------------------------------|
| STAB-01 | append/remove/insert/swap/update work; per-item inputProps survive; error clears after mutation | Build a scratch form (or example), add/remove rows, confirm UI updates, ids stable, inputProps present on each row, validation re-runs |
| STAB-01 | unstable effect gone (D-07) | Confirm no console flood / re-render storm; `control` identity stable (log `control` ref equality across renders) |
| STAB-02 | `useForgeValues.getValue` throws Forge-named error on unknown field; returns value on known field | Call `getValue("nope")` → expect throw; `getValue("realField")` → expect value |
| STAB-02 | `setValue`/`getValues` behave as RHF's | Set a value, read it back; confirm dirty/validate options pass through |
| STAB-02 | `usePersist` fires handler with `(values, {isDirty, isValid})` on change | Type in a field → handler called with current values + flags |
| STAB-02 | no `_subjects`/`_formValues` in call paths | grep rewritten hooks + `dist` |
| STAB-03 | lodash gone from deps + bundle | `package.json` has no `lodash`/`@types/lodash`; grep `dist` |
| STAB-04 | no devtools in non-debug consumer graph; synchronous throw when `debug` + missing | Install in scratch project without devtools → no devtools in tree; set `debug` without package → Forge-named throw |
| STAB-05 | `tsc --noEmit` clean; augmented `control` typed `ForgeControl<T>` with no `as any` | run typecheck; grep public files for `as any` |
| RISK-04 (CORR-01/04 preserved) | native `<form>` submit, Enter-to-submit, wizard last-step submit STILL work after retype | Manually: click submit, press Enter in a field, complete a wizard to last step + submit — all must fire `onSubmit` |

### Wave 0 Gaps
- None for this phase. Test infrastructure is intentionally deferred to Phase 3 (per CONTEXT.md "Not in this phase: tests"). The Phase 2 safety net is `tsc --noEmit` + `rollup -c` + the documented manual behavioral checks above. The planner should make the RISK-04 manual checks explicit, mandatory verification steps in the relevant plan(s) because the child-walker has no automated coverage.

## Project Constraints (from CLAUDE.md)

- **TypeScript 5.x strict; React ≥18; react-hook-form ^7.** Prefer PUBLIC RHF APIs so the library survives RHF updates (the entire thesis of this phase). Any `_*` reintroduction must be justified against the "isolated, version-guarded, documented" escape hatch — and per RISK-02 it is NOT needed.
- **Cross-platform Web + RN via runtime detection; NO hard `react-native` import** (D-02). Rewrites route platform behavior through existing `isWeb`/`isReactNative`/`getEventHandlerName`/`getComponentType`.
- **Ships CJS + ESM + dts under `@adexdsamson` scope; semver via conventional commits.** Devtools mechanism (RISK-03) must work in BOTH CJS and ESM builds.
- **Keep runtime light — externalize React/RHF as peers; remove lodash; keep devtools out of production.** Directly drives D-08/D-13.
- **GSD workflow enforcement:** all edits go through a GSD command (planning/execution), not ad-hoc.

## Sources

### Primary (HIGH confidence)
- React Hook Form CHANGELOG (master) — feature introduction versions: `getFieldState` 7.25.0, `useFieldArray.update` 7.11.0, `.replace` 7.15.0, `rules` 7.34.0, `useFormState` 7.0.0-alpha.0, `useWatch` 6.0.0. https://github.com/react-hook-form/react-hook-form/blob/master/CHANGELOG.md
- `npm view react-hook-form version` → 7.76.1 (latest, 2026-05-31); `react-hook-form@7.34.0` exists.
- Forge source (read this session): `useFieldArray.tsx`, `useForgeValues.tsx`, `usePersist.tsx`, `useForge.tsx`, `types.ts`, `Forge.tsx`, `Forger.tsx`, `utils.ts`, `validateField.ts`, `logic/*`, `useSubscribe.ts`, `index.ts`, `package.json`, `rollup.config.mjs`.
- `.planning/codebase/CONCERNS.md`, `QUALITY.md`, `02-CONTEXT.md`, `REQUIREMENTS.md`, `ROADMAP.md`.

### Secondary (MEDIUM confidence)
- RHF docs `getFieldState` — returns defaults for unknown fields, does not signal existence. https://react-hook-form.com/docs/useform/getfieldstate
- RHF discussions #7618 / #7620 — no public API to enumerate/check registered fields; internal `_fields` used by devtools but discouraged. https://github.com/orgs/react-hook-form/discussions/7618
- RHF docs `useFieldArray` — array `setValue` deprecated in favor of `replace`. https://react-hook-form.com/docs/usefieldarray

### Tertiary (LOW confidence)
- `@hookform/devtools` ^4.3.1 currency (A1) — not re-verified this session; confirm in Phase 4.

## Metadata

**Confidence breakdown:**
- RHF public-API mapping (STAB-01/02): HIGH — every `_*` site traced to a public replacement; versions cited from CHANGELOG.
- RISK-01 existence check: HIGH on "getFieldState can't do it"; MEDIUM on the `getValues` key-presence caveat for default-less register-only fields (A5).
- RISK-03 devtools mechanism: HIGH for CJS; MEDIUM for pure-ESM-no-require environments (A4, contingency documented).
- lodash native swaps: HIGH — `isObject` semantics flagged; `isEqual`→existing `deepEqual` verified in source.
- RHF floor 7.34.0: HIGH — CHANGELOG-cited.
- Type hardening / child-walker: HIGH on approach; the no-runtime-change guarantee depends on manual verification (no tests).

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (stable APIs; RHF minor releases unlikely to change public surface)
