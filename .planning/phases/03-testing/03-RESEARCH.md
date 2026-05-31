# Phase 3: Testing - Research

**Researched:** 2026-05-31
**Domain:** Vitest 4.x test suite for a cross-platform React + react-hook-form library
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Break freely.** Pre-1.0, no published consumers. Tests assert the *corrected* behavior from Phases 1–2; do not write tests that pin pre-fix bugs.
- **D-02 — Preserve cross-platform-by-runtime-detection.** Tests must not introduce a hard `react-native` import. Platform is decided by the module-level `isWeb`/`isReactNative` constants in `src/utils.ts` (evaluated once at import).
- **D-03 — Integration-style tests (render real components).** Test hooks (`useFieldArray`, `usePersist`, `useForgeValues`) and the core flow by rendering a real `<Forge>`/`<Forger>` tree and driving it with `@testing-library` user interactions, asserting observable behavior — matching the existing `Forge.submit.test.tsx`. `validateField` (a standalone async function) is tested directly as a function.
- **D-04 — Test the RN branches via mocked platform detection.** Force React Native mode by mocking `src/utils.ts` exports `isReactNative`/`isWeb` before the SUT module is imported.
- **D-05 — Modest, core-focused threshold (~60–70%), enforced and documented.** Configure Vitest coverage with a global threshold in the ~60–70% band such that `npm test` / `yarn test` exits non-zero when coverage falls below it. The threshold value is documented in the test config.
- **D-06 — Keep CORR-01/04 tests; add a CORR-02 regression test.** Retain `Forge.submit.test.tsx`. Add a test asserting CORR-02: passing invalid or multiple children to `<Forger>` throws a clear, Forger-named error that also names the field `name`. Do NOT add a runtime test for CORR-03.

### Claude's Discretion

- **Test file organization:** co-locate `*.test.tsx`/`*.test.ts` next to source files, matching `src/Forge/Forge.submit.test.tsx`. Do NOT introduce a `__tests__/` directory.
- **Coverage provider:** Vitest's default `v8` provider. Requires adding `@vitest/coverage-v8` to devDependencies.
- **`yarn` vs `npm`:** Keep npm as canonical runner; `test` script stays as `vitest run`. Ensure running with either `npm test` or `yarn test` works.
- **Test data / custom input components:** Reuse the minimal `forwardRef` `TextInput` pattern from `Forge.submit.test.tsx`; extract to a shared test helper if duplicated across files (planner's call).
- **Exact coverage threshold number, exclusion list, and per-metric split** within the D-05 band.

### Deferred Ideas (OUT OF SCOPE)

- **Dedicated React Native test environment / RN example app (RN-01)** — v2 requirement. RN covered in v1 only via mocked-detection unit tests.
- **High coverage bar (~90%) / near-exhaustive edge-case testing** — deferred.
- **Snapshot testing / visual regression** — not chosen.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Test runner + config (Vitest) set up, runnable via `yarn test` / `npm test` | Foundation already in place (vitest 4.1.7, jsdom, globals, @testing-library). Add coverage block to vitest.config.ts and install `@vitest/coverage-v8`. |
| TEST-02 | A test renders `useForge` + `<Forge>` + `<Forger>`, fills values, submits, asserts `onSubmit` payload (web path) | Already satisfied by `Forge.submit.test.tsx` Tests 1–2. May be extended but not re-done. |
| TEST-03 | Tests cover `useFieldArray` (append/remove), `usePersist`/`useForgeValues` value subscriptions, `validateField` rules, wizard navigation incl. last-step submit | New test files needed: `useFieldArray.test.tsx`, `usePersist.test.tsx` (or combined), `validateField.test.ts`. Wizard test already covered in Test 3 of existing file. RN-branch coverage via D-04 mock. |
| TEST-04 | Meaningful coverage threshold enforced; `yarn test` exits non-zero when below threshold, threshold documented in config | Vitest 4.x exits with code 1 on threshold violation. Requires `--coverage` flag in `test` script and `test.coverage.thresholds` in vitest.config.ts. Baseline from 1 test file: lines 44.81% — threshold must be set from measured coverage after all tests are written (RISK-T2). |
</phase_requirements>

---

## Summary

The Forge repo already has a functional Vitest 4.1.7 test harness from Phase 2: jsdom environment, globals, `@testing-library/react` 16.3.2, `@testing-library/user-event` 14.6.1, jest-dom, and one passing test file with three integration tests. Phase 3 extends this foundation rather than rebuilding it.

The central technical challenge is RISK-T1: the module-level `isWeb`/`isReactNative` constants in `src/utils.ts` are computed once at import time using `typeof window` checks. Under jsdom, these resolve to web mode permanently for the life of the module registry. Forcing React Native mode in a test requires mocking `src/utils.ts` before the SUT module is imported. The only seam is `src/utils.ts` itself — all five platform-branching modules (`Forge.tsx`, `Forger.tsx`, `validateField.ts`, `reactNative.ts`, and the utils functions themselves) import directly from that single file. A hoisted `vi.mock` factory with `importOriginal` spread is the proven Vitest pattern; `vi.resetModules()` plus dynamic `import()` is the alternative for per-test isolation.

Coverage infrastructure requires adding one devDependency (`@vitest/coverage-v8 ^4.1.7`) and a `test.coverage` block to `vitest.config.ts`. Threshold violations in Vitest 4.x (confirmed by live test) exit with code 1. The `test` script must pass `--coverage` to make threshold enforcement part of the standard `npm test` run (TEST-04 success criterion 4 requires this).

**Primary recommendation:** Write integration tests first (D-03 style), measure coverage, set the threshold conservatively within the 60–70% band (lines/functions/statements), set branches lower (~40–50%) because RHF-driven branch coverage is harder to achieve, then lock the threshold in `vitest.config.ts`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Test harness config | Test config (`vitest.config.ts`) | `package.json` scripts | Config drives env, globals, coverage; scripts expose it to CI |
| Integration rendering | Test files + `@testing-library/react` | Component tree (Forge/Forger) | D-03: render real components, assert DOM/callback behavior |
| RN branch testing | `vi.mock` factory in test files | `src/utils.ts` (mock seam) | All platform constants derive from one source file |
| Coverage enforcement | `vitest.config.ts` `test.coverage.thresholds` | `npm test` script (--coverage flag) | Threshold in config; `--coverage` in script makes it run unconditionally |
| Validator testing | Direct function call (no render) | `src/validateField.ts` | validateField is a pure async function; no component wrapper needed |

---

## Standard Stack

### Core (already installed — do NOT reinstall)

| Library | Installed Version | Purpose | Source |
|---------|------------------|---------|--------|
| `vitest` | `4.1.7` | Test runner, mock APIs, coverage orchestration | [VERIFIED: node_modules] |
| `@testing-library/react` | `16.3.2` | `render`, `screen`, `waitFor` for component integration tests | [VERIFIED: node_modules] |
| `@testing-library/user-event` | `14.6.1` | `userEvent.click`, `userEvent.type`, `userEvent.keyboard` | [VERIFIED: node_modules] |
| `@testing-library/jest-dom` | `6.9.1` | DOM matchers (`toBeInTheDocument`, `toHaveValue`) | [VERIFIED: node_modules] |
| `jsdom` | `29.1.1` | Browser DOM simulation (gives `window`, `document`, sets `isWeb=true` automatically) | [VERIFIED: node_modules] |

### New Dependency (must be added in this phase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@vitest/coverage-v8` | `^4.1.7` | V8-native coverage instrumentation for Vitest | [VERIFIED: npm registry — `npm view @vitest/coverage-v8 version` → 4.1.7; matches installed vitest version. `vitest run --coverage` without it prints "MISSING DEPENDENCY" and errors.] |

**Installation command:**
```bash
npm install --save-dev @vitest/coverage-v8
```

**Version verification:** `@vitest/coverage-v8` version must match `vitest` version (both 4.1.7). The npm registry confirms 4.1.7 is current as of research date. [VERIFIED: npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
npm test (vitest run --coverage)
        |
        v
vitest.config.ts
  environment: jsdom          ← sets window/document → isWeb=true by default
  globals: true
  setupFiles: vitest.setup.ts ← imports @testing-library/jest-dom
  coverage:
    provider: v8
    thresholds: { lines, functions, statements, branches }
    exclude: [barrel files, types.ts, *.test.*]
        |
        v
Test Files (co-located next to source)
  src/Forge/Forge.submit.test.tsx       (existing — 3 tests)
  src/Forge/Forge.errors.test.tsx       (CORR-02 regression)
  src/Forger/Forger.rn.test.tsx         (D-04 RN branch — mocked utils)
  src/validateField/validateField.test.ts (direct fn call, web + RN mock)
  src/useFieldArray/useFieldArray.test.tsx (append/remove via render)
  src/usePersist/usePersist.test.tsx    (subscription behavior)
  src/useForgeValues/useForgeValues.test.tsx (setValue/getValue/throws)
        |
        v
@testing-library/react render()
        |
        +--[web tests]---> real <Forge>/<Forger> tree in jsdom
        |                  userEvent drives interactions
        |                  waitFor asserts callbacks/DOM
        |
        +--[RN tests]----> vi.mock("../utils", importOriginal spread)
                           overrides isReactNative=true, isWeb=false
                           SUT imports the mocked values at module init
                           assert RN event handlers / setNativeProps called
```

### Recommended Project Structure

```
src/
├── Forge/
│   ├── Forge.tsx
│   ├── Forge.submit.test.tsx      (existing — keep)
│   └── Forge.errors.test.tsx      (new — CORR-02 + D-06)
├── Forger/
│   ├── Forger.tsx
│   └── Forger.rn.test.tsx         (new — D-04 RN branches)
├── validateField.ts
├── validateField.test.ts           (new — direct fn call, rules coverage)
├── useFieldArray/
│   ├── useFieldArray.tsx
│   └── useFieldArray.test.tsx      (new — append/remove)
├── usePersist/
│   ├── usePersist.tsx
│   └── usePersist.test.tsx         (new — subscription)
├── useForgeValues/
│   ├── useForgeValues.tsx
│   └── useForgeValues.test.tsx     (new — getValue/setValue/throws)
├── utils.ts                        (no test — core utility, covered transitively)
└── reactNative.ts                  (no dedicated test — covered via Forger.rn.test.tsx)
```

Note: `src/useForge/useForge.tsx` is exercised transitively by every integration test (every test calls `useForge`); no dedicated test file needed unless a gap remains after coverage measurement.

### Pattern 1: Integration Test (D-03 Standard) — Web Mode

This is the canonical pattern established in `Forge.submit.test.tsx`. All new web-mode tests follow it exactly.

```typescript
// Source: src/Forge/Forge.submit.test.tsx (existing, verified passing)
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Forge } from "./Forge";
import { Forger } from "../Forger/Forger";
import { useForge } from "../useForge/useForge";

// Minimal forwardRef custom input — Forger passes value/onChange/onBlur/error/ref
const TextInput = React.forwardRef<
  HTMLInputElement,
  { value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; onBlur?: React.FocusEventHandler<HTMLInputElement>; name?: string; "data-testid"?: string; }
>((props, ref) => {
  const { value = "", onChange, onBlur, name, ...rest } = props;
  return <input ref={ref} type="text" name={name} value={value} onChange={onChange} onBlur={onBlur} {...rest} />;
});
TextInput.displayName = "TextInput";

describe("Component — behavior description", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("asserts observable behavior, not implementation", async () => {
    const onSubmit = vi.fn();
    function TestForm() {
      const { control } = useForge({ defaultValues: { field: "value" } });
      return (
        <Forge control={control} onSubmit={onSubmit}>
          <Forger name="field" component={TextInput} data-testid="field-input" />
          <button type="submit">Submit</button>
        </Forge>
      );
    }
    render(<TestForm />);
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ field: "value" }),
        expect.anything()
      );
    });
  });
});
```

### Pattern 2: React Native Branch Mock (RISK-T1 — CONFIRMED SEAM)

**The single mock seam is `src/utils.ts`.**

All five platform-branching consumers import directly from it:
- `src/Forge/Forge.tsx` — `import { isReactNative } from "../utils"`
- `src/Forger/Forger.tsx` — `import { isReactNative, isTextInput, isPicker, isSwitch, isSlider } from "../utils"`
- `src/validateField.ts` — `import { isWeb, isReactNative } from "./utils"`
- `src/reactNative.ts` — `import { isReactNative, isWeb } from './utils'`
- Internal utils functions (`isHTMLElement`, `isTextInput`, etc.) read `isWeb`/`isReactNative` directly as captured closure values from the module scope

There is no intermediate module — mocking `src/utils` (or `../utils` from the test file's perspective) is the one and only seam.

**Working pattern — hoisted `vi.mock` with `importOriginal`:**

```typescript
// Source: vitest.dev/guide/mocking/modules — importOriginal factory pattern [CITED: vitest.dev/guide/mocking/modules]
// MUST be at top of file — Vitest hoists vi.mock calls before all static imports.
// The factory runs before the SUT module is imported, so isReactNative=true is
// baked into the module-level constant when the SUT first evaluates.

vi.mock("../utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("../utils")>();
  return {
    ...original,         // preserve all other exports (deepEqual, Slot, cloneObject, etc.)
    isReactNative: true,
    isWeb: false,
    isMobile: true,
  };
});

// Static imports below are hoisted AFTER the mock is registered:
import { ForgerController } from "../Forger/Forger";
// ... rest of test file
```

**Critical constraints:**
1. `vi.mock(...)` must appear at file top-level (not inside `describe`/`it`) — Vitest transforms it into a pre-import registration.
2. The factory `async (importOriginal)` form is required when you need other exports to stay real (deepEqual, Slot, etc.).
3. Do not reference variables defined in the test file inside the factory — it is hoisted and those variables don't exist yet. Only `importOriginal` is safe.
4. This mock applies for the ENTIRE test file. If you need both web-mode and RN-mode tests, put them in separate files.

**Alternative — `vi.resetModules` + dynamic `import` (per-test isolation):**

```typescript
// Source: vitest.dev/api/vi#vi-resetmodules [CITED: vitest.dev/api/vi]
// Use when you need to switch platforms within one test file.
// Heavier: re-evaluates the entire module graph per test.

import { vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

it("tests RN branch", async () => {
  vi.doMock("../utils", async () => {
    const original = await import("../utils");
    return { ...original, isReactNative: true, isWeb: false };
  });
  // Dynamic import AFTER doMock so the module re-evaluates:
  const { Forger } = await import("../Forger/Forger");
  // ... test assertions
});
```

**Recommendation for the planner:** Use the hoisted `vi.mock` factory in dedicated RN-mode test files (one file per SUT that needs RN coverage). Avoid mixing web and RN tests in the same file to sidestep the `resetModules` overhead and complexity.

### Pattern 3: `validateField` Direct Function Test (RISK-T3)

`validateField` is an async default-export function with this signature:

```typescript
// Source: src/validateField.ts line 126-133 [VERIFIED: codebase read]
export default async <T extends FieldValues>(
  field: Field,          // field._f contains: ref, refs, required, name, mount, etc.
  formValues: T,
  validateAllFieldCriteria: boolean,
  shouldUseNativeValidation?: boolean,  // gates setCustomValidity / setNativeProps
  isFieldArray?: boolean,
  disabledFieldNames?: InternalNameSet,
): Promise<InternalFieldErrors>
```

**Web-branch test — supply a real HTMLInputElement ref:**

```typescript
// Source: src/validateField.ts analysis [VERIFIED: codebase read]
import validateField from "../validateField";

it("required rule returns error for empty value", async () => {
  const ref = document.createElement("input");
  // setCustomValidity and reportValidity exist on HTMLInputElement in jsdom
  ref.setCustomValidity = vi.fn();
  ref.reportValidity = vi.fn();

  const field = {
    _f: {
      ref,
      name: "email",
      required: "Email is required",
      mount: true,
      disabled: false,
    },
  } as any;

  const result = await validateField(field, { email: "" }, false);
  expect(result).toHaveProperty("email");
  expect(result.email?.type).toBe("required");
  expect(result.email?.message).toBe("Email is required");
});
```

**RN-branch test — supply a mock ref with `setNativeProps`:**

```typescript
// Source: src/validateField.ts lines 154-165 [VERIFIED: codebase read]
// The RN path: inputRef.setNativeProps({ error: message }) when shouldUseNativeValidation=true
// inputRef = refs ? refs[0] : ref  (line 153)

// In RN-mode test file (uses hoisted vi.mock("./utils") → isReactNative=true):
it("required rule calls setNativeProps on RN ref", async () => {
  const mockSetNativeProps = vi.fn();
  const rnRef = { setNativeProps: mockSetNativeProps } as any;

  const field = {
    _f: {
      ref: rnRef,
      name: "username",
      required: "Required",
      mount: true,
      disabled: false,
    },
  } as any;

  const result = await validateField(field, { username: "" }, false, true /* shouldUseNativeValidation */);
  expect(result).toHaveProperty("username");
  expect(mockSetNativeProps).toHaveBeenCalledWith(
    expect.objectContaining({ error: "Required" })
  );
});
```

**RISK-T3 confirmed:** The validator reads `inputRef = refs ? refs[0] : ref` (line 153). For the RN path, supply an object with `setNativeProps: vi.fn()` as the `ref` in `field._f`. The web path uses a real jsdom `HTMLInputElement` with `setCustomValidity` / `reportValidity`.

### Pattern 4: CORR-02 Error Assertion

```typescript
// Source: src/Forger/Forger.tsx lines 119-132 [VERIFIED: codebase read]
// Forger throws when: children != null AND (count > 1 OR not a valid element)
// Error message: `Forger: field "${props.name}" expects exactly one valid React element...`

import { expect } from "vitest";

it("CORR-02: multiple children throws Forger-named error with field name", () => {
  // Suppress React error boundary noise
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  
  expect(() =>
    render(
      <Forge control={control} onSubmit={vi.fn()}>
        <Forger name="myField" component={TextInput}>
          <span />
          <span />
        </Forger>
      </Forge>
    )
  ).toThrow(/Forger/);

  // Also verify it names the field:
  expect(() =>
    render(/* same */
    )
  ).toThrow(/myField/);

  consoleError.mockRestore();
});
```

Note: Rendering a throwing component in React 18 with `@testing-library/react` requires wrapping the `render()` call in `expect(...).toThrow()`. React 18 re-throws errors synchronously during render in test mode.

### Pattern 5: `usePersist` Subscription Test

```typescript
// Source: src/usePersist/usePersist.tsx [VERIFIED: codebase read]
// usePersist(control, handler): fires handler on every values/isDirty/isValid change
// Uses useWatch + useFormState (public APIs, D-12)

it("handler fires on field value change", async () => {
  const handler = vi.fn();
  
  function TestForm() {
    const { control } = useForge({ defaultValues: { name: "" } });
    usePersist({ control, handler });
    return (
      <Forge control={control} onSubmit={vi.fn()}>
        <Forger name="name" component={TextInput} data-testid="name-input" />
      </Forge>
    );
  }
  
  render(<TestForm />);
  
  // Handler fires on mount (initial values emission from useWatch)
  await waitFor(() => expect(handler).toHaveBeenCalled());
  
  // Handler fires again after user interaction
  handler.mockClear();
  await userEvent.type(screen.getByTestId("name-input"), "alice");
  await waitFor(() => {
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.stringContaining("a") }),
      expect.objectContaining({ isDirty: true })
    );
  });
});
```

### Pattern 6: `useForgeValues` getValue-throws Test

```typescript
// Source: src/useForgeValues/useForgeValues.tsx lines 67-76 [VERIFIED: codebase read]
// getValue(name) throws: `useForgeValues.getValue: field "${name}" is not registered`
// when the field is absent from getValues() object

it("getValue throws for unregistered field", async () => {
  let capturedGetValue: any;

  function TestForm() {
    const { control } = useForge({ defaultValues: { email: "" } });
    const { getValue } = useForgeValues({ control });
    capturedGetValue = getValue;
    return (
      <Forge control={control} onSubmit={vi.fn()}>
        <Forger name="email" component={TextInput} />
      </Forge>
    );
  }
  
  render(<TestForm />);
  await waitFor(() => expect(capturedGetValue).toBeDefined());

  expect(() => capturedGetValue("nonexistent" as any)).toThrow(
    /useForgeValues\.getValue.*nonexistent.*not registered/
  );
});
```

### Anti-Patterns to Avoid

- **Mocking react-hook-form internals:** Do not mock `useController`, `useFormContext`, or internal RHF subjects. The point of integration tests (D-03) is to prove Forge works WITH the real RHF. Mocking RHF internals defeats this and re-couples tests to implementation.
- **Mixing web and RN mode in one test file:** The hoisted `vi.mock` applies to the whole file. If you need both modes, use two files.
- **Testing `renderHook` in isolation for hooks that need `FormProvider`:** `useForgeValues` calls `useFormContext()` which requires a `FormProvider` ancestor. Render a full `<Forge>` tree instead.
- **Setting coverage threshold aspirationally before writing tests:** RISK-T2. Measure first, set second.
- **Adding `--coverage` only to a separate `coverage` script:** TEST-04 requires `yarn test` / `npm test` to enforce coverage. The `test` script itself must pass `--coverage`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOM query and assertion | Custom DOM selectors | `@testing-library/react` `screen.*` + `@testing-library/jest-dom` matchers | Already installed; handles async, accessible queries |
| User event simulation | `fireEvent` or raw DOM events | `@testing-library/user-event` `userEvent.*` | More realistic — simulates real browser interaction sequence including focus, input, blur |
| Async test waiting | `setTimeout`, `setInterval` polls | `waitFor(() => expect(...))` | Built-in retry with configurable timeout; avoids flaky timing |
| Coverage instrumentation | Custom instrumentation | `@vitest/coverage-v8` | V8 native — zero transform overhead, accurate branch detection |
| RN component simulation | Full React Native polyfill | `vi.mock` on `src/utils.ts` | Only the platform constants need to be RN; component rendering stays in jsdom |

**Key insight:** `@testing-library` idioms (`render`, `screen`, `userEvent`, `waitFor`) are already proven in the existing test file. Do not deviate from them.

---

## Runtime State Inventory

Step 2.6: SKIPPED — this phase adds test files and modifies `vitest.config.ts` and `package.json`. No rename/refactor/migration is involved; no stored data, live service configs, OS-registered state, secrets, or build artifacts need updating.

---

## Coverage Configuration (VERIFIED)

### Provider: `@vitest/coverage-v8`

[VERIFIED: npm registry and live test] `@vitest/coverage-v8` must be installed separately. Vitest 4.1.7 prints "MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'" and exits if `--coverage` is requested without it. Confirmed: `npm view @vitest/coverage-v8 version` → `4.1.7`.

### Threshold Exit Code

[VERIFIED: live test in this repo] Vitest 4.1.7 exits with code **1** when a threshold is violated. Observed output:
```
ERROR: Coverage for lines (44.81%) does not meet global threshold (99%)
EXIT CODE: 1
```

### Config Shape (Vitest 4.x)

```typescript
// vitest.config.ts — add this coverage block
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      // --coverage flag required in scripts.test for TEST-04:
      // "test": "vitest run --coverage"
      thresholds: {
        lines: 65,        // planner sets from measured coverage — see RISK-T2
        functions: 65,    // same
        statements: 65,   // same
        branches: 45,     // lower: RHF-driven branches hard to exercise fully
      },
      exclude: [
        "**/index.ts",         // barrel re-export files
        "src/types.ts",        // types only, no runtime code
        "**/*.test.*",         // test files themselves
        "**/*.test.tsx",
        "rollup.config.mjs",   // build config
      ],
    },
  },
});
```

[CITED: vitest.dev/config/coverage] Threshold properties: `lines`, `functions`, `branches`, `statements`. All accept positive numbers (minimum %) or negative numbers (maximum uncovered items). No additional config is needed beyond `provider` + `thresholds` + `exclude`.

### Scripts Update

```json
{
  "scripts": {
    "test": "vitest run --coverage",
    "test:watch": "vitest"
  }
}
```

`--coverage` added to `test` (not only to a separate `coverage` script) to satisfy TEST-04 success criterion 4: "Running `yarn test` fails with non-zero exit code when coverage falls below threshold."

---

## Baseline Coverage (VERIFIED: live run)

Coverage from the ONE existing test file (`Forge.submit.test.tsx`, 3 tests):

| File | Statements | Branches | Functions | Lines |
|------|-----------|---------|----------|-------|
| `reactNative.ts` | 14.7% | 0% | 0% | 18.18% |
| `utils.ts` | 35.54% | 20.15% | 23.63% | 37.05% |
| `Forge.tsx` | 60.75% | 60.91% | 44.44% | 60.75% |
| `Forger.tsx` | 62.26% | 37.5% | 53.33% | 66.66% |
| `useForge.tsx` | 87.5% | 57.14% | 60% | 87.5% |
| **All files** | **42.15%** | **27.13%** | **28.57%** | **44.81%** |

Note: `useFieldArray.tsx`, `usePersist.tsx`, `useForgeValues.tsx`, `validateField.ts` are not yet imported by any test — they show 0% and are not in the report. Adding tests for them will substantially move the numbers.

**Implication for RISK-T2:** The planner MUST write all tests first, run coverage, then set thresholds. The current baseline is 44.81% lines. After adding 6–7 new test files covering the untested hooks and validateField, the achievable line coverage is expected to be in the 65–80% range, but this cannot be assumed — it must be measured.

---

## Common Pitfalls

### Pitfall 1: Module-Level Constants Not Mocked (RISK-T1)
**What goes wrong:** `vi.mock("../utils", ...)` set inside `describe()` or `it()` (not at file top level) is not hoisted. The SUT module is imported with the real `isReactNative=false` before the mock is ever registered. RN branches never execute.
**Why it happens:** Vitest hoists `vi.mock` only when it appears as a top-level statement. A `vi.mock` inside a block is a runtime call — too late for module-level constants.
**How to avoid:** Place `vi.mock(...)` at the absolute top of the file (after import statements but before any other code). Vitest's transform moves it before imports. Alternatively, use `vi.doMock` + `vi.resetModules()` + dynamic `import()` inside each test.
**Warning signs:** RN-path tests pass but coverage shows the `if (isReactNative)` branches are still untouched.

### Pitfall 2: Forger Requires FormProvider / useFormContext
**What goes wrong:** Rendering `<Forger>` outside a `<Forge>` (without `FormProvider`) causes `useFormContext()` to throw or return `null`, breaking the test.
**Why it happens:** `Forger.tsx` line 134: `const methods = useFormContext() ?? { control: props?.control }`. The fallback works only if `props.control` is passed directly.
**How to avoid:** Always wrap test renders in `<Forge control={control}>`, or pass `control` explicitly as a prop to `<Forger control={control}>`. The existing `Forge.submit.test.tsx` uses the `<Forge>` wrapper — follow that pattern.
**Warning signs:** `TypeError: Cannot read properties of null` from useFormContext.

### Pitfall 3: Testing Library React 18 + Throwing Components
**What goes wrong:** Rendering a component that throws in React 18 with `@testing-library/react` may also trigger React's error boundary uncaught error noise in the console, even when `expect().toThrow()` catches it.
**Why it happens:** React 18 calls error boundary handlers and logs to console even during caught throws.
**How to avoid:** Spy on `console.error` and suppress it before the render, restore after:
```typescript
const err = vi.spyOn(console, "error").mockImplementation(() => {});
expect(() => render(...)).toThrow(/Forger/);
err.mockRestore();
```
**Warning signs:** Tests pass but produce console noise that breaks CI log parsing.

### Pitfall 4: `waitFor` Timeout on usePersist Initial Emission
**What goes wrong:** `usePersist` fires its handler on the first `useEffect` (initial mount). Tests that assert the handler was called "after an action" may catch the initial mount call instead of the action-triggered call.
**Why it happens:** `useWatch` emits initial values synchronously on mount; `useEffect` fires after paint; the handler fires before the test interaction.
**How to avoid:** Call `handler.mockClear()` after the initial-mount wait, then interact, then assert again:
```typescript
await waitFor(() => expect(handler).toHaveBeenCalled()); // initial mount
handler.mockClear();
await userEvent.type(...);
await waitFor(() => expect(handler).toHaveBeenCalledWith(...specific values...));
```

### Pitfall 5: Coverage Threshold Set Before All Tests Are Written
**What goes wrong:** Threshold is set to 65% when only 3 of 10 planned test files exist, causing `npm test` to fail immediately after setting the threshold.
**Why it happens:** RISK-T2 — aspirational threshold set before coverage is measured.
**How to avoid:** Write all test files first (all waves), then run `vitest run --coverage` without thresholds, observe the numbers, set thresholds conservatively below the measured values.
**Warning signs:** CI is red after threshold is added to config.

### Pitfall 6: `useForgeValues` Requires `FormProvider` Context
**What goes wrong:** `useForgeValues` calls `useFormContext()` internally. Testing it with `renderHook` alone (without a `FormProvider`) will fail.
**Why it happens:** `useForgeValues.tsx` line 63: `const ctx = useFormContext<TFieldValues>()`.
**How to avoid:** Render a `<Forge>` tree and extract the hook's return value via a captured ref or by calling hooks in a child component.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `fireEvent.click` | `userEvent.click` (pointer simulation) | @testing-library/user-event v14 | More realistic interaction; avoids edge cases with button focus/blur |
| `renderHook` for hook isolation | Render real component tree (D-03) | Phase 3 decision | Survives RHF internal changes; tests observable behavior |
| `jest-coverage` / `c8` standalone | `@vitest/coverage-v8` | Vitest 1.x+ | Integrated with Vitest; V8-native; no separate Istanbul transform |
| Vitest 1.x exit code issue | Vitest 4.x exits non-zero on threshold | Fixed in v1.x | Thresholds reliably block CI |

**Deprecated/outdated:**
- `@hookform/devtools` in test scope: the component is now dev-only lazy-loaded; tests should not trigger it (no `debug={true}` prop in test renders).
- `control._subjects` / `control._formValues` access in tests: Phase 2 removed these from production hooks; tests must not access private RHF internals either.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | After adding 6–7 new test files for currently-untested hooks and validateField, total line coverage will reach 65–70%+ range | Baseline Coverage, RISK-T2 | If coverage stays below 65% after all tests, the D-05 threshold band cannot be met with reasonable tests; planner would need to lower threshold or add more exhaustive edge-case tests |
| A2 | Hoisted `vi.mock` factory pattern works correctly in Vitest 4.1.7 to override module-level constants before SUT imports | Pattern 2 (RN Mock) | If Vitest 4.x changed hoisting behavior, `vi.resetModules()` + dynamic import is the fallback |

**All other claims in this research were verified via codebase read, live test runs, npm registry, or official Vitest documentation.**

---

## Open Questions

1. **Exact threshold numbers (RISK-T2)**
   - What we know: Baseline with 1 test file is 44.81% lines / 27.13% branches. The D-05 target band is 60–70%.
   - What's unclear: How much will the 6–7 new test files move the numbers? `useFieldArray`, `usePersist`, `useForgeValues` are currently at 0% and are small/well-scoped — they should move significantly. `utils.ts` (35.5% lines) is large and partially untestable in isolation; coverage via integration tests will improve it but not to 100%.
   - Recommendation: Planner writes all tests in waves, runs coverage after the final wave, then sets thresholds at ~5% below the achieved numbers within the D-05 band. Do not set thresholds mid-phase.

2. **`Forger.rn.test.tsx` render strategy**
   - What we know: RN-mode test mocks `isReactNative=true`. `Forger` still renders a React component tree under jsdom. The RN `onChangeText` handler is injected as a prop.
   - What's unclear: Can `userEvent.type` trigger `onChangeText` in a jsdom environment when a custom component wraps it? The custom component in jsdom is a plain React component — `onChangeText` is a prop, not a DOM event. Simulating it may require calling the prop directly rather than via `userEvent`.
   - Recommendation: For RN-branch Forger tests, render the component with `render()`, get the underlying input element (or call the prop directly via the component instance), and assert that the RN handler was attached (check it is defined on the component's rendered output). Use `act()` + direct prop invocation rather than `userEvent.type` for RN event handlers.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test runner | Yes | 20.x (CI pinned) | None needed |
| npm | Package install | Yes | (from env) | None needed |
| vitest | All tests | Yes | 4.1.7 | None |
| @testing-library/react | Integration tests | Yes | 16.3.2 | None |
| @testing-library/user-event | User interaction simulation | Yes | 14.6.1 | None |
| @testing-library/jest-dom | DOM matchers | Yes | 6.9.1 | None |
| jsdom | DOM environment | Yes | 29.1.1 | None |
| @vitest/coverage-v8 | Coverage (TEST-04) | No — must install | 4.1.7 (matches vitest) | None (required) |

**Missing dependencies with no fallback:**
- `@vitest/coverage-v8` — required for `--coverage` flag to work. Must be added to devDependencies in Wave 0 (setup task).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 |
| Config file | `vitest.config.ts` (exists; coverage block added in this phase) |
| Quick run command | `npx vitest run` (no coverage, fast) |
| Full suite command | `npm test` = `vitest run --coverage` (with threshold enforcement) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | Runner config works, no errors from clean checkout | Config check | `npx vitest run` | Partial — config exists; coverage block missing |
| TEST-02 | useForge + Forge + Forger fill→submit→assert onSubmit (web) | Integration | `npx vitest run src/Forge/Forge.submit.test.tsx` | Yes (3 tests passing) |
| TEST-03a | useFieldArray append / remove | Integration | `npx vitest run src/useFieldArray/useFieldArray.test.tsx` | No — Wave 1 |
| TEST-03b | usePersist value subscription + isDirty | Integration | `npx vitest run src/usePersist/usePersist.test.tsx` | No — Wave 1 |
| TEST-03c | useForgeValues getValue / setValue / throws on unregistered | Integration | `npx vitest run src/useForgeValues/useForgeValues.test.tsx` | No — Wave 1 |
| TEST-03d | validateField rules: required, minLength, maxLength, pattern, custom | Direct fn call | `npx vitest run src/validateField.test.ts` | No — Wave 1 |
| TEST-03e | Wizard nav: next, previous, last-step submit | Integration | Covered by existing Forge.submit.test.tsx Test 3 | Yes |
| TEST-03f (D-04) | Forger RN event handler wiring (onChangeText, onValueChange) | Integration + mock | `npx vitest run src/Forger/Forger.rn.test.tsx` | No — Wave 2 |
| TEST-03g (D-04) | validateField RN branch (setNativeProps called) | Direct fn call + mock | Included in validateField.test.ts RN section | No — Wave 1/2 |
| TEST-03h (D-04) | cloneObject RN guard (uri / _dispatchInstances passthrough) | Direct fn call + mock | Included in utils-rn portion of Forger.rn.test.tsx or dedicated | No — Wave 2 |
| TEST-03i (D-06) | CORR-02: Forger throws named error on multiple/invalid children | Unit (render + expect.toThrow) | `npx vitest run src/Forge/Forge.errors.test.tsx` | No — Wave 1 |
| TEST-04 | npm test exits non-zero when coverage below threshold | Coverage gate | `npm test` | No — coverage block missing from vitest.config.ts |

### Sampling Rate

- **Per task commit:** `npx vitest run` (no coverage — fast, catches regressions)
- **Per wave merge:** `npm test` (with `--coverage`, full threshold check)
- **Phase gate:** Full suite green + coverage above threshold before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — add `test.coverage` block with provider, thresholds (placeholder), exclude list
- [ ] `package.json` — add `@vitest/coverage-v8: ^4.1.7` to devDependencies; update `scripts.test` to `vitest run --coverage`
- [ ] Run `npm install` to update lockfile after adding `@vitest/coverage-v8`

*(Note: threshold numbers in vitest.config.ts should initially be set to 0 or commented out during Wave 1–2 development, then set to measured values after all tests are written)*

---

## Security Domain

This phase adds test infrastructure only — no new public API surface, no authentication, no data persistence, no network calls, no cryptography, no user-supplied input at runtime. ASVS categories V2–V6 do not apply to test-only code that never ships in the published package.

The `test` and `test:watch` scripts in `package.json` are dev-only; the `files` field in `package.json` already limits the published artifact to `dist/` only, so test files are never published.

No security domain findings required for this phase.

---

## Sources

### Primary (HIGH confidence)

- `src/utils.ts` — lines 99–104: actual `isWeb`/`isReactNative`/`isMobile` constant definitions and their `typeof window` evaluation; lines 211–213: `cloneObject` RN guard (`uri`, `_dispatchInstances`) [VERIFIED: codebase read]
- `src/Forger/Forger.tsx` — lines 1–12: import chain confirming `isReactNative` comes from `"../utils"`; lines 119–132: CORR-02 error message template [VERIFIED: codebase read]
- `src/validateField.ts` — lines 153–165: `inputRef` resolution pattern and the `setCustomValidity` (web) vs `setNativeProps` (RN) fork [VERIFIED: codebase read]
- `src/reactNative.ts` — line 6: `import { isReactNative, isWeb } from './utils'` confirming single seam [VERIFIED: codebase read]
- `src/Forge/Forge.tsx` — line 19: `import { isReactNative } from "../utils"` [VERIFIED: codebase read]
- `package.json` — devDependencies: vitest 4.1.7, @testing-library/react 16.3.2, @testing-library/user-event 14.6.1, jsdom 29.1.1 [VERIFIED: codebase read]
- Live test run — `npx vitest run --coverage --coverage.provider=v8 --coverage.thresholds.lines=99`: exit code 1, baseline coverage numbers confirmed [VERIFIED: live test in this session]
- `npm view @vitest/coverage-v8 version` → 4.1.7; `npm view vitest version` → 4.1.7 [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)

- [vitest.dev/guide/mocking/modules](https://vitest.dev/guide/mocking/modules) — importOriginal factory pattern for partial mocks preserving original exports [CITED]
- [vitest.dev/api/vi#vi-resetmodules](https://vitest.dev/api/vi#vi-resetmodules) — resetModules + dynamic import alternative [CITED]
- [vitest.dev/config/coverage](https://vitest.dev/config/coverage) — `thresholds.{lines,functions,branches,statements}` config shape [CITED]
- [vitest.dev/guide/coverage](https://vitest.dev/guide/coverage) — `@vitest/coverage-v8` install command [CITED]

### Tertiary (LOW confidence — not used for locked decisions)

- GitHub discussion #5249 (vitest-dev/vitest) — historical context on exit code issue fixed in v1.x; this project uses v4.1.7 where it is fixed [LOW — single GitHub discussion, but corroborated by live test]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all library versions verified against installed node_modules and npm registry
- RN mock seam (RISK-T1): HIGH — traced import chains in all five consumer files; single seam confirmed
- RISK-T3 ref contract: HIGH — read validateField.ts lines 153–165 directly
- Coverage config shape: HIGH — verified via official docs + live test in this repo
- Exit code behavior: HIGH — confirmed live with exit code 1
- Baseline coverage numbers: HIGH — from live `vitest run --coverage` in this session
- Post-all-tests coverage estimate: LOW [ASSUMED A1] — cannot be known until tests are written

**Research date:** 2026-05-31
**Valid until:** 2026-06-30 (Vitest ecosystem is stable; react-hook-form 7.x is stable)
