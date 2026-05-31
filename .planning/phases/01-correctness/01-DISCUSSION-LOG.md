# Phase 1: Correctness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 1-Correctness
**Areas discussed:** Breaking changes, RN render target, Submit wiring, Invalid-child DX, Wizard submit + errors, Form prop forwarding, Slot public-API error, noValidate default, Missing onSubmit guard, CORR-03 dedupe target

---

## Breaking changes (framing)

| Option | Description | Selected |
|--------|-------------|----------|
| Break freely | Pre-1.0; fixes may change render output, remove workarounds, change RN wrapper | ✓ |
| Fix, but keep API surface | Preserve public API/props + ref.onSubmit; additive fixes | |
| Minimal/surgical only | Smallest change per bug; may leave awkward workarounds | |

**User's choice:** Break freely.
**Notes:** Library re-based into this repo, not yet published from here — no v1 consumers to protect. Frames all other decisions.

---

## RN render target

| Option | Description | Selected |
|--------|-------------|----------|
| Fragment, no wrapper | React.Fragment on native; no wrapper, no className/style; submit via ref/handleSubmit | ✓ |
| Polymorphic 'as'/'component' prop | Consumer passes container (e.g. as={View}); wider API | |
| Inject onSubmit into children | Fragment + auto-wire submit onto detected buttons | |

**User's choice:** Fragment, no wrapper.
**Notes:** Honors "runtime detection only, no hard react-native import" constraint. Web still renders a real `<form>`.

---

## Submit wiring (web)

| Option | Description | Selected |
|--------|-------------|----------|
| Native form submit only | `<form onSubmit>`; stop injecting onClick on web submit buttons; keep ref.onSubmit | ✓ |
| Form submit + keep onClick | Belt-and-suspenders; risks double-submit | |
| Drop ref imperative handle too | Native submit only AND remove useImperativeHandle workaround | |

**User's choice:** Native form submit only.
**Notes:** Matches success criterion #1 (Enter + native validation fire once). ref.onSubmit retained for programmatic submit. Native (Fragment) keeps onClick injection since there's no form.

---

## Invalid-child DX

| Option | Description | Selected |
|--------|-------------|----------|
| Throw, always | Both multiple-children and non-element children throw, naming Forger + field name | ✓ |
| Throw multiple, warn invalid | console.warn + render nothing for non-element single child | |
| Throw in dev, no-op in prod | Env-branched; prod failure silent | |

**User's choice:** Throw, always.
**Notes:** Fail-fast; no silent broken forms. Message naming Forger + field name already required by success criterion #2.

---

## Wizard submit + errors

| Option | Description | Selected |
|--------|-------------|----------|
| Just submit, no extra logic | Wire handleSubmit(onSubmit); RHF gates on validation; no step-jumping | ✓ |
| Auto-jump to first errored step | Detect step holding first error and setCurrentStep to it | |
| Validate each step on Next | Validate current step before handleNext advances | |

**User's choice:** Just submit, no extra logic.
**Notes:** Minimal correctness fix. Error-routing and per-step validation deferred to future phases.

---

## Form prop forwarding

| Option | Description | Selected |
|--------|-------------|----------|
| className + noValidate, explicit | Keep className; add explicit optional noValidate; no blanket spread | ✓ |
| Spread all rest props onto `<form>` | Forward id/name/autoComplete/data-*/aria-* via {...rest} | |
| className only (status quo) | Only className, like today's div | |

**User's choice:** className + noValidate, explicit.
**Notes:** Keeps the typed API surface tight. Fuller attribute forwarding deferred.

---

## Slot public-API error

| Option | Description | Selected |
|--------|-------------|----------|
| Fix both, layered | Slot gets clear named message; Forger throws richer error naming Forger + field name | ✓ |
| Only fix Forger | Leave Slot's generic message as-is | |
| Pass field name into Slot | Slot gets optional name prop; composes message in one place | |

**User's choice:** Fix both, layered.
**Notes:** Slot is publicly exported and used independently, so its error is public API surface.

---

## noValidate default

| Option | Description | Selected |
|--------|-------------|----------|
| Default OFF — native validation ON | noValidate=false; browser runs required/pattern before Forge handler | ✓ |
| Default ON — native validation off | noValidate=true; defer entirely to RHF/resolver | |

**User's choice:** Default OFF (native validation ON).
**Notes:** Matches success criterion #1's assertion that native validation fires.

---

## Missing onSubmit guard

| Option | Description | Selected |
|--------|-------------|----------|
| Optional no-op | onSubmit optional; absent = safe no-op; form still renders | ✓ |
| Required (type-level) | onSubmit required prop; TS flags omission | |
| Optional + dev warning | Optional, but console.warn in dev if submit button exists w/o onSubmit | |

**User's choice:** Optional no-op.
**Notes:** Supports ref-driven / controlled-elsewhere / wizard-only forms without crashing.

---

## CORR-03 dedupe target

| Option | Description | Selected |
|--------|-------------|----------|
| Keep logic/, drop utils.ts | logic/ is the dedicated helper layer; verify zero refs before delete | ✓ |
| Keep utils.ts, drop logic/ | Keep utils.ts copy as canonical | |
| Let planner decide after grep | Planner picks to minimize import churn; logic/ as tiebreaker | |

**User's choice:** Keep logic/, drop utils.ts.
**Notes:** `src/logic/updateFieldArrayRootError.ts` confirmed to exist. Verify zero references to the utils.ts copy before removal.

---

## Claude's Discretion

- Exact mechanism for threading `onSubmit` into the `useForge`-owned `handleWizardSubmit`.
- Placement of `noValidate` / optional `onSubmit` in the `ForgeProps` type.
- Whether to add `Forger.displayName = "Forger"`.
- Import-repointing strategy for the dedupe.

## Deferred Ideas

- Wizard error-step routing (auto-jump to first errored step on failed submit).
- Per-step validation on `handleNext`.
- Full HTML form-attribute forwarding beyond `className` + `noValidate`.
