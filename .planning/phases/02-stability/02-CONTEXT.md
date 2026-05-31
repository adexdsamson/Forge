# Phase 2: Stability - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Make Forge's public hooks stop depending on react-hook-form's private `_*` internals, remove the `lodash` runtime dependency, keep `@hookform/devtools` out of consumer production bundles, and make the public API genuinely typed (no `as any` on the public surface; clean `tsc --noEmit`). Requirements **STAB-01…05**.

**In scope:** rewriting `useFieldArray`, `useForgeValues`, and `usePersist` onto public RHF APIs; how `useForge` augments `control`; the `lodash` → native swap; devtools dependency placement + lazy-load + missing-package behavior; a type-hardening sweep (public surface + internal casts).

**Not in this phase:** tests (Phase 3 — but note Phase 2 changes are made *without* a test net), packaging/registry/`dist` hygiene (Phase 4), docs/lint/CI (Phase 5), publish (Phase 6). No new form features. The publish *target* (npm vs GH Packages) stays deferred to Phase 4; only the RHF *peer-version range* is touched here.

</domain>

<decisions>
## Implementation Decisions

### Cross-cutting framing (carried from Phase 1)
- **D-01 — Break freely.** Pre-1.0, no published consumers. Phase 2 MAY change the public API surface, observable behavior, and types. Breaks are documented in CHANGELOG/MIGRATION in Phase 5; do not contort fixes to preserve the current surface. (Inherited from Phase 1 D-01.)
- **D-02 — Preserve cross-platform-by-runtime-detection.** All rewrites and type work must keep the "no hard `react-native` import; platform via runtime detection" constraint intact.

### STAB-02 — `useForgeValues` (thin wrapper)
- **D-03 — Reimplement `useForgeValues` as a thin pass-through over RHF's public API.** It REMAINS a public export. Delete the ~562 lines re-implementing RHF's `setValue`/`trigger`/`getValues` pipeline; back it with the public `setValue`/`getValues`/`trigger`/`watch` from `useFormContext`/`useForge`. Zero `_*` access in its call path.
- **D-04 — Keep the `setValue` / `getValue` / `getValues` surface.** `getValue(name)` maps to RHF's `getValues(name)`. **`getValue` throws a clear, Forge-named error for an unknown field** (instead of the current `return undefined as any`). No `as any` anywhere in the wrapper. *(See RISK-01: existence detection must use a public API.)*

### STAB-01 — `useFieldArray` (decorate on top of RHF public hook)
- **D-05 — Forge's custom per-item input-attribute capability is a KEEPER.** This is the existing reason `useFieldArray` was hand-rolled (RHF's public `useFieldArray` won't carry developer-specified per-item input attributes). It is not scope creep and must survive the rewrite.
- **D-06 — Decorate on top of RHF's public `useFieldArray`.** Use RHF's official `useFieldArray` for the actual `append`/`remove`/`insert`/`swap`/`update` + `fields`/`id`. Layer Forge's per-item input attributes onto the returned `fields` before handing them to the consumer. Target **zero `_*` access**. *(See RISK-02.)*
- **D-07 — Fix the unstable-`control` `useEffect` along the way.** The rewrite removes the per-render `control` identity churn that makes the `[fields, name, control]` effect (`useFieldArray.tsx:281`) misfire. Combined with D-11, `control` becomes a stable reference.

### STAB-04 — devtools (dev-only, lazy, loud-on-missing)
- **D-08 — `@hookform/devtools` = devDependency + optional peerDependency.** Move it out of runtime `dependencies`; declare it as a `devDependency` AND an optional peer (`peerDependenciesMeta["@hookform/devtools"].optional = true`), mirroring how `react-dropzone` is already declared. It must never force into a consumer's tree when `debug` is unused.
- **D-09 — Lazy-load; throw a named error when `debug={true}` and devtools is absent.** No silent no-op, no warn-and-continue. When `debug` is on and the package can't be loaded, throw a clear Forge-named error instructing `npm i -D @hookform/devtools`. *(See RISK-03: async `import()` can't throw synchronously during render — the lazy-load mechanism must reconcile "tree-shaken when off" with "synchronous named throw when on + missing".)*

### STAB-05 — type hardening (public + full internal sweep)
- **D-10 — Sweep both the public surface AND internal casts.** Public surface must be `as any`-free and `tsc --noEmit` must pass cleanly: `ForgeControl<T>` (no `as any` from `useForge`), `ForgerProps`/`ForgerControllerProps` (`component`, `Record<string,any>`), `useForgeValues`' `undefined as any` (already removed by D-04), `JSX.Element` → `React.ReactElement` (`types.ts:44`), and the **unconditional `react-dropzone` import** → `import type` so it's erased at runtime (fixes module-not-found for consumers without it). Also sweep the internal ~46 casts where reasonable, **including** the `processChildrenRecursively` child-walker in `Forge.tsx` (`children:any` / `(child as any).props`, ~14 casts). *(See RISK-04 — child-walker carries Phase-1 fixes and has no test net.)*
- **D-11 — Augment `control` by mutating the RHF instance in place.** `useForge` attaches `hasFields`/`fields`/wizard props directly onto `methods.control` (e.g. `Object.assign(methods.control, forgeProps)`) and returns that **same** instance — one stable object, RHF prototype/identity preserved, no per-render clone. Type it as `ForgeControl<T>` with no `as any`. Wizard re-render still flows from `useForge`'s `currentStep` React state, not `control` identity.

### STAB-02 — `usePersist` (public subscription)
- **D-12 — Rewrite `usePersist` onto public APIs; deliver values + key state flags.** Replace the `_subjects.state` subscription (`usePersist.tsx:26`) with `useWatch` (values) + a scoped `useFormState` (`isDirty`/`isValid`). Handler receives **values + `isDirty` + `isValid`** — not the full `dirtyFields`/`touchedFields`/`errors` firehose. Lighter re-render footprint, matches the real autosave/draft-persistence use case.

### STAB-03 — lodash removal (mechanical)
- **D-13 — Replace the lodash utilities with inline native checks and drop `lodash` from `dependencies`.** Sites (7 files): `src/utils.ts`, `src/useForgeValues/useForgeValues.tsx`, `src/validateField.ts`, `src/Forger/Forger.tsx`, `src/logic/getDirtyFields.ts`, `src/logic/getFieldValueAs.ts`, `src/logic/hasPromiseValidation.ts` (`isUndefined`/`isObject`/`isString`/`isNumber`/`isBoolean`/`isFunction`/`isEqual`). Keep RHF version range broad (`^7`) since the phase removes the private-API coupling that motivated pinning.

### Claude's Discretion
- Exact lazy-load mechanism for devtools (subject to D-09's synchronous-throw constraint) — see RISK-03.
- Whether to tighten `ForgerProps.component` from `any` to a constrained generic (e.g. `React.ComponentType<…>`): **researcher decides** — tighten only if it does NOT produce false-positive type errors on valid cross-platform custom inputs; otherwise leave `any`. (Mentioned in RISK-04 verification.)
- Mechanical cleanups folded into the sweep: dead `"use strict"` directive (`useForge.tsx:1`), commented-out imports (`Forge.tsx:18-24`), `key={index}` → stable key on field-array render (`Forge.tsx:244`), moving `Slot` out of `utils.ts` (optional).
- Precise minimum supported RHF `^7` floor (planner/researcher determines the lowest version exposing every public API relied on).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Per-concern specification (most important)
- `.planning/codebase/CONCERNS.md` — Detailed, file:line evidence + fix approaches for: "Stability: Heavy Private RHF API Access" (118 `_*` sites: 36 in `useFieldArray`, 74 in `useForgeValues`, 1 in `usePersist`), "DevTools Shipped to Production", "`lodash` as a Runtime Dependency", "Augmenting RHF's `control` Object", "`useForgeValues` Duplicates RHF Internal Logic", "`useEffect` with Unstable `control` Dependency".
- `.planning/codebase/QUALITY.md` §2 ("TypeScript Strictness vs Actual Type Safety"), §6 ("Maintainability Risks"), §7 ("Type Safety Prescriptions"), §8 (Quality Gaps Checklist) — the ~46 `as any` inventory, `react-dropzone` unconditional import (6d), `component: any` / `Record<string,any>` public-type issues, `undefined as any` lie (`useForgeValues.tsx:554`).

### Requirements & success criteria
- `.planning/REQUIREMENTS.md` §Stability — STAB-01…05 definitions.
- `.planning/ROADMAP.md` §"Phase 2: Stability" — the 5 success criteria (what must be TRUE). Note criterion #1 explicitly permits isolated+version-guarded internal access as a fallback (not needed given D-06's decorate-on-top decision).

### Source files to change
- `src/useFieldArray/useFieldArray.tsx` — decorate-on-top rewrite (D-05/06/07); unstable `useEffect` dep at `:281`.
- `src/useForgeValues/useForgeValues.tsx` — collapse to thin wrapper (D-03/04); `undefined as any` at `:554`.
- `src/usePersist/usePersist.tsx` — `_subjects.state` subscription at `:26` → `useWatch` + `useFormState` (D-12).
- `src/useForge/useForge.tsx` — `control` augmentation at `:64-72` → mutate-in-place (D-11); dead `"use strict"` at `:1`.
- `src/Forge/Forge.tsx` — `processChildrenRecursively` child-walker casts (D-10); devtools import/render at `:27`/`:265` (D-08/09); `key={index}` at `:244`; commented-out imports `:18-24`.
- `src/types.ts` — `ForgeControl<T>`, `ForgerProps.component`/`Record<string,any>`, `JSX.Element` at `:44`, `react-dropzone` import at `:2` → `import type`.
- `src/utils.ts`, `src/validateField.ts`, `src/Forger/Forger.tsx`, `src/logic/getDirtyFields.ts` — lodash call sites (D-13).
- `package.json` — `dependencies` (remove `lodash`, move `@hookform/devtools`), `peerDependenciesMeta`, RHF peer range.

### No external ADRs/specs
- No external ADR/PRD docs exist for this phase — decisions above + the codebase maps are the source of truth.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **RHF public surface** (`...methods` already returned by `useForge`) — `setValue`/`getValues`/`trigger`/`watch`/`useFormState`/`useWatch`/public `useFieldArray` are the replacement targets for all `_*` access.
- **`react-dropzone` optional-peer pattern** (`package.json` `peerDependenciesMeta`) — the existing template for declaring `@hookform/devtools` as an optional peer (D-08).
- **Platform detection** (`isWeb`/`isReactNative` in `utils.ts`; `getEventHandlerName`/`getComponentType` in `reactNative.ts`) — must stay; rewrites route platform behavior through these (D-02).

### Established Patterns
- **`useXxx/` subdir + `index.ts` re-export** — every hook follows it; rewrites preserve the layout and public export names (`useForgeValues`, `useFieldArray`, `usePersist` stay exported).
- **Augmented `control`** — Phase 1 added `handleWizardSubmit` into the wizard props on `control`; D-11 changes the augmentation *mechanism* (in-place) but keeps the augmented shape RHF hooks/`<Forge>`/`<Forger>` already read.
- **`logic/` helper layer** — `getDirtyFields`, `getResolverOptions`, etc. are consumed by `useForgeValues`/`useFieldArray`; collapsing `useForgeValues` to a wrapper may orphan some helpers (planner verifies usage before deleting).

### Integration Points
- `<Forge>` and `<Forger>` read the augmented `control` (incl. wizard props) — D-11's in-place mutation must keep every property they consume present and current.
- `Slot` is re-exported publicly via `src/index.ts` — moving it out of `utils.ts` (discretionary) must preserve the export path.
- `useFieldArray` runs field validation after mutations (current `_*`-based path) — the decorate-on-top rewrite must re-home that validation onto public `trigger` (RISK-02).

</code_context>

<specifics>
## Specific Ideas

- `useForge` augmentation (illustrative): `Object.assign(methods.control, { hasFields, fields, ...wizardProps }); return { ...methods, control: methods.control };` — planner finalizes.
- devtools (illustrative intent): keep the module out of the bundle when `debug` is off; when `debug` is on and resolution fails, `throw new Error("Forge: debug mode requires '@hookform/devtools' — install it with \`npm i -D @hookform/devtools\`")`.
- `getValue` unknown-field error (illustrative): `throw new Error("useForgeValues.getValue: field \"<name>\" is not registered")`.

</specifics>

<deferred>
## Deferred Ideas

- **Splitting Forge state off `control` into a separate `forgeControl` object** — CONCERNS' alternative fix. Rejected for this milestone: success criterion #5 locks the augmented-`ForgeControl<T>` shape, and D-11 (in-place mutation) resolves the stability concern without a larger API split. Revisit only if a future RHF version makes in-place augmentation unsafe.
- **Tightening every internal `any` parameter in `reactNative.ts`** (exported helpers with `any` params) — covered partially by D-10's sweep; full retyping of the RN helper signatures can extend into Phase 5 docs/lint if it balloons.

None of the above are blockers; they are noted so they aren't lost.

</deferred>

---

## Risks flagged during discussion (for researcher/planner)

- **RISK-01 (D-04):** `getValue` throwing on an unknown field requires detecting field existence, but RHF's public `getValues(name)` returns `undefined` for both unknown and registered-but-empty fields. The planner MUST confirm a public-API existence check (e.g. key presence in `getValues()`) — otherwise this quietly reintroduces `_names` access and defeats STAB-02.
- **RISK-02 (D-06):** Decorate-on-top assumes Forge's custom input attributes never need to mutate RHF's internal registration/subjects/form-values (the reason `_updateFieldArray`/`_subjects`/`_formValues` were used). Researcher must trace the current `_*` call paths in `useFieldArray.tsx` against RHF's public surface and confirm the validation-after-mutation path can run on public `trigger`.
- **RISK-03 (D-09):** A dynamic `import()` resolves asynchronously and cannot throw synchronously during render. The planner must choose a lazy-load mechanism that (a) keeps `@hookform/devtools` out of the production bundle when `debug` is off, yet (b) yields a synchronous, Forge-named throw when `debug` is on and the package is absent.
- **RISK-04 (D-10):** The `Forge.tsx` child-walker carries the Phase-1 `<form>`/wizard fixes (CORR-01/CORR-04) and there are NO tests until Phase 3. Retyping it must be manually verified not to regress native submit / Enter-to-submit / wizard last-step submit. (Also gates the `ForgerProps.component` tightening decision.)

---

*Phase: 2-Stability*
*Context gathered: 2026-05-31*
