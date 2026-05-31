// IMPORTANT: vi.mock must be the very first statement in this file.
// Vitest hoists vi.mock() calls above all static imports at transform time,
// so the factory runs before Forger.tsx (the SUT) is imported and evaluates
// its module-level isReactNative constant from ../utils. Without hoisting,
// isReactNative would be false (jsdom sets typeof window, so isWeb=true).
//
// NOTE: isSwitch, isPicker, isSlider, isTextInput in utils.ts all reference the
// module-level isReactNative constant via closure. Spreading the original module
// preserves the closed-over isReactNative=false in those functions. We must
// explicitly override them to use the mocked isReactNative=true value.
vi.mock("../utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("../utils")>();
  return {
    ...original,       // preserve Slot, deepEqual, cloneObject, etc.
    isReactNative: true,
    isWeb: false,
    isMobile: true,
    // Override component-type checkers to use isReactNative=true (they close over the const)
    isTextInput: (element: any): boolean =>
      element != null && (element.displayName === "TextInput" || element.type === "TextInput"),
    isSwitch: (element: any): boolean =>
      element != null && (element.displayName === "Switch" || element.type === "Switch"),
    isPicker: (element: any): boolean =>
      element != null && (element.displayName === "Picker" || element.type === "Picker"),
    isSlider: (element: any): boolean =>
      element != null && (element.displayName === "Slider" || element.type === "Slider"),
  };
});

/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { act } from "@testing-library/react";
import { Forge } from "../Forge/Forge";
import { Forger } from "./Forger";
import { useForge } from "../useForge/useForge";

// ---------------------------------------------------------------------------
// Capturing component for TextInput RN branch
// displayName="TextInput" triggers the isTextInput check in Forger.tsx line 50.
// Forger will inject onChangeText (and set onChange to a no-op) in RN mode.
// ---------------------------------------------------------------------------
let capturedTextInputProps: any = {};

const CapturingRNTextInput = React.forwardRef<any, any>((props, ref) => {
  capturedTextInputProps = props;
  return <span ref={ref} />;
});
CapturingRNTextInput.displayName = "TextInput";

// ---------------------------------------------------------------------------
// Capturing component for Switch RN branch
// displayName="Switch" triggers the isSwitch check in Forger.tsx line 53.
// Forger will inject onValueChange in RN mode.
// ---------------------------------------------------------------------------
let capturedSwitchProps: any = {};

const CapturingSwitchInput = React.forwardRef<any, any>((props, ref) => {
  capturedSwitchProps = props;
  return <span ref={ref} />;
});
CapturingSwitchInput.displayName = "Switch";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Forger — RN event-handler wiring (isReactNative=true via vi.mock)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedTextInputProps = {};
    capturedSwitchProps = {};
  });

  it("Test 1: Forger injects onChangeText (not onChange) for TextInput in RN mode", async () => {
    function TestForm() {
      const { control } = useForge({ defaultValues: { username: "" } });
      return (
        <Forge control={control} onSubmit={vi.fn()}>
          <Forger name="username" component={CapturingRNTextInput} />
        </Forge>
      );
    }

    render(<TestForm />);

    // onChangeText must be wired (Forger.tsx line 51: handlers.onChangeText = ...)
    expect(capturedTextInputProps.onChangeText).toEqual(expect.any(Function));

    // onChange is set to a no-op by Forger.tsx line 52 (handlers.onChange = () => {})
    // It is defined (a function) but not the real RHF onChange — verify it is callable
    // without crashing (the no-op) but the meaningful handler is onChangeText.
    expect(capturedTextInputProps.onChange).toEqual(expect.any(Function));

    // Invoke onChangeText directly — must update RHF state without throwing
    await act(async () => {
      capturedTextInputProps.onChangeText("hello");
    });
  });

  it("Test 2: Forger injects onValueChange for Switch in RN mode", async () => {
    function TestForm() {
      const { control } = useForge({ defaultValues: { toggle: false } });
      return (
        <Forge control={control} onSubmit={vi.fn()}>
          <Forger name="toggle" component={CapturingSwitchInput} />
        </Forge>
      );
    }

    render(<TestForm />);

    // onValueChange must be wired (Forger.tsx line 55: handlers.onValueChange = ...)
    expect(capturedSwitchProps.onValueChange).toEqual(expect.any(Function));

    // Invoke onValueChange directly — must not throw
    await act(async () => {
      capturedSwitchProps.onValueChange(true);
    });
  });
});
