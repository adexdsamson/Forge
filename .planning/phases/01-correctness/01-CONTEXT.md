# Phase 1: Correctness - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the four known behavioral bugs (CORR-01…04) so Forge behaves as documented, on **both web and React Native**:

- **CORR-01** — `<Forge>` renders a real `<form>` on web (native submit + Enter-to-submit + native validation), with correct cross-platform behavior on RN.
- **CORR-02** — `<Forger>` / `Slot` produce a clear, component-named error for invalid/multiple children instead of the generic `"Only one child allowed"`.
- **CORR-03** — Stale JSDoc (`ForgeFormProps`/`UseForgeFormResult`) is corrected and the duplicated `updateFieldArrayRootError` is removed.
- **CORR-04** — Wizard last-step submission actually fires `onSubmit` (currently a silent no-op).

**Not in this phase:** Stability/private-API/lodash/devtools work (Phase 2), tests (Phase 3), packaging/docs/CI (Phases 4–5). No new form features — wizard fix is a correctness fix, not feature expansion.
</domain>

<decisions>
## Implementation Decisions

### Cross-cutting framing
- **D-01 — Break freely.** Treat this as pre-1.0 (the library was re-based into this repo and has not been published from here; no v1 consumers). Fixes MAY change observable behavior, render output, and the public API. Changes get documented in CHANGELOG/MIGRATION in Phase 5; do not contort fixes to preserve the current surface.

### CORR-01 — Real `<form>` + cross-platform render
- **D-02 — Web renders `<form>`.** Replace the `<div>` (`src/Forge/Forge.tsx:253`) with a `<form onSubmit={control.handleSubmit(onSubmit)}>`.
- **D-03 — Native renders a `React.Fragment`.** On React Native, `<Forge>` renders children inside a `Fragment` — **no wrapper element, no `className`/`style` applied on native** (consumers wrap in their own `<View>` for layout). This preserves the "runtime detection only, no hard `react-native` import" constraint. Platform routing uses the existing `isReactNative` / `actualPlatform` logic already in `Forge.tsx`.
- **D-04 — Web submit = native form submit only.** Stop injecting `onClick` onto web `type="submit"` buttons (`Forge.tsx:96`) — let the native `<form>` submit drive `handleSubmit` so Enter-to-submit and native validation fire once, with no double-submit. **Keep** the `useImperativeHandle` `ref.onSubmit` handle (programmatic submit retained). On **native (Fragment)** there is no form element, so submit buttons KEEP their `onClick` injection (existing button-handling path).
- **D-05 — Form props: `className` + explicit optional `noValidate` only.** Forward `className` and add an explicit optional `noValidate` prop to the web `<form>`. **Do not blanket-spread** unknown rest props onto the form — keep the typed API surface tight. (Fuller HTML attribute forwarding is deferred — see Deferred Ideas.)
- **D-06 — `noValidate` defaults to `false`** (native browser validation ON by default — matches success criterion #1 that `required`/`pattern` fire). Consumers relying on RHF/schema validation opt out by passing `noValidate`.
- **D-07 — `onSubmit` is optional, absent = safe no-op.** When `<Forge>` is used without `onSubmit`, the form renders and the submit handler is a no-op (no crash). Supports ref-driven / controlled-elsewhere forms.

### CORR-02 — Component-named child error (layered)
- **D-08 — Always throw, layered across `Slot` + `Forger`.**
  - `Forger` throws its own rich `Error` naming **`Forger` + the field `name`** before delegating to `Slot`, for **both** multiple children **and** non-element (string/number/`false`) children. No silent `null` render, no warn-and-continue — fail fast.
  - `Slot` (publicly exported, used independently) ALSO gets a clear named message of its own (e.g. `"Slot: only one child allowed"`) for direct use, since `Slot` cannot know a field name.
  - Consider adding `Forger.displayName = "Forger"` for cleaner stack traces (discretionary).

### CORR-03 — JSDoc + dedupe (mechanical)
- **D-09 — Fix JSDoc and dedupe `updateFieldArrayRootError`.**
  - Correct `useForge` JSDoc (`src/useForge/useForge.tsx:9-10`): `@param` → `{UseForgeProps}`, `@returns` → `{UseForgeResult}` (both already in `src/types.ts`).
  - **Canonical copy = `src/logic/updateFieldArrayRootError.ts`** (the dedicated helper layer). Remove the duplicate from `src/utils.ts`, repoint any imports to `logic/`, and verify **zero remaining references** to the `utils.ts` copy before deleting.

### CORR-04 — Wizard last-step submit (minimal)
- **D-10 — Implement `handleWizardSubmit` in `useForge`, wire it to fire `onSubmit`.** Add `handleWizardSubmit` to the `wizardProps`/`control` returned by `useForge` (`src/useForge/useForge.tsx:54-72`) so the last wizard step's button (`Forge.tsx:111-113`) actually submits via RHF's `handleSubmit(onSubmit)`. **Minimal scope:** let RHF's whole-form validation gate the submit (invalid form blocks `onSubmit` and populates `errors`). **Do NOT** add error-step routing / auto-jump, and **do NOT** add per-step validation on `handleNext` — both deferred. Exact wiring (how `onSubmit` from `<Forge>` props reaches the `useForge`-owned `handleWizardSubmit`) is the planner's call.

### Claude's Discretion
- Exact mechanism for threading `onSubmit` into `handleWizardSubmit` (D-10).
- Where `noValidate` / optional `onSubmit` sit in the `ForgeProps` type (D-05/D-07).
- Whether to add `Forger.displayName` (D-08).
- Import-repointing strategy for the dedupe (D-09).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bug fix specification (most important)
- `.planning/codebase/CONCERNS.md` — Detailed per-bug spec with file:line evidence and concrete fix approaches for CORR-01 (`<div>`→`<form>`, §"CORR-02" heading in that doc), CORR-02 (Slot/Forger error), CORR-03 (stale JSDoc), CORR-04 (`handleWizardSubmit`). Note: that doc labels the div→form bug "CORR-02" internally and the memo comparator "CORR-01 — VERIFIED FIXED"; the milestone's requirement IDs are the source of truth (see REQUIREMENTS.md).

### Requirements & success criteria
- `.planning/REQUIREMENTS.md` §Correctness — CORR-01…04 definitions.
- `.planning/ROADMAP.md` §"Phase 1: Correctness" — the 4 success criteria (what must be TRUE).

### Source files to change
- `src/Forge/Forge.tsx` — container element (`:253`), submit button injection (`:96`), wizard nav wiring (`:106-133`), `useImperativeHandle` (`:228-240`), platform routing (`:39-45`).
- `src/Forger/Forger.tsx` — `Forger` named guard (`:113`), `MemorizeController` (already-correct, do not regress).
- `src/utils.ts` — `Slot` error/guard (`:407-411`), duplicate `updateFieldArrayRootError` to remove.
- `src/useForge/useForge.tsx` — JSDoc (`:9-10`), `wizardProps` + `handleWizardSubmit` (`:54-72`).
- `src/logic/updateFieldArrayRootError.ts` — canonical copy to keep.
- `src/types.ts` — `ForgeProps`, `ForgeControl` (`handleWizardSubmit?` at `:31`), `UseForgeProps`/`UseForgeResult`.
- `src/reactNative.ts` — `getComponentType`, `getEventHandlerName` (native submit path).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Platform detection** (`src/utils.ts`: `isWeb`/`isReactNative`/`isMobile`; `Forge.tsx` `actualPlatform`/`isRNMode`) — drives the web-`<form>` vs native-`Fragment` branch (D-02/D-03) with no new react-native import.
- **`getComponentType` / `getEventHandlerName`** (`src/reactNative.ts`) — already power native input/button wiring; the native submit-button `onClick` path (D-04) reuses this.
- **`Slot`** (`src/utils.ts:406-423`) — single-child wrapper Forger renders into; the layered error (D-08) touches both it and `Forger`.
- **`MemorizeController` comparator** (`src/Forger/Forger.tsx:81-108`) — already correct; do NOT regress while editing Forger.

### Established Patterns
- **Runtime platform detection, never a hard `react-native` import** — D-03 must honor this (Fragment, not `View`).
- **Recursive children processing** (`Forge.tsx:processChildrenRecursively`) — submit-button and wizard-nav handling lives here; D-04 modifies the web branch only.
- **Augmented `control`** (`useForge.tsx:64-72` spreads `methods.control` + wizard props) — `handleWizardSubmit` (D-10) is added into this object.

### Integration Points
- `<Forge>` consumes `control.handleSubmit` and `control.handleWizardSubmit`; `onSubmit` is a `<Forge>` prop — the CORR-04 wiring spans `useForge` (owns wizard state) and `Forge` (owns `onSubmit`).
- `Slot` is re-exported publicly via `src/index.ts` — its error message is public API surface (reason for the layered D-08 fix).
</code_context>

<specifics>
## Specific Ideas

- Web `<form>`: `<form className={className} noValidate={noValidate} onSubmit={control.handleSubmit(onSubmit ?? (() => {}))}>` (illustrative — planner finalizes).
- Forger error shape: `Error("Forger: field \"<name>\" expects exactly one valid React element as its child")` (illustrative wording; must name `Forger` + the field `name`).
- Slot error shape: `Error("Slot: only one child is allowed")`.
</specifics>

<deferred>
## Deferred Ideas

- **Wizard error-step routing** — on failed last-step submit, auto-jump to the step holding the first error. New capability; not needed for "submit fires when valid." Future enhancement.
- **Per-step validation on `handleNext`** — validate the current step's fields before advancing. Broader wizard behavior change; its own scope.
- **Full HTML form-attribute forwarding** — blanket-spreading `id`/`name`/`autoComplete`/`data-*`/`aria-*` onto the `<form>` beyond `className` + `noValidate`. Deliberately scoped out (D-05) to keep the typed surface tight; revisit if consumers ask.

</deferred>

---

*Phase: 1-Correctness*
*Context gathered: 2026-05-31*
