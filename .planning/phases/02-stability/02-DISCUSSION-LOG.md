# Phase 2: Stability - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 2-Stability
**Areas discussed:** useForgeValues fate, useFieldArray strategy, devtools debug behavior, Type-hardening scope, control augmentation, usePersist fidelity

---

## useForgeValues fate

| Option | Description | Selected |
|--------|-------------|----------|
| Thin pass-through wrapper | Keep as public export; reimplement over public setValue/getValues/trigger/watch; zero private access | ✓ |
| Delete entirely | Remove from public API; consumers use useForge's ...methods directly | |
| Keep but reroute internals | Preserve exact behavior, swap _* reads for public | |

**User's choice:** Thin pass-through wrapper
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Keep all 3, fix the type | setValue/getValue/getValues; missing field returns `undefined` typed `T \| undefined` | |
| Keep all 3, getValue throws on unknown | Same surface; getValue throws a named error on an unregistered field | ✓ |
| Drop singular getValue | Expose only setValue + getValues | |

**User's choice:** Keep all 3, getValue throws on unknown
**Notes:** Flagged RISK-01 — public-API field-existence detection is non-trivial; must not reintroduce `_names`.

---

## useFieldArray strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Wrap RHF's public useFieldArray | Thin wrapper, mutations from RHF | |
| Public-first, isolate the rest | Quarantine unavoidable _* in one guarded module | |
| You decide after research | Researcher checks public coverage first | |

**User's choice:** (free text) "The whole point of why I rewrote useFieldArray was because RHF's useFieldArray does not allow the developer to pass unique input attributes depending how they want it to behave."
**Notes:** Established that the custom per-item input-attribute capability is the existing value-add and must be preserved — a plain wrap is off the table.

| Option | Description | Selected |
|--------|-------------|----------|
| Decorate on top of public hook | RHF public hook for mutations + fields/id; Forge layers per-item attributes onto returned fields; zero _* | ✓ |
| Needs to reach into RHF state | Custom behavior must mutate RHF internals → isolate _* in a guarded adapter | |
| Researcher determines which | Trace _* paths, pick decorate-vs-isolate per gap | |

**User's choice:** Decorate on top of public hook
**Notes:** RISK-02 recorded — researcher to verify the custom attributes never need to mutate RHF registration, and that validation-after-mutation runs on public `trigger`.

---

## devtools debug behavior

| Option | Description | Selected |
|--------|-------------|----------|
| console.warn + no-op | Lazy-load fails gracefully, warn once | |
| Throw a named error | debug + missing → clear Forge-named throw instructing install | ✓ |
| Silent no-op | Render form, skip panel, say nothing | |

**User's choice:** Throw a named error
**Notes:** RISK-03 — async import() can't throw synchronously during render; mechanism is planner's call subject to that constraint.

| Option | Description | Selected |
|--------|-------------|----------|
| devDep + optional peer | devDependency AND optional peerDependency (mirrors react-dropzone) | ✓ |
| devDependency only | devDependency + README note | |

**User's choice:** devDep + optional peer

---

## Type-hardening scope

| Option | Description | Selected |
|--------|-------------|----------|
| Public surface + clean tsc | Fix only exported/consumer-facing types | |
| Public surface + full internal sweep | Also eliminate the ~46 internal casts incl. the child-walker | ✓ |
| Public + low-risk internal | Public surface + easy internal casts, leave the child-walker | |

**User's choice:** Public surface + full internal sweep
**Notes:** RISK-04 — child-walker carries Phase-1 CORR-01/CORR-04 fixes with no test net; manual regression verification required.

| Option | Description | Selected |
|--------|-------------|----------|
| Tighten now (breaking OK) | Retype component to a constrained generic | |
| Keep `any` for now | Leave component:any | |
| You decide after research | Tighten only if no false positives on valid cross-platform inputs | ✓ |

**User's choice:** You decide after research

---

## control augmentation

| Option | Description | Selected |
|--------|-------------|----------|
| Mutate RHF instance in place | Object.assign forge props onto methods.control, return same instance; stable identity, prototype preserved | ✓ |
| Memoized prototype-safe copy | useMemo + Object.create; stable ref, two objects to sync | |
| Keep spread, just type it | Per-render spread, only remove `as any` | |

**User's choice:** Mutate RHF instance in place
**Notes:** Fixes the per-render identity churn that makes the useFieldArray `[control]` effect misfire.

---

## usePersist fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Values + key state flags | values + isDirty/isValid via useWatch + scoped useFormState | ✓ |
| Full form-state parity | values + dirtyFields/touchedFields/errors/validating via full useFormState | |
| Values only | just current values | |

**User's choice:** Values + key state flags
**Notes:** Matches the autosave/draft-persistence use case with a lighter re-render footprint than the old `_subjects.state` firehose.

---

## Claude's Discretion

- Exact lazy-load mechanism for devtools (subject to the synchronous-throw constraint, RISK-03).
- Whether to tighten `ForgerProps.component` from `any` (researcher decides — only if no false positives on valid cross-platform inputs).
- Mechanical cleanups folded into the sweep: dead `"use strict"`, commented-out imports, `key={index}`, moving `Slot` out of `utils.ts`.
- Minimum supported RHF `^7` floor.
- lodash → native-checks swap (STAB-03), mechanical.

## Deferred Ideas

- Splitting Forge state off `control` into a separate `forgeControl` object — rejected this milestone (criterion #5 locks augmented `ForgeControl<T>`; D-11 resolves the concern without an API split).
- Full retyping of `reactNative.ts` exported helper `any` parameters — partially covered by the sweep; can extend into Phase 5 if it balloons.
