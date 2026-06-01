/// <reference types="vitest/globals" />
import React from 'react';

// ---------------------------------------------------------------------------
// Shared TextInput forwardRef helper for web-mode test files.
// Forger passes value / onChange / onBlur / error / ref — we forward them all.
// Import as: import { TextInput } from "../test-utils"
// ---------------------------------------------------------------------------
export const TextInput = React.forwardRef<
  HTMLInputElement,
  {
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    name?: string;
    'data-testid'?: string;
  }
>((props, ref) => {
  const { value = '', onChange, onBlur, name, ...rest } = props;
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
TextInput.displayName = 'TextInput';
