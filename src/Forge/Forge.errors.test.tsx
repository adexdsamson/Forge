/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { Forge } from "./Forge";
import { Forger } from "../Forger/Forger";
import { useForge } from "../useForge/useForge";
import { TextInput } from "../test-utils";

// ---------------------------------------------------------------------------
// CORR-02 regression test (D-06):
// Rendering Forger with multiple children must throw a clear, Forger-named
// error that also names the field. This is the assertion that pins CORR-02
// so it cannot silently regress.
// ---------------------------------------------------------------------------

describe("Forge errors — CORR-02 regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("CORR-02: Forger with two children throws error matching /Forger/ and /myField/", () => {
    // Suppress React 18 error boundary console noise (Pitfall 3 from RESEARCH.md).
    // React 18 logs to console even when the thrown error is caught by expect().toThrow().
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // ThrowingForm is defined as a named component (not inline JSX) to avoid React 18
    // render reconciler edge cases with anonymous component trees.
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

    // Assert both /Forger/ and /myField/ match the thrown error message.
    // D-06: the error must be Forger-named AND name the field (src/Forger/Forger.tsx:119-123).
    expect(() => render(<ThrowingForm />)).toThrow(/Forger/);

    consoleError.mockRestore();
  });

  it("CORR-02: thrown error message also contains the field name", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

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

    expect(() => render(<ThrowingForm />)).toThrow(/myField/);

    consoleError.mockRestore();
  });
});
