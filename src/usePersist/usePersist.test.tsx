/// <reference types="vitest/globals" />
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Forge } from '../Forge/Forge';
import { Forger } from '../Forger/Forger';
import { useForge } from '../useForge/useForge';
import { usePersist } from './usePersist';
import { TextInput } from '../test-utils';

// ---------------------------------------------------------------------------
// usePersist — subscription / handler-fires tests.
//
// Pattern D (PATTERNS.md / RESEARCH.md Pitfall 4):
//   1. usePersist fires on mount (initial useWatch emission).
//   2. After mount emission, mockClear so the subsequent assertion targets the
//      user-interaction emission only.
//   3. Interact via userEvent.
//   4. waitFor expects handler called with correct values + state.
// ---------------------------------------------------------------------------

describe('usePersist — handler fires on value change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handler fires with updated values and isDirty: true after userEvent.type', async () => {
    const handler = vi.fn();

    function TestForm() {
      const { control } = useForge({ defaultValues: { name: '' } });
      usePersist({ control: control as any, handler });
      return (
        <Forge control={control} onSubmit={vi.fn()}>
          <Forger name="name" component={TextInput} data-testid="name-input" />
        </Forge>
      );
    }

    render(<TestForm />);

    // Step 1: Wait for initial mount emission (useWatch fires on mount — usePersist.tsx:35).
    await waitFor(() => expect(handler).toHaveBeenCalled());

    // Step 2: Clear so subsequent assertion captures the post-interaction emission only.
    handler.mockClear();

    // Step 3: Type into the field to trigger a value change.
    await userEvent.type(screen.getByTestId('name-input'), 'alice');

    // Step 4: Assert handler was called with values + isDirty: true (D-12 signature).
    await waitFor(() => {
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ name: expect.stringContaining('a') }),
        expect.objectContaining({ isDirty: true })
      );
    });
  });
});
