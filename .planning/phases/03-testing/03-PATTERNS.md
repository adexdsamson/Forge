# Phase 3: Testing - Pattern Map

**Mapped:** 2026-05-31
**Files analyzed:** 9 (7 new test files + 2 modified config files)
**Analogs found:** 9 / 9 (all files have at least one analog or self-reference)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/Forge/Forge.errors.test.tsx` | test | request-response | `src/Forge/Forge.submit.test.tsx` | exact |
| `src/Forger/Forger.rn.test.tsx` | test | event-driven | `src/Forge/Forge.submit.test.tsx` | role-match + RN pattern from RESEARCH.md |
| `src/validateField.test.ts` | test | transform | `src/Forge/Forge.submit.test.tsx` (direct-fn variant from RESEARCH.md) | role-match |
| `src/useFieldArray/useFieldArray.test.tsx` | test | CRUD | `src/Forge/Forge.submit.test.tsx` | role-match |
| `src/usePersist/usePersist.test.tsx` | test | event-driven | `src/Forge/Forge.submit.test.tsx` | role-match |
| `src/useForgeValues/useForgeValues.test.tsx` | test | request-response | `src/Forge/Forge.submit.test.tsx` | role-match |
| `vitest.config.ts` | config | — | `vitest.config.ts` (self — add coverage block) | exact |
| `package.json` | config | — | `package.json` (self — add devDep + update script) | exact |

---

## Pattern Assignments

### `src/Forge/Forge.errors.test.tsx` (test, request-response — CORR-02 + D-06)

**Analog:** `src/Forge/Forge.submit.test.tsx`

**Imports pattern** (lines 10-17 of analog):
```typescript
/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Forge } from "./Forge";
import { Forger } from "../Forger/Forger";
import { useForge } from "../useForge/useForge";
```

**TextInput forwardRef helper pattern** (lines 23-46 of analog — copy verbatim into this file or extract to a shared helper if the planner deems duplication too heavy):
```typescript
const TextInput = React.forwardRef<
  HTMLInputElement,
  {
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    name?: string;
    "data-testid"?: string;
  }
>((props, ref) => {
  const { value = "", onChange, onBlur, name, ...rest } = props;
  return (
    <input
      ref={ref}
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      {...rest}
    />
  );
});
TextInput.displayName = "TextInput";
```

**CORR-02 throw-assertion pattern** (from RESEARCH.md Pattern 4 — verified against `src/Forger/Forger.tsx` lines 119-132):
```typescript
// Forger.tsx lines 119-123 — actual error message template:
// `Forger: field "${props.name}" expects exactly one valid React element as its child`

it("CORR-02: multiple children throws Forger-named error with field name", () => {
  // Suppress React 18 error boundary console noise (Pitfall 3 from RESEARCH.md)
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  // Need a control handle — build a minimal form wrapper
  function ThrowingForm() {
    const { control } = useForge({ defaultValues: { myField: "" } });
    return (
      <Forge control={control} onSubmit={vi.fn()}>
        <Forger name="myField" component={TextInput}>
          <span />
          <span />
        </Forger>
      </Forge>
    );
  }

  expect(() => render(<ThrowingForm />)).toThrow(/Forger/);
  // Also verify it names the field in the message:
  expect(() => render(<ThrowingForm />)).toThrow(/myField/);

  consoleError.mockRestore();
});
```

**beforeEach pattern** (line 52-54 of analog):
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

### `src/Forger/Forger.rn.test.tsx` (test, event-driven — D-04 RN branches)

**Analog:** `src/Forge/Forge.submit.test.tsx` + RN mock from RESEARCH.md Pattern 2

**CRITICAL: Hoisted vi.mock must be the very first statement in the file.** Vitest transforms `vi.mock` to run before any static imports. This is confirmed as the only pattern that works for module-level constants (RISK-T1, confirmed HIGH confidence in RESEARCH.md).

**Hoisted RN mock pattern** (RESEARCH.md Pattern 2 — the mock seam is `../utils` from this file's location):
```typescript
// THIS BLOCK MUST BE FIRST — before all imports.
// Vitest hoists vi.mock() calls, so even though it appears before imports
// in source, it executes before the SUT module is evaluated.
vi.mock("../utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("../utils")>();
  return {
    ...original,       // preserve Slot, deepEqual, cloneObject, isTextInput, etc.
    isReactNative: true,
    isWeb: false,
    isMobile: true,
  };
});

// Static imports come after — Vitest moves the mock registration before these:
/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { act } from "@testing-library/react";
import { Forge } from "../Forge/Forge";
import { Forger } from "./Forger";
import { useForge } from "../useForge/useForge";
```

**RN custom component pattern** — RN components don't use `HTMLInputElement`; supply a plain React component that accepts `onChangeText`/`onValueChange` as props:
```typescript
// Minimal RN-style TextInput component for jsdom:
// Forger will inject onChangeText (not onChange) when isReactNative=true
// and the component's displayName === 'TextInput' (Forger.tsx line 50-51).
const RNTextInput = React.forwardRef<
  any,
  { value?: string; onChangeText?: (text: string) => void; [key: string]: any }
>((props, ref) => {
  // Under jsdom this renders as a span; we assert via prop presence
  return <span ref={ref as any} data-testid={props["data-testid"]} />;
});
RNTextInput.displayName = "TextInput"; // matches the isTextInput check in Forger.tsx line 50
```

**RN event-handler assertion pattern** — because jsdom doesn't fire RN events natively, assert the prop is wired (call the prop directly via `act`):
```typescript
it("Forger injects onChangeText for RN TextInput components", async () => {
  let capturedProps: any;

  const CapturingRNInput = React.forwardRef<any, any>((props, ref) => {
    capturedProps = props;
    return <span ref={ref} />;
  });
  CapturingRNInput.displayName = "TextInput"; // triggers RN branch in Forger.tsx:50

  function TestForm() {
    const { control } = useForge({ defaultValues: { username: "" } });
    return (
      <Forge control={control} onSubmit={vi.fn()}>
        <Forger name="username" component={CapturingRNInput} />
      </Forge>
    );
  }

  render(<TestForm />);

  // Assert RN handler wired, not web onChange
  expect(capturedProps.onChangeText).toBeDefined();
  expect(capturedProps.onChange).toBeUndefined(); // Forger.tsx:47: handlers.onChange = () => {}
  // Or: confirm onChange is a no-op
  // Invoke the handler directly to verify the RHF field updates
  await act(async () => {
    capturedProps.onChangeText("hello");
  });
  // Verify the value was pushed to RHF (indirectly via submit or getValues)
});
```

**onValueChange pattern** (for Switch/Picker/Slider — Forger.tsx lines 53-55):
```typescript
// For components that isSwitch/isPicker/isSlider returns true for:
// Forger injects onValueChange instead of onChangeText
// Pattern: same capturing approach, assert onValueChange is defined
```

---

### `src/validateField.test.ts` (test, transform — direct function call, no render)

**Analog:** `src/Forge/Forge.submit.test.tsx` (idiom baseline) + RESEARCH.md Pattern 3

**Imports pattern** (no React/render needed — pure function test):
```typescript
/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import validateField from "./validateField";
// Note: no React, no render, no @testing-library — validateField is a plain async fn
```

**Web-branch ref pattern** (RESEARCH.md Pattern 3 — ref contract confirmed at `src/validateField.ts` line 153):
```typescript
// validateField.ts line 153: const inputRef: any = refs ? refs[0] : ref;
// Web path (lines 154-158): inputRef.setCustomValidity + inputRef.reportValidity

it("required rule returns error for empty value", async () => {
  const ref = document.createElement("input"); // real jsdom HTMLInputElement
  ref.setCustomValidity = vi.fn() as any;
  ref.reportValidity = vi.fn() as any;

  const field = {
    _f: {
      ref,
      refs: undefined,   // so inputRef = ref (line 153)
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

**RN-branch test file strategy** — because `src/validateField.ts` imports `isWeb`/`isReactNative` from `./utils` at module level, the RN branch tests for validateField MUST go in a separate file that hoists `vi.mock("./utils", ...)`. From `src/validateField.test.ts`'s perspective the path to utils is `./utils`.

**RN-branch ref pattern** (RESEARCH.md Pattern 3, RISK-T3 confirmed HIGH confidence):
```typescript
// In a separate src/validateField.rn.test.ts file with hoisted vi.mock("./utils"):
// validateField.ts lines 159-163: inputRef.setNativeProps({ error: message })

it("required rule calls setNativeProps on RN ref when shouldUseNativeValidation=true", async () => {
  const mockSetNativeProps = vi.fn();
  const rnRef = { setNativeProps: mockSetNativeProps } as any;

  const field = {
    _f: {
      ref: rnRef,
      refs: undefined,
      name: "username",
      required: "Required",
      mount: true,
      disabled: false,
    },
  } as any;

  const result = await validateField(
    field,
    { username: "" },
    false,
    true  // shouldUseNativeValidation=true gates the setNativeProps call (line 155)
  );
  expect(result).toHaveProperty("username");
  expect(mockSetNativeProps).toHaveBeenCalledWith(
    expect.objectContaining({ error: "Required" })
  );
});
```

**Multiple rule test pattern** (use beforeEach to reset ref mocks between tests):
```typescript
describe("validateField — web rules", () => {
  let ref: HTMLInputElement;

  beforeEach(() => {
    ref = document.createElement("input");
    ref.setCustomValidity = vi.fn() as any;
    ref.reportValidity = vi.fn() as any;
  });

  it("minLength rule returns error when value too short", async () => { ... });
  it("maxLength rule returns error when value too long", async () => { ... });
  it("pattern rule returns error on mismatch", async () => { ... });
  it("custom validate fn returning string is an error", async () => { ... });
  it("passing validation returns empty error object", async () => { ... });
});
```

---

### `src/useFieldArray/useFieldArray.test.tsx` (test, CRUD)

**Analog:** `src/Forge/Forge.submit.test.tsx`

**Imports pattern** (same as analog — add `act`):
```typescript
/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Forge } from "../Forge/Forge";
import { Forger } from "../Forger/Forger";
import { useForge } from "../useForge/useForge";
import { useFieldArray } from "./useFieldArray";
```

**useFieldArray integration test pattern** — render a real `<Forge>` tree; `useFieldArray` requires `FormProvider` context (it calls `useFormContext` at line 27 of `useFieldArray.tsx`):
```typescript
// useFieldArray.tsx line 27: const methods = useFormContext<TFieldValues>();
// Must be inside a <Forge> (which provides FormProvider).

function DynamicForm({ onSubmit = vi.fn() }) {
  const { control } = useForge({
    defaultValues: { items: [{ value: "first" }] }
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
    inputProps: {},
  });

  return (
    <Forge control={control} onSubmit={onSubmit}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <Forger
            name={`items.${index}.value`}
            component={TextInput}
            data-testid={`item-${index}`}
          />
          <button type="button" onClick={() => remove(index)} data-testid={`remove-${index}`}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => append({ value: "" })} data-testid="add-btn">
        Add
      </button>
      <button type="submit" data-testid="submit-btn">Submit</button>
    </Forge>
  );
}
```

**inputProps passthrough pattern** — `useFieldArray`'s Forge-specific value (`fields[n].inputProps`):
```typescript
// useFieldArray.tsx lines 52-59: fields are rhf.fields mapped with inputProps overlaid.
// The test for this is: each field returned from useFieldArray has the inputProps attached.
it("fields include inputProps from useFieldArray config", async () => {
  const inputProps = { placeholder: "Enter value", maxLength: 50 };
  // ... render form with inputProps passed to useFieldArray
  // Verify that capturedFields[0].inputProps === inputProps
});
```

---

### `src/usePersist/usePersist.test.tsx` (test, event-driven)

**Analog:** `src/Forge/Forge.submit.test.tsx`

**Imports pattern**:
```typescript
/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Forge } from "../Forge/Forge";
import { Forger } from "../Forger/Forger";
import { useForge } from "../useForge/useForge";
import { usePersist } from "./usePersist";
```

**Initial-mount-then-action pattern** (RESEARCH.md Pattern 5 + Pitfall 4):
```typescript
// usePersist.tsx lines 35-40: useWatch emits on mount → effect fires immediately.
// Pitfall 4: mockClear after initial-mount wait, then re-assert after action.

it("handler fires on field value change with correct values and isDirty", async () => {
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

  // Wait for initial mount emission (useWatch fires on mount per usePersist.tsx:35)
  await waitFor(() => expect(handler).toHaveBeenCalled());

  // Clear so subsequent assertion is about the user-interaction emission only
  handler.mockClear();

  await userEvent.type(screen.getByTestId("name-input"), "alice");

  await waitFor(() => {
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.stringContaining("a") }),
      expect.objectContaining({ isDirty: true })   // usePersist.tsx:39: { isDirty, isValid }
    );
  });
});
```

**Handler identity stability pattern** (usePersist.tsx lines 31-32 — `handlerRef` prevents stale closure):
```typescript
// No specific test needed for the ref mechanism itself — it's an implementation detail.
// Test the observable: handler always sees the latest values even if re-renders occur.
```

---

### `src/useForgeValues/useForgeValues.test.tsx` (test, request-response)

**Analog:** `src/Forge/Forge.submit.test.tsx`

**Imports pattern**:
```typescript
/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { Forge } from "../Forge/Forge";
import { Forger } from "../Forger/Forger";
import { useForge } from "../useForge/useForge";
import { useForgeValues } from "./useForgeValues";
```

**Context-capture pattern** — `useForgeValues` requires `FormProvider` (useForgeValues.tsx line 63: `useFormContext`); extract the hook's return via a captured ref:
```typescript
// useForgeValues.tsx line 63: const ctx = useFormContext<TFieldValues>();
// Must render inside <Forge>. Capture return value via ref pattern.

it("getValue returns registered field value", async () => {
  let capturedGetValue: any;
  let capturedSetValue: any;

  function TestForm() {
    const { control } = useForge({ defaultValues: { email: "test@example.com" } });
    const { getValue, setValue } = useForgeValues({ control });
    capturedGetValue = getValue;
    capturedSetValue = setValue;
    return (
      <Forge control={control} onSubmit={vi.fn()}>
        <Forger name="email" component={TextInput} />
      </Forge>
    );
  }

  render(<TestForm />);
  await waitFor(() => expect(capturedGetValue).toBeDefined());

  expect(capturedGetValue("email")).toBe("test@example.com");
});
```

**getValue-throws pattern** (RESEARCH.md Pattern 6 — from useForgeValues.tsx lines 71-74):
```typescript
// useForgeValues.tsx lines 71-74: throws `useForgeValues.getValue: field "${name}" is not registered`

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

---

### `vitest.config.ts` (config — add coverage block)

**Current shape** (lines 1-9 of `vitest.config.ts`):
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

**Target shape after modification** (from RESEARCH.md Coverage Configuration section):
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      // Thresholds: set AFTER all test files are written and coverage is measured (RISK-T2).
      // Initially set to 0 during development; planner finalizes numbers in the D-05 band (60-70%).
      thresholds: {
        lines: 65,        // set from measured coverage — RISK-T2 requires measuring first
        functions: 65,
        statements: 65,
        branches: 45,     // lower: RHF-driven branches are hard to fully exercise
      },
      exclude: [
        "**/index.ts",         // barrel re-export files (src/index.ts, hook index files)
        "src/types.ts",        // type declarations only — no runtime code
        "**/*.test.*",         // test files themselves
        "rollup.config.mjs",   // build tooling
      ],
    },
  },
});
```

**Key constraint:** The `--coverage` flag must be added to the `test` script in `package.json` (not only to a separate `coverage` script) to satisfy TEST-04: "Running `yarn test` fails with non-zero exit code when coverage falls below threshold." Vitest 4.x exits with code 1 on threshold violation (VERIFIED in RESEARCH.md).

---

### `package.json` (config — add devDependency + update test script)

**Current `scripts` block** (lines 15-21 of `package.json`):
```json
"scripts": {
  "build": "rollup -c",
  "rollup": "rollup -c",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Target `scripts.test`** after modification:
```json
"test": "vitest run --coverage"
```

**New devDependency to add:**
```json
"@vitest/coverage-v8": "^4.1.7"
```

Version MUST match `vitest` version (`4.1.7`) — verified against npm registry in RESEARCH.md. Without it, `vitest run --coverage` prints "MISSING DEPENDENCY" and exits.

---

## Shared Patterns

### Pattern A: Integration Test Harness (applies to all `.test.tsx` files)

**Source:** `src/Forge/Forge.submit.test.tsx` lines 10-54
**Apply to:** `Forge.errors.test.tsx`, `useFieldArray.test.tsx`, `usePersist.test.tsx`, `useForgeValues.test.tsx`

Core structure every web-mode test file follows:
```typescript
/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// ... SUT imports

// Shared forwardRef TextInput (copy verbatim or import from shared helper)
const TextInput = React.forwardRef< ... >(...);
TextInput.displayName = "TextInput";

describe("SUT — behavior description", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("describes observable behavior", async () => {
    const onSubmit = vi.fn();
    function TestForm() {
      const { control } = useForge({ defaultValues: { ... } });
      return (
        <Forge control={control} onSubmit={onSubmit}>
          ...
        </Forge>
      );
    }
    render(<TestForm />);
    // ... interact via userEvent
    await waitFor(() => { expect(...); });
  });
});
```

### Pattern B: Hoisted vi.mock for RN Mode (applies to all RN-branch test files)

**Source:** RESEARCH.md Pattern 2 (seam confirmed against `src/Forger/Forger.tsx` line 6-12, `src/validateField.ts` lines 26-32, `src/reactNative.ts` line 6)
**Apply to:** `Forger.rn.test.tsx`, `validateField.rn.test.ts` (or the RN section of `validateField.test.ts` if split into a separate file)

```typescript
// MUST be first statement in file (no imports above it in source — Vitest hoists it above imports)
vi.mock("../utils", async (importOriginal) => {   // path relative to the test file
  const original = await importOriginal<typeof import("../utils")>();
  return {
    ...original,
    isReactNative: true,
    isWeb: false,
    isMobile: true,
  };
});
```

Path adjustment per test file:
- `src/Forger/Forger.rn.test.tsx` → `vi.mock("../utils", ...)`
- `src/validateField.rn.test.ts` → `vi.mock("./utils", ...)`

### Pattern C: React 18 Throwing Component Assertion

**Source:** RESEARCH.md Pitfall 3 (verified against `src/Forger/Forger.tsx` lines 119-132)
**Apply to:** `Forge.errors.test.tsx` (CORR-02 test)

```typescript
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
expect(() => render(<ComponentThatThrows />)).toThrow(/ExpectedErrorPattern/);
consoleError.mockRestore();
```

### Pattern D: usePersist Initial-Mount Mock Clear

**Source:** RESEARCH.md Pitfall 4 (verified against `src/usePersist/usePersist.tsx` lines 35-40)
**Apply to:** `usePersist.test.tsx`

```typescript
await waitFor(() => expect(handler).toHaveBeenCalled()); // drain initial mount emission
handler.mockClear();
await userEvent.type(...);
await waitFor(() => expect(handler).toHaveBeenCalledWith(/* specific post-action values */));
```

---

## No Analog Found

No files fall into this category. All new test files have the existing `Forge.submit.test.tsx` as a direct role-match analog, and the RN mock pattern is confirmed by RESEARCH.md with HIGH confidence (seam traced in all five consumer modules).

---

## TextInput Helper Sharing Decision (for Planner)

The `TextInput` forwardRef helper appears in `Forge.submit.test.tsx` lines 23-46 and will be needed in at least 4 of the 6 new test files. Two options:

1. **Copy verbatim** into each test file — simple, zero coupling, matches the existing precedent.
2. **Extract to `src/__test-utils__/TextInput.tsx`** — DRY, but introduces a `__test-utils__` directory (not currently in the project structure; CONTEXT.md prohibits `__tests__/` but does not mention `__test-utils__`).

**Recommendation:** The planner should extract to a shared helper if 3+ files duplicate it. The safe extraction path is `src/test-utils.tsx` (no underscores, no special directory) which Vitest's coverage `exclude` list can target with `"src/test-utils.tsx"`.

---

## Metadata

**Analog search scope:** `src/` (all TypeScript/TSX files); `vitest.config.ts`, `package.json`
**Files scanned:** 10 source files + 2 config files
**Pattern extraction date:** 2026-05-31
