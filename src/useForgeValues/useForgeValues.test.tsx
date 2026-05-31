/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { Forge } from "../Forge/Forge";
import { Forger } from "../Forger/Forger";
import { useForge } from "../useForge/useForge";
import { useForgeValues } from "./useForgeValues";
import { TextInput } from "../test-utils";

// ---------------------------------------------------------------------------
// useForgeValues — getValue, setValue, and throws-on-unknown tests.
//
// useForgeValues requires FormProvider context (useFormContext at line 63).
// It must be called inside a descendant of <Forge> (which provides FormProvider).
//
// Pattern: create an inner component (ValuesCapture) that calls useForgeValues
// inside the <Forge> tree and captures the return values via a ref.
//
// Error message from useForgeValues.tsx lines 71-74:
//   `useForgeValues.getValue: field "${name}" is not registered`
// ---------------------------------------------------------------------------

describe("useForgeValues — getValue, setValue, throws for unregistered field", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1: getValue returns the registered field value
  // -------------------------------------------------------------------------
  it("getValue returns the registered field value", async () => {
    let capturedGetValue: any;

    // ValuesCapture must be a child inside <Forge> so FormProvider context is available.
    function ValuesCapture({ control }: { control: any }) {
      const { getValue } = useForgeValues({ control });
      capturedGetValue = getValue;
      return null;
    }

    function TestForm() {
      const { control } = useForge({
        defaultValues: { email: "test@example.com" },
      });
      return (
        <Forge control={control} onSubmit={vi.fn()}>
          <Forger name="email" component={TextInput} />
          <ValuesCapture control={control} />
        </Forge>
      );
    }

    render(<TestForm />);
    await waitFor(() => expect(capturedGetValue).toBeDefined());

    expect(capturedGetValue("email")).toBe("test@example.com");
  });

  // -------------------------------------------------------------------------
  // Test 2: getValue throws for an unregistered field
  // Error: `useForgeValues.getValue: field "nonexistent" is not registered`
  // -------------------------------------------------------------------------
  it("getValue throws for an unregistered field", async () => {
    let capturedGetValue: any;

    function ValuesCapture({ control }: { control: any }) {
      const { getValue } = useForgeValues({ control });
      capturedGetValue = getValue;
      return null;
    }

    function TestForm() {
      const { control } = useForge({ defaultValues: { email: "" } });
      return (
        <Forge control={control} onSubmit={vi.fn()}>
          <Forger name="email" component={TextInput} />
          <ValuesCapture control={control} />
        </Forge>
      );
    }

    render(<TestForm />);
    await waitFor(() => expect(capturedGetValue).toBeDefined());

    // The exact error message from useForgeValues.tsx lines 71-74:
    // `useForgeValues.getValue: field "${name}" is not registered`
    expect(() => capturedGetValue("nonexistent" as any)).toThrow(
      /useForgeValues\.getValue.*nonexistent.*not registered/
    );
  });

  // -------------------------------------------------------------------------
  // Test 3: setValue updates the field value; subsequent getValue reflects it
  // -------------------------------------------------------------------------
  it("setValue updates a field and getValue returns the new value", async () => {
    let capturedGetValue: any;
    let capturedSetValue: any;

    function ValuesCapture({ control }: { control: any }) {
      const { getValue, setValue } = useForgeValues({ control });
      capturedGetValue = getValue;
      capturedSetValue = setValue;
      return null;
    }

    function TestForm() {
      const { control } = useForge({
        defaultValues: { email: "old@example.com" },
      });
      return (
        <Forge control={control} onSubmit={vi.fn()}>
          <Forger
            name="email"
            component={TextInput}
            data-testid="email-input"
          />
          <ValuesCapture control={control} />
        </Forge>
      );
    }

    render(<TestForm />);
    await waitFor(() => expect(capturedGetValue).toBeDefined());

    // Initial value
    expect(capturedGetValue("email")).toBe("old@example.com");

    // Update via setValue (RHF public API) — wrap in act to silence React update warning
    await act(async () => {
      capturedSetValue("email", "new@example.com");
    });

    // Verify via getValue after update
    await waitFor(() => {
      expect(capturedGetValue("email")).toBe("new@example.com");
    });
  });
});
