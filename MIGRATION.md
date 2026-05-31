# Migration Guide: From react-hook-form to Forge

Forge is a thin, composable wrapper around [react-hook-form](https://react-hook-form.com/) that gives you a cleaner field-registration API and built-in cross-platform support (web + React Native) — all while keeping the full power of RHF under the hood.

If you already use react-hook-form directly, migrating to Forge takes a few minutes. Your existing resolver, validation rules, and `formState` usage stay the same.

---

## Installation

```bash
npm install @adexdsamson/forge
```

Forge requires React and react-hook-form as peer dependencies (they must already be in your project):

```bash
npm install react react-hook-form
```

---

## useForm → useForge

`useForge` is a drop-in replacement for `useForm`. It accepts the same options and returns the full [`UseFormReturn`](https://react-hook-form.com/docs/useform) object, plus an augmented `control` handle (`ForgeControl`).

**Before (raw RHF):**

```tsx
import { useForm } from 'react-hook-form';

type SignupValues = { email: string; role: string; accept: boolean };

const { control, handleSubmit, formState } = useForm<SignupValues>({
  defaultValues: { email: '', role: '', accept: false },
});
```

**After (Forge):**

```tsx
import { useForge } from '@adexdsamson/forge';

type SignupValues = { email: string; role: string; accept: boolean };

const { control, handleSubmit, formState } = useForge<SignupValues>({
  defaultValues: { email: '', role: '', accept: false },
});
```

All RHF methods (`handleSubmit`, `watch`, `setValue`, `getValues`, `reset`, `trigger`, `formState`) are returned unchanged. `control` is the same RHF `Control` instance augmented with Forge-specific metadata.

---

## Rendering Fields: Controller → Forger

Raw RHF requires a `Controller` component with a `render` prop to connect a custom input. Forge replaces this with `<Forge>` + `<Forger>` — no render prop needed.

**Before (raw RHF):**

```tsx
import { useForm, Controller } from 'react-hook-form';

function SignupForm() {
  const { control, handleSubmit } = useForm({ defaultValues: { email: '' } });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        rules={{ required: 'Email is required' }}
        render={({ field, fieldState }) => (
          <TextInput
            {...field}
            error={fieldState.error?.message}
            placeholder="Email"
          />
        )}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**After (Forge):**

```tsx
import { useForge, Forge, Forger } from '@adexdsamson/forge';

function SignupForm() {
  const { control } = useForge({ defaultValues: { email: '' } });

  return (
    <Forge control={control} onSubmit={onSubmit}>
      <Forger
        name="email"
        component={TextInput}
        rules={{ required: 'Email is required' }}
        placeholder="Email"
      />
      <button type="submit">Submit</button>
    </Forge>
  );
}
```

`Forger` wraps `useController` internally and passes `value`, `onChange`, `onBlur`, `error` (the error message string), and any extra props directly to `component`. You never write a render prop.

---

## Form Submit: handleSubmit → Forge onSubmit

**Before (raw RHF):**

```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  {/* fields */}
</form>
```

**After (Forge):**

```tsx
<Forge control={control} onSubmit={onSubmit}>
  {/* fields */}
</Forge>
```

`<Forge>` renders a real `<form>` on web and wires `handleSubmit` automatically. On React Native it renders a `Fragment`. The `onSubmit` prop receives the validated form values directly — no manual `handleSubmit` wrapping needed.

To keep manual control (e.g., for imperative submission), `handleSubmit` is still available on the object returned by `useForge`:

```tsx
const { control, handleSubmit } = useForge({ defaultValues });

// Imperative submit
const submit = handleSubmit((data) => console.log(data));
```

---

## Field Arrays

Replace RHF's `useFieldArray` with Forge's equivalent, which preserves per-item `inputProps` across mutations — useful when each array item carries its own configuration.

**Before (raw RHF):**

```tsx
import { useForm, useFieldArray } from 'react-hook-form';

const { control } = useForm({ defaultValues: { tags: [{ value: '' }] } });
const { fields, append, remove } = useFieldArray({ control, name: 'tags' });
```

**After (Forge):**

```tsx
import { useForge, useFieldArray } from '@adexdsamson/forge';

const { control } = useForge({ defaultValues: { tags: [{ value: '' }] } });
const { fields, append, remove } = useFieldArray({ control, name: 'tags' });
```

The API surface (`fields`, `append`, `remove`, `insert`, `swap`, `update`) is the same. Forge's `useFieldArray` decorates RHF's implementation — it does not replace it.

---

## Value Transforms (optional)

`Forger` accepts a `transform` prop for input/output value coercion. Useful when a component's native value type differs from your form schema type.

```tsx
<Forger
  name="price"
  component={TextInput}
  transform={{
    input: (value) => (value == null ? '' : String(value)),  // form → component
    output: (value) => parseFloat(value as string) || 0,     // component → form
  }}
/>
```

- `transform.input`: called before the value is passed to `component` (coerces form value → display value)
- `transform.output`: called before the value is written to RHF state (coerces event value → stored value)

---

## React Native

The same `useForge` / `<Forge>` / `<Forger>` surface works cross-platform. Forge detects the environment at runtime and routes to the correct event handler:

- `TextInput` → `onChangeText`
- `Switch` / `Picker` / `Slider` → `onValueChange`
- Everything else → standard `onChange`

No hard `react-native` import exists in Forge itself — React Native support is activated purely via runtime detection, so web-only builds are unaffected.

```tsx
import { useForge, Forge, Forger } from '@adexdsamson/forge';
import { TextInput, Switch } from 'react-native';

function NativeSignupForm() {
  const { control } = useForge({
    defaultValues: { email: '', notifications: false },
  });

  return (
    <Forge control={control} onSubmit={onSubmit}>
      <Forger name="email" component={TextInput} keyboardType="email-address" />
      <Forger name="notifications" component={Switch} />
    </Forge>
  );
}
```

---

## What Does NOT Change

When migrating from raw react-hook-form to Forge, the following stay exactly the same:

| Feature | How it works in Forge |
|---|---|
| **Resolver (Zod, Yup, etc.)** | Pass `resolver` to `useForge` — forwarded directly to `useForm` |
| **`formState`** | Same RHF `formState` object (`isDirty`, `isValid`, `errors`, etc.) |
| **`watch`** | Available on the object returned by `useForge` |
| **`setValue` / `getValues`** | Available on the `useForge` return and on `control` |
| **`reset`** | Available on the `useForge` return |
| **`trigger`** | Available on the `useForge` return |
| **Validation rules** | `rules` prop on `<Forger>` accepts the same `RegisterOptions` as `Controller` |

**Example with Zod resolver (unchanged from raw RHF):**

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForge, Forge, Forger } from '@adexdsamson/forge';

const schema = z.object({
  email: z.string().email(),
  role: z.string().min(1),
});

function SchemaForm() {
  const { control } = useForge({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: '' },
  });

  return (
    <Forge control={control} onSubmit={onSubmit}>
      <Forger name="email" component={TextInput} />
      <Forger name="role" component={Select} />
      <button type="submit">Submit</button>
    </Forge>
  );
}
```

---

## API Reference

Full prop and return-type documentation: [docs/API.md](./docs/API.md)

For a complete React Native example: [examples/ReactNativeExample.md](./examples/ReactNativeExample.md)
