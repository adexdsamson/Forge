// IMPORTANT: vi.mock must be the very first statement in this file.
// Vitest hoists vi.mock() calls above all static imports at transform time,
// so the factory runs before Forge.tsx (the SUT) is imported and evaluates
// its module-level isReactNative constant from ../utils. Without hoisting,
// isReactNative would be false (jsdom sets typeof window, so isWeb=true).
//
// NOTE: isSwitch, isPicker, isSlider, isTextInput in utils.ts all reference the
// module-level isReactNative constant via closure. Spreading the original module
// preserves the closed-over isReactNative=false in those functions. We must
// explicitly override them to use the mocked isReactNative=true value.
vi.mock('../utils', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils')>();
  return {
    ...original, // preserve Slot, deepEqual, cloneObject, etc.
    isReactNative: true,
    isWeb: false,
    isMobile: true,
    // Override component-type checkers to use isReactNative=true (they close over the const)
    isTextInput: (element: any): boolean =>
      element != null && (element.displayName === 'TextInput' || element.type === 'TextInput'),
    isSwitch: (element: any): boolean =>
      element != null && (element.displayName === 'Switch' || element.type === 'Switch'),
    isPicker: (element: any): boolean =>
      element != null && (element.displayName === 'Picker' || element.type === 'Picker'),
    isSlider: (element: any): boolean =>
      element != null && (element.displayName === 'Slider' || element.type === 'Slider'),
  };
});

/// <reference types="vitest/globals" />
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { Forge } from './Forge';
import { Forger } from '../Forger/Forger';
import { useForge } from '../useForge/useForge';

// ---------------------------------------------------------------------------
// CapturingRNTextInput: captures injected props so tests can assert on them.
// displayName="TextInput" triggers isTextInput in Forger.tsx, causing Forger
// to inject onChangeText in RN mode.
// ---------------------------------------------------------------------------
let _capturedTextInputProps: any = {};

const CapturingRNTextInput = React.forwardRef<any, any>((props, ref) => {
  _capturedTextInputProps = props;
  return <span ref={ref} />;
});
CapturingRNTextInput.displayName = 'TextInput';

// ---------------------------------------------------------------------------
// CapturingSubmitButton: captures injected props (including onPress) so tests
// can assert forgeSubmit is stripped and onPress is injected by Forge.
// No displayName override needed — it is a submit button marker, not an input.
// ---------------------------------------------------------------------------
let capturedSubmitProps: any = {};

const CapturingSubmitButton = React.forwardRef<any, any>((props, _ref) => {
  capturedSubmitProps = props;
  return <span />;
});
CapturingSubmitButton.displayName = 'CapturingSubmitButton';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Forge — RN submit button auto-wiring (isReactNative=true via vi.mock)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _capturedTextInputProps = {};
    capturedSubmitProps = {};
  });

  it('Test 1: forgeSubmit={true} button receives onPress wired to handleSubmit; forgeSubmit prop is stripped', async () => {
    const onSubmit = vi.fn();

    function TestForm() {
      const { control } = useForge({ defaultValues: { name: 'alice' } });
      return (
        <Forge control={control} onSubmit={onSubmit} platform="react-native">
          <Forger name="name" component={CapturingRNTextInput} />
          <CapturingSubmitButton forgeSubmit={true} />
        </Forge>
      );
    }

    render(<TestForm />);

    // Forge should have injected onPress onto the submit button
    expect(capturedSubmitProps.onPress).toEqual(expect.any(Function));

    // forgeSubmit should have been stripped — must not reach the host component
    expect(capturedSubmitProps.forgeSubmit).toBeUndefined();

    // Invoke the injected onPress — it should call onSubmit with form values
    await act(async () => {
      await capturedSubmitProps.onPress();
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      // Second arg is the DOM event (undefined when onPress is called without a synthetic event)
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'alice' }), undefined);
    });
  });

  it('Test 2 (regression): type="submit" marker still receives onPress in RN mode', async () => {
    const onSubmit = vi.fn();

    function TestForm() {
      const { control } = useForge({ defaultValues: { email: 'bob@example.com' } });
      return (
        <Forge control={control} onSubmit={onSubmit} platform="react-native">
          <Forger name="email" component={CapturingRNTextInput} />
          <CapturingSubmitButton type="submit" />
        </Forge>
      );
    }

    render(<TestForm />);

    // Even with the classic type="submit" marker, RN mode should inject onPress
    expect(capturedSubmitProps.onPress).toEqual(expect.any(Function));

    // Invoke onPress — should fire onSubmit with form values
    await act(async () => {
      await capturedSubmitProps.onPress();
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      // Second arg is the DOM event (undefined when onPress is called without a synthetic event)
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'bob@example.com' }),
        undefined
      );
    });
  });
});
