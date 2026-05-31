---
phase: 03-testing
reviewed: 2026-05-31T15:25:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - package.json
  - vitest.config.ts
  - src/useForge/useForge.tsx
  - src/test-utils.tsx
  - src/Forge/Forge.errors.test.tsx
  - src/Forger/Forger.rn.test.tsx
  - src/useFieldArray/useFieldArray.test.tsx
  - src/useForgeValues/useForgeValues.test.tsx
  - src/usePersist/usePersist.test.tsx
  - src/validateField.rn.test.ts
  - src/validateField.test.ts
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-05-31T15:25:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 3 adds the test harness (`vitest.config.ts`, `vitest.setup.ts`, `test-utils.tsx`),
seven test files, and one production change in `src/useForge/useForge.tsx`. All 18 tests
pass and coverage clears the configured thresholds (lines 56.69 ≥ 54, statements 54.63 ≥ 52,
functions 48.3 ≥ 46, branches 38.78 ≥ 36) — but every margin is under 3pp, so the suite is
one removed assertion away from breaking the build.

The production change (`Object.assign(methods.control, ...)`) is **sound at runtime**: it adds
`getValues`/`setValue` (which RHF's `Control` genuinely does not carry) so that `useFormContext()`
consumers inside `<Forge>` can call them, and re-assigns `handleSubmit`/`getFieldState` (which
`Control` already carries with the identical function reference — redundant but harmless). It does
NOT break RHF's public API contract and does NOT disturb the `control._*` internal augmentation.
The main quality gap is type safety: the four forwarded methods are not declared on the
`ForgeControl` type, so the contract is enforced only by RHF's `useFormContext` return type.

The headline defect is that **`npm run typecheck` now fails** with two errors in the new test
files. Since `tsconfig.json` has `include: ["src"]` and `strict: true`, these are real, gating
failures for any CI step that runs `typecheck` — and the project ships `.d.ts` declarations, so
type health is load-bearing. The RN mock seam is genuinely sound for the Switch test but the
TextInput RN test is partially tautological (it would pass even on web due to a `displayName`
fallback in `Forger.tsx`).

## Critical Issues

### CR-01: `npm run typecheck` fails — two strict type errors in new test files

**File:** `src/useFieldArray/useFieldArray.test.tsx:34`, `src/usePersist/usePersist.test.tsx:33`
**Issue:** `tsconfig.json` sets `include: ["src"]` and `strict: true`, so the test files are in
the typecheck scope. Two errors now break `tsc --noEmit` (the `typecheck` script):

1. `useFieldArray.test.tsx:34` — `onSubmit = vi.fn()` is passed as the `onSubmit` prop of
   `<Forge>`. `vi.fn()` types as `Mock<Procedure | Constructable>`, which is not assignable to
   `((submit: { items: { value: string }[] }) => void) | undefined`:
   ```
   error TS2322: Type 'Mock<Procedure | Constructable>' is not assignable to type
   '((submit: { items: { value: string; }[]; }) => void) | undefined'.
   ```
2. `usePersist.test.tsx:33` — `ForgeControl<{ name: string }>` is passed where
   `usePersist` expects a control whose field values are `{ name?: string }`. RHF widens the
   default-value type to optional, producing a `_subjects.state` variance mismatch:
   ```
   error TS2322: Type 'ForgeControl<{ name: string; }, unknown>' is not assignable to type
   'Control<{ name?: string | undefined; }>'.
   ```

The runtime tests pass because `vitest run` does not type-check, but any pipeline that runs
`npm run typecheck` (and the `.d.ts` emit path via rollup-plugin-dts depends on a clean type
graph) is now red. A test phase should not regress the project's own typecheck gate.

**Fix:**
- `useFieldArray.test.tsx:34` — type the prop default so the mock matches the callback shape:
  ```tsx
  onSubmit = vi.fn() as unknown as (submit: { items: { value: string }[] }) => void,
  ```
  or annotate the `onSubmit` parameter type in the `DynamicForm` prop interface and cast the
  default. Simplest: `<Forge control={control} onSubmit={onSubmit as any}>` is already the
  pattern used elsewhere — apply it here, or widen the prop type.
- `usePersist.test.tsx:33` — give the form an explicit field-values generic with optional name,
  or cast the control at the `usePersist` call:
  ```tsx
  const { control } = useForge<{ name?: string }>({ defaultValues: { name: "" } });
  ```
  Confirm the fix by running `npm run typecheck` to zero errors.

## Warnings

### WR-01: Forwarded methods are absent from the `ForgeControl` type — runtime/type contract drift

**File:** `src/useForge/useForge.tsx:81-90`, `src/types.ts:17-32`
**Issue:** The production change forwards `getValues`, `setValue`, `handleSubmit`, and
`getFieldState` onto `control` via `Object.assign`, but `ForgeControl` (types.ts:17-32) declares
none of them. The wiring works today only because `useForgeValues` reads them through
`useFormContext()` (typed as the full `UseFormReturn`), and `Forge` spreads `control` into
`FormProvider` so the context value *is* the control. Any consumer that holds a `ForgeControl`
reference directly (the documented public surface) and calls `control.getValues()` /
`control.setValue()` gets no type support — and a future refactor that stops spreading `control`
into `FormProvider` would silently break `useForgeValues` with no compile-time signal. The
runtime augmentation and its type are out of sync.
**Fix:** Declare the forwarded public methods on `ForgeControl` so the type matches the runtime
object:
```ts
export type ForgeControl<T extends FieldValues, TFieldProps = unknown> =
  Control<T, any> & {
    getValues: UseFormGetValues<T>;
    setValue: UseFormSetValue<T>;
    getFieldState: UseFormGetFieldState<T>;
    // handleSubmit already exists on Control<T>
    fields?: FieldProps<TFieldProps>[];
    hasFields: boolean;
    /* ...wizard fields... */
  };
```

### WR-02: Redundant re-assignment of `handleSubmit`/`getFieldState` obscures the real fix

**File:** `src/useForge/useForge.tsx:87-88`
**Issue:** RHF's `Control` already carries `handleSubmit` and `getFieldState` (see
`react-hook-form/dist/types/form.d.ts:668,670`), and RHF populates them with the same function
references that `methods.handleSubmit`/`methods.getFieldState` expose. Re-assigning them here is a
no-op that misleads a reader into thinking all four are equally necessary, when only `getValues`
and `setValue` are genuinely missing from `Control`. This obscures the minimal surface of the
mutation and invites future "why are these here?" churn.
**Fix:** Forward only the two methods that `Control` lacks, and comment why:
```ts
const forgeProps = {
  hasFields,
  fields,
  ...wizardProps,
  // Control already carries handleSubmit/getFieldState; only getValues/setValue are missing.
  getValues: methods.getValues,
  setValue: methods.setValue,
};
Object.assign(methods.control, forgeProps);
```

### WR-03: RN TextInput test (Test 1) is partially tautological — passes without the mock

**File:** `src/Forger/Forger.rn.test.tsx:75-99`
**Issue:** Test 1 asserts that `onChangeText` is wired for a `TextInput` in RN mode. But
`Forger.tsx:50` gates that branch on `isTextInput(component) || component?.displayName === 'TextInput'`.
The capturing component sets `displayName = "TextInput"`, so the `onChangeText` wiring fires via
the `displayName` fallback **even when `isReactNative` is false**. The outer `else if (isReactNative)`
at line 48 does gate it, so the mock is load-bearing for *that* guard — but the test as written
does not prove the `isTextInput`-via-mock path specifically, and would not catch a regression that
broke only the `isTextInput` helper. Contrast Test 2 (Switch): the `isSwitch` branch (line 53) has
no `displayName` fallback, so it genuinely depends on the mocked `isReactNative`/`isSwitch` — that
one is sound.
**Fix:** Make Test 1 prove the RN-specific behavior that web mode does NOT exhibit — e.g. assert
that `onChange` is the injected no-op (`handlers.onChange = () => {}`, line 52) and that calling it
does NOT update RHF state, while `onChangeText("hello")` DOES. That distinguishes the RN branch
from the web branch (where `onChange` is the real handler). Alternatively, add a sibling test using
a component whose `displayName` is not `"TextInput"` but which `isTextInput` (mocked) still matches,
to exercise the helper path directly.

### WR-04: `usePersist` assertion accepts a too-loose value match

**File:** `src/usePersist/usePersist.test.tsx:53-58`
**Issue:** After typing `"alice"`, the test asserts the handler was called with
`{ name: expect.stringContaining("a") }`. `userEvent.type` fires per-keystroke, and "a" is the
first character — so this matches the very first emission and tolerates a handler that drops every
keystroke after the first (or fires stale values). It does not prove the final value `"alice"`
propagated. Combined with `mockClear()` at line 47, a bug that emitted only `"a"` and then stopped
would still pass.
**Fix:** Assert the terminal value to pin real propagation:
```tsx
await waitFor(() => {
  expect(handler).toHaveBeenLastCalledWith(
    expect.objectContaining({ name: "alice" }),
    expect.objectContaining({ isDirty: true })
  );
});
```

## Info

### IN-01: Coverage thresholds clear by <3pp on every metric — fragile gate

**File:** `vitest.config.ts:16-21`
**Issue:** Measured vs. floor: lines 56.69 vs 54, statements 54.63 vs 52, functions 48.3 vs 46,
branches 38.78 vs 36. Every margin is under ~3pp. Deleting or skipping a single test can drop a
metric below its floor and fail the build, which is brittle for a suite this small. This is the
documented "measured minus 2pp" strategy, so it is intentional — flagged for awareness, not as a
defect.
**Fix:** None required. When Phase 5 raises coverage, widen the safety band (e.g. measured minus
5pp) so routine test edits do not trip the gate.

### IN-02: Coverage-config comment swaps the lines/statements labels

**File:** `vitest.config.ts:11`
**Issue:** The comment reads "lines=56.69%, ... statements=54.63%", but v8's `All files` row order
is Stmts|Branch|Funcs|Lines = 54.63|38.78|48.3|56.69 — i.e. statements=54.63 and lines=56.69. The
numeric thresholds (`lines: 54`, `statements: 52`) still hold for both metrics, so there is no
functional impact, but the annotation will mislead the next maintainer tuning the floors.
**Fix:** Correct the comment to "statements=54.63%, lines=56.69%".

### IN-03: RN-mock comment over-claims that overrides are required for TextInput

**File:** `src/Forger/Forger.rn.test.tsx:6-10, 19`
**Issue:** The header comment states the `isTextInput`/`isSwitch`/etc. overrides are necessary
because those helpers "close over the const." True in principle, but `Forger.tsx:50` also has a
`displayName === 'TextInput'` fallback that makes the `isTextInput` override non-load-bearing for
the TextInput path (see WR-03). The comment implies more rigor than the TextInput test delivers.
**Fix:** Trim the comment to reflect which overrides are actually exercised, or strengthen Test 1
per WR-03 so the override is genuinely required.

### IN-04: `safeOnSubmit` uses `useCallback` with a non-constant inline default (pre-existing)

**File:** `src/Forge/Forge.tsx:56`
**Issue:** `useCallback(onSubmit ?? (() => {}), [onSubmit])` — when `onSubmit` is undefined, a new
`() => {}` is created on every render before `useCallback` memoizes it; React's eslint rule would
flag the inline-function-in-deps pattern. Not introduced by this phase and has no correctness
impact (the dep is `onSubmit`, not the inline fn), but worth a follow-up since several phase tests
pass `onSubmit={vi.fn()}` and exercise this path.
**Fix:** Hoist the fallback: `const noop = useCallback(() => {}, []);` then
`const safeOnSubmit = useMemo(() => onSubmit ?? noop, [onSubmit, noop]);` — or leave as-is and
suppress; out of scope for Phase 3.

---

_Reviewed: 2026-05-31T15:25:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
