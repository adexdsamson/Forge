# Forge

Forge is a cross-platform React form library that wraps [react-hook-form](https://react-hook-form.com/) with a streamlined, composable API. Call `useForge(...)` to get the full react-hook-form toolkit plus an augmented `control`, render a `<Forge control={...}>` form container, and drop in `<Forger>` field wrappers around any custom input — web or React Native. Forge auto-detects the platform and wires the right event handlers, so the same component tree works on both.

[![npm version](https://img.shields.io/npm/v/@adexdsamson/forge.svg)](https://www.npmjs.com/package/@adexdsamson/forge)
[![CI](https://img.shields.io/github/actions/workflow/status/adexdsamson/Forge/ci.yml.svg)](https://github.com/adexdsamson/Forge/actions)
[![License](https://img.shields.io/npm/l/@adexdsamson/forge.svg)](./LICENSE)

---

## Installation

```bash
npm install @adexdsamson/forge
```

Install required peer dependencies:

```bash
npm install react react-hook-form
```

Optional peer dependency (for file input `accept` types):

```bash
npm install react-dropzone
```

---

## Quickstart (Web)

A signup form with a text field, a role select, and a terms checkbox:

```tsx
import React from 'react';
import { useForge, Forge, Forger } from '@adexdsamson/forge';

// --- Custom input components ---

interface TextInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
}

const TextInput = ({ value, onChange, onBlur, error, placeholder }: TextInputProps) => (
  <div>
    <input
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      style={{ borderColor: error ? 'red' : undefined }}
    />
    {error && <span style={{ color: 'red', fontSize: 12 }}>{error}</span>}
  </div>
);

interface SelectProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: () => void;
  error?: string;
}

const RoleSelect = ({ value, onChange, onBlur, error }: SelectProps) => (
  <div>
    <select value={value ?? ''} onChange={onChange} onBlur={onBlur}>
      <option value="">Select a role</option>
      <option value="user">User</option>
      <option value="admin">Admin</option>
      <option value="editor">Editor</option>
    </select>
    {error && <span style={{ color: 'red', fontSize: 12 }}>{error}</span>}
  </div>
);

interface CheckboxProps {
  value?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
}

const CheckboxInput = ({ value, onChange, onBlur, error, label }: CheckboxProps) => (
  <div>
    <label>
      <input type="checkbox" checked={!!value} onChange={onChange} onBlur={onBlur} />
      {label}
    </label>
    {error && <span style={{ color: 'red', fontSize: 12 }}>{error}</span>}
  </div>
);

// --- Form ---

interface SignupFormData {
  name: string;
  role: string;
  acceptTerms: boolean;
}

export function SignupForm() {
  const { control } = useForge<SignupFormData>({
    defaultValues: {
      name: '',
      role: '',
      acceptTerms: false,
    },
    mode: 'onBlur',
  });

  const onSubmit = (data: SignupFormData) => {
    console.log('Submitted:', data);
  };

  return (
    <Forge control={control} onSubmit={onSubmit} noValidate>
      <Forger
        name="name"
        component={TextInput}
        placeholder="Your name"
        rules={{ required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } }}
      />

      <Forger
        name="role"
        component={RoleSelect}
        rules={{ required: 'Please select a role' }}
      />

      <Forger
        name="acceptTerms"
        component={CheckboxInput}
        label="I accept the terms and conditions"
        rules={{ required: 'You must accept the terms' }}
      />

      <button type="submit">Sign up</button>
    </Forge>
  );
}
```

**What happens:**

1. `useForge` calls `useForm` internally and returns the full react-hook-form API plus an augmented `control`.
2. `<Forge control={control}>` renders a `<form>`, provides `FormProvider` context, and wires the submit handler.
3. Each `<Forger>` connects one field to RHF state via `useController`, injects `value`, `onChange`, `onBlur`, and `error` into the custom component, and applies the `rules`.
4. On submit, RHF validates all fields, then calls `onSubmit` with the typed form data.

---

## React Native

The same API works on React Native. Pass `platform="react-native"` to `<Forge>` (or let it auto-detect). Forge maps `onChange` to `onChangeText` for `TextInput` and `onValueChange` for `Switch`/`Picker`/`Slider` automatically.

```tsx
import React from 'react';
import { View, TextInput, Switch, Text, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useForge, Forge, Forger } from '@adexdsamson/forge';

// --- Custom RN components ---

const RNTextInput = ({ value, onChangeText, onBlur, error, placeholder }: any) => (
  <View>
    <TextInput
      value={value ?? ''}
      onChangeText={onChangeText}
      onBlur={onBlur}
      placeholder={placeholder}
      style={{ borderWidth: 1, borderColor: error ? 'red' : '#ccc', padding: 8, borderRadius: 4 }}
    />
    {error ? <Text style={{ color: 'red', fontSize: 12 }}>{error}</Text> : null}
  </View>
);

const RolePickerInput = ({ value, onValueChange, error }: any) => (
  <View style={{ borderWidth: 1, borderColor: error ? 'red' : '#ccc', borderRadius: 4 }}>
    <Picker selectedValue={value} onValueChange={onValueChange}>
      <Picker.Item label="Select a role" value="" />
      <Picker.Item label="User" value="user" />
      <Picker.Item label="Admin" value="admin" />
      <Picker.Item label="Editor" value="editor" />
    </Picker>
    {error ? <Text style={{ color: 'red', fontSize: 12 }}>{error}</Text> : null}
  </View>
);

const TermsSwitch = ({ value, onValueChange, label }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <Switch value={!!value} onValueChange={onValueChange} />
    <Text>{label}</Text>
  </View>
);

// --- Form ---

interface SignupFormData {
  name: string;
  role: string;
  acceptTerms: boolean;
}

export function SignupFormRN() {
  const { control } = useForge<SignupFormData>({
    defaultValues: { name: '', role: '', acceptTerms: false },
    mode: 'onBlur',
  });

  const onSubmit = (data: SignupFormData) => {
    console.log('Submitted:', data);
  };

  return (
    <Forge control={control} onSubmit={onSubmit} platform="react-native">
      <RNTextInput
        // Direct RN input usage — Forge injects registration props automatically
        // when isNative/platform is set and the input is inside <Forge>.
      />

      <Forger
        name="name"
        component={RNTextInput}
        placeholder="Your name"
        rules={{ required: 'Name is required' }}
      />

      <Forger
        name="role"
        component={RolePickerInput}
        rules={{ required: 'Please select a role' }}
      />

      <Forger
        name="acceptTerms"
        component={TermsSwitch}
        label="I accept the terms and conditions"
      />

      <TouchableOpacity onPress={() => {/* submit is wired by Forge on type="submit" buttons */}}>
        <Text>Sign up</Text>
      </TouchableOpacity>
    </Forge>
  );
}
```

> **Cross-platform note:** Forge uses runtime detection (`navigator.product === 'ReactNative'`) to select the right event handler names. You do not need a separate component tree for web vs. React Native — the same `<Forge>` + `<Forger>` pattern works on both platforms.

---

## Key Concepts

- **`useForge`** — Configures the form instance. Wraps `useForm` from react-hook-form and returns the full RHF toolkit plus an augmented `control` handle that carries wizard state and declarative field definitions.

- **`<Forge control={...}>`** — Renders the form container. On web it outputs a `<form>` element; on React Native it outputs a Fragment. Provides `FormProvider` context so all child `<Forger>` fields can subscribe to form state without prop-drilling.

- **`<Forger name="..." component={...}>`** — Connects one field to RHF state via `useController`. Injects `value`, `onChange`/`onChangeText`, `onBlur`, and `error` into your custom component. Applies `rules` validation and optional value `transform` (coerce between stored type and display type).

---

## API Reference

Full prop and return-value tables for every exported symbol:

[docs/API.md](docs/API.md)

---

## Examples

A complete runnable React Native example with multiple field types, validation, and submission handling:

[examples/ReactNativeExample.md](examples/ReactNativeExample.md)

---

## License

MIT © adexdsamson
