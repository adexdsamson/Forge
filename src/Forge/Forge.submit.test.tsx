/**
 * RISK-04 gate: automated tests that verify native submit, Enter-to-submit,
 * and wizard last-step submit all still fire after the type-only child-walker
 * retype (D-10). These three behaviors carry CORR-01/CORR-04 from Phase 1.
 *
 * jsdom gives us window+document so Forge's module-level isWeb/isReactNative
 * constants resolve to web mode — exactly the path CORR-01/CORR-04 live on.
 */

/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Forge } from "./Forge";
import { Forger } from "../Forger/Forger";
import { useForge } from "../useForge/useForge";

// ---------------------------------------------------------------------------
// Minimal custom text-input that Forger wraps.
// Forger passes value / onChange / onBlur / error / ref — we forward them all.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Test 1: Native submit button — clicking type="submit" fires onSubmit
// ---------------------------------------------------------------------------
describe("Forge — submit behaviors (RISK-04 / CORR-01 / CORR-04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Test 1: native submit button fires onSubmit with field values", async () => {
    const onSubmit = vi.fn();

    function TestForm() {
      const { control } = useForge({ defaultValues: { username: "alice" } });
      return (
        <Forge control={control} onSubmit={onSubmit}>
          <Forger
            name="username"
            component={TextInput}
            // pass data-testid through Forger rest props so it reaches the input
            data-testid="username-input"
          />
          <button type="submit" data-testid="submit-btn">
            Submit
          </button>
        </Forge>
      );
    }

    render(<TestForm />);

    const submitBtn = screen.getByTestId("submit-btn");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ username: "alice" }),
        expect.anything()
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: Enter-to-submit — pressing Enter inside focused text field fires onSubmit
  // -------------------------------------------------------------------------
  it("Test 2: Enter key in a text field submits the form", async () => {
    const onSubmit = vi.fn();

    function TestForm() {
      const { control } = useForge({ defaultValues: { email: "" } });
      return (
        <Forge control={control} onSubmit={onSubmit}>
          <Forger
            name="email"
            component={TextInput}
            data-testid="email-input"
          />
          <button type="submit">Submit</button>
        </Forge>
      );
    }

    render(<TestForm />);

    const input = screen.getByTestId("email-input");
    await userEvent.click(input);
    await userEvent.type(input, "test@example.com");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ email: "test@example.com" }),
        expect.anything()
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: Wizard last-step submit — navigating to last step and pressing the
  // wizard "next" button (which becomes the submit button on the last step)
  // fires the onSubmit handler.
  //
  // Wizard API from useForge: { isWizard: true, totalSteps: N }
  // Wizard API from Forge: renders only childrenArray[currentStep]; wires
  // data-wizard-nav="next" + type="button" to onClick = handleWizardSubmit(onSubmit)
  // on the last step, or handleNext on earlier steps.
  // -------------------------------------------------------------------------
  it("Test 3: wizard last-step submit fires onSubmit when next button clicked on final step", async () => {
    const onSubmit = vi.fn();

    function WizardForm() {
      const { control } = useForge({
        isWizard: true,
        totalSteps: 2,
        defaultValues: { step1: "first", step2: "second" },
      });

      return (
        // In wizard mode Forge renders childrenArray[currentStep].
        // Step 0 (index 0): first child
        // Step 1 (index 1): second child — this is the last step
        <Forge control={control} onSubmit={onSubmit}>
          {/* Step 0 */}
          <div>
            <Forger
              name="step1"
              component={TextInput}
              data-testid="step1-input"
            />
            <button type="button" data-wizard-nav="next" data-testid="next-btn">
              Next
            </button>
          </div>
          {/* Step 1 — last step */}
          <div>
            <Forger
              name="step2"
              component={TextInput}
              data-testid="step2-input"
            />
            {/*
              On the last step, Forge replaces onClick with
              handleWizardSubmit(safeOnSubmit) — pressing this fires onSubmit.
            */}
            <button
              type="button"
              data-wizard-nav="next"
              data-testid="wizard-submit-btn"
            >
              Submit
            </button>
          </div>
        </Forge>
      );
    }

    render(<WizardForm />);

    // We should be on step 0 — click Next to advance to step 1
    const nextBtn = screen.getByTestId("next-btn");
    await userEvent.click(nextBtn);

    // Now on step 1 (last step) — the submit button should trigger onSubmit
    const wizardSubmitBtn = await screen.findByTestId("wizard-submit-btn");
    await userEvent.click(wizardSubmitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ step1: "first", step2: "second" }),
        expect.anything()
      );
    });
  });
});
