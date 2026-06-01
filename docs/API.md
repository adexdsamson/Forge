# Forge API Reference

> Part of [`@adexdsamson/forge`](https://www.npmjs.com/package/@adexdsamson/forge) — a cross-platform React form library wrapping react-hook-form.
>
> **Back to:** [README](../README.md)

Install: `npm install @adexdsamson/forge react react-hook-form`

---

## Table of Contents

1. [useForge](#useforge)
2. [Forge](#forge)
3. [Forger](#forger)
4. [useFieldArray](#usefieldarray)
5. [useForgeValues](#useforgevalues)
6. [usePersist](#usepersist)
7. [validateField](#validatefield)
8. [Platform Detection Utilities](#platform-detection-utilities)
9. [TypeScript Types](#typescript-types)

---

## useForge

Initializes a form instance. Wraps RHF's `useForm` and returns the full `UseFormReturn` toolkit plus an augmented `ForgeControl` handle for Forge-specific features (wizard mode, declarative fields).

### Import

```ts
import { useForge } from '@adexdsamson/forge';
```

### Props (UseForgeProps)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `defaultValues` | `DefaultValues<TFieldValues>` \| `(payload?) => Promise<TFieldValues>` | No | `undefined` | Initial field values. Passed directly to RHF `useForm`. Supports async factory. |
| `resolver` | `Resolver<TFieldValues>` | No | `undefined` | Schema-based validation resolver (Zod, Yup, Joi, etc.). Passed to RHF `useForm`. |
| `fields` | `FieldProps<TFieldProps>[]` | No | `undefined` | Declarative field definitions rendered automatically by `<Forge>` when provided. Sets `control.hasFields = true`. |
| `mode` | `'onBlur' \| 'onChange' \| 'onSubmit' \| 'onTouched' \| 'all'` | No | `'onSubmit'` | Validation trigger mode. Passed to RHF `useForm`. |
| `isWizard` | `boolean` | No | `false` | Enable wizard/multi-step mode. |
| `initialStep` | `number` | No | `0` | Starting step index when `isWizard` is true. |
| `totalSteps` | `number` | No | `0` | Total number of wizard steps. Required when `isWizard` is true. |

### Returns (UseForgeResult)

`UseForgeResult<TFieldValues>` is `Omit<UseFormReturn<TFieldValues>, 'control'>` extended with an augmented `control`.

**Inherited from RHF `UseFormReturn`** (available directly on the result):

| Member | Type | Description |
|--------|------|-------------|
| `register` | `(name, options?) => RegisterReturn` | Registers an uncontrolled input. |
| `handleSubmit` | `(onValid, onInvalid?) => FormEventHandler` | Wraps the submit callback with RHF validation. |
| `formState` | `FormState<TFieldValues>` | Reactive form state (errors, isDirty, isValid, etc.). |
| `watch` | `(name?) => TFieldValues` | Subscribes to field value changes. |
| `setValue` | `UseFormSetValue<TFieldValues>` | Programmatically sets a field value. |
| `getValues` | `UseFormGetValues<TFieldValues>` | Reads current field values. |
| `reset` | `(values?) => void` | Resets form to default or provided values. |
| `trigger` | `(name?) => Promise<boolean>` | Manually triggers validation. |
| `setError` | `(name, error) => void` | Manually sets a field error. |
| `clearErrors` | `(name?) => void` | Clears field errors. |
| `getFieldState` | `(name) => FieldState` | Returns validation state for a single field. |
| ...others | — | Full RHF `UseFormReturn` surface minus `control`. |

**Forge-specific additions on `control` (ForgeControl)**:

| Member | Type | Description |
|--------|------|-------------|
| `control.hasFields` | `boolean` | `true` when declarative `fields` were passed to `useForge`. |
| `control.fields` | `FieldProps<TFieldProps>[]` \| `undefined` | The declarative fields array, forwarded from `useForge` options. |
| `control.isWizard` | `boolean` \| `undefined` | Whether wizard mode is active. |
| `control.currentStep` | `number` \| `undefined` | Current wizard step index (0-based). |
| `control.totalSteps` | `number` \| `undefined` | Total wizard step count. |
| `control.isFirstStep` | `boolean` \| `undefined` | `true` when `currentStep === 0`. |
| `control.isLastStep` | `boolean` \| `undefined` | `true` when `currentStep === totalSteps - 1`. |
| `control.handleNext` | `() => void` \| `undefined` | Advances wizard to the next step. |
| `control.handlePrevious` | `() => void` \| `undefined` | Returns wizard to the previous step. |
| `control.handleWizardSubmit` | `(onSubmit?) => () => void` \| `undefined` | RHF-validated submit handler for the last wizard step. |

### Example

```tsx
import { useForge, Forge, Forger } from '@adexdsamson/forge';

interface SignupForm {
  name: string;
  role: string;
  acceptTerms: boolean;
}

function MyForm() {
  const { control, handleSubmit } = useForge<SignupForm>({
    defaultValues: { name: '', role: 'user', acceptTerms: false },
    mode: 'onBlur',
  });

  const onSubmit = (data: SignupForm) => console.log(data);

  return (
    <Forge control={control} onSubmit={onSubmit}>
      <Forger name="name" component={TextInput} rules={{ required: 'Name is required' }} />
      <Forger name="role" component={RoleSelect} />
      <Forger name="acceptTerms" component={CheckboxInput} />
      <button type="submit">Sign up</button>
    </Forge>
  );
}
```

---

## Forge

The form container component. Wraps children in a `FormProvider`, renders a `<form>` on web (or a React fragment on React Native), wires the submit handler, and recursively injects `control` + wizard navigation props into child tree.

### Import

```ts
import { Forge } from '@adexdsamson/forge';
```

### Props (ForgeProps)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `control` | `ForgeControl<TFieldValues, TFieldProps>` | **Yes** | — | The augmented control handle returned by `useForge`. |
| `onSubmit` | `(data: TFieldValues) => void` | No | `undefined` | Called with validated form data when the form is submitted. |
| `className` | `string` | No | `undefined` | CSS class applied to the `<form>` element (web only). |
| `noValidate` | `boolean` | No | `false` | Disables native browser validation on the `<form>` element (web only). |
| `children` | `ReactNode` | No | `undefined` | Form content. `<Forger>` fields, buttons, layout elements. |
| `ref` | `RefObject<FormPropsRef \| null>` | No | `undefined` | Imperative handle for programmatic submit (`ref.current.onSubmit()`). |
| `debug` | `boolean` | No | `undefined` | Mounts `@hookform/devtools` overlay (web dev mode). Requires `npm i -D @hookform/devtools`. |
| `platform` | `'web' \| 'react-native' \| 'auto'` | No | `'auto'` | Force a platform rendering mode. `'auto'` uses runtime detection. |
| `isWizard` | `boolean` | No | `undefined` | Enable wizard rendering (renders only the current wizard step's child). Set via `useForge({ isWizard })` — passing it here is accepted but the wizard state lives on `control`. |
| `isNative` | `boolean` | No | `undefined` | Deprecated alias for `platform="react-native"`. Prefer `platform`. |

### Behavior

- **Web mode:** Renders a `<form>` element. `onSubmit` fires via RHF's `handleSubmit` (calls `event.preventDefault()` internally).
- **React Native mode:** Renders a React Fragment. Submit buttons must use `type="submit"` or `forgeSubmit` prop so `<Forge>` can detect and wire `onPress`. No manual `handleSubmit` call needed.
- **`forgeSubmit` (on child button):** Add `forgeSubmit` (or `forgeSubmit={true}`) to any button inside `<Forge>` in React Native mode. Forge injects `onPress` pointing to `handleSubmit(onSubmit)` automatically and strips the `forgeSubmit` prop before it reaches the host component. Backward compatible: `type="submit"` continues to work.
- **Wizard mode:** Renders only `children[currentStep]`. Buttons with `data-wizard-nav="next"` or `data-wizard-nav="previous"` get navigation handlers injected automatically.
- **Declarative fields:** When `control.hasFields` is `true`, renders `<Forger>` elements from `control.fields` before `children`.

---

## Forger

Thin field adapter. Reads form context (or the `control` prop), wraps a `MemorizeController` in a `Slot`, and connects a single field to RHF state via `useController`. Platform-appropriate event handlers and value transforms are applied automatically.

### Import

```ts
import { Forger } from '@adexdsamson/forge';
```

### Props (ForgerProps)

`ForgerProps<TFieldValues>` extends `Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'name'>` plus:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `Path<TFieldValues>` | **Yes** | — | Field name. Must match a key in the form's `TFieldValues`. |
| `component` | `React.ElementType` | **Yes** | — | The custom input component to render. Receives `value`, `onChange`/`onChangeText`, `onBlur`, `error`, and all spread props. |
| `rules` | `Omit<RegisterOptions, 'valueAsNumber' \| 'valueAsDate' \| 'setValueAs' \| 'disabled'>` | No | `undefined` | RHF validation rules (`required`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `validate`). |
| `transform` | `{ input?: (value: unknown) => unknown; output?: (val: unknown) => unknown }` | No | `undefined` | Value coercion pair. See [Transform](#transform). |
| `handler` | `string` | No | `undefined` | Override the event handler prop name on the component (e.g., `'onChangeText'`). Useful for custom RN components. |
| `dependencies` | `any[]` | No | `[]` | Extra values the memoized controller depends on. Triggers re-render when any dependency changes. |
| `control` | `ForgeControl<TFieldValues>` | No | — | Explicit control prop. Required only when `<Forger>` is rendered outside a `<Forge>` (i.e., outside `FormProvider`). |
| `label` | `string \| React.ReactElement` | No | `undefined` | Optional label forwarded to the component. |
| `accept` | `Accept` | No | `undefined` | react-dropzone accepted file types (file inputs). |
| `multiple` | `boolean` | No | `undefined` | Whether to allow multiple file selection. |
| `...rest` | `Record<string, unknown>` | No | — | All other props are spread onto the rendered `component`. |

**Props injected into `component` by ForgerController:**

| Injected Prop | Type | Description |
|---------------|------|-------------|
| `value` | `unknown` | Current field value (after `transform.input` if set). |
| `onChange` / `onChangeText` / `onValueChange` | `function` | Platform-appropriate change handler (after `transform.output` if set). |
| `onBlur` | `function` | RHF blur handler. |
| `error` | `string \| undefined` | Field error message from RHF state. |
| `name` | `Path<TFieldValues>` | Field name. |
| `ref` | `Ref` | RHF field ref. |
| `control` | `ForgeControl<TFieldValues>` | Form control handle. |

### Transform

The `transform` prop lets you coerce values between what the component emits and what RHF stores.

```ts
transform?: {
  input?: (value: unknown) => unknown;   // RHF stored value → component display value
  output?: (val: unknown) => unknown;    // Component emitted value → RHF stored value
}
```

**Example** — numeric string from a text input stored as a number:

```tsx
<Forger
  name="age"
  component={TextInput}
  transform={{
    input: (v) => String(v ?? ''),
    output: (v) => parseInt(String(v), 10) || 0,
  }}
/>
```

### Platform Event Wiring

`Forger` selects the event handler prop automatically:

| Condition | Handler prop on `component` |
|-----------|----------------------------|
| `handler` prop provided | The custom `handler` name |
| React Native + `TextInput` | `onChangeText` |
| React Native + `Switch` / `Picker` / `Slider` | `onValueChange` |
| Web / all other cases | `onChange` |

---

## useFieldArray

Manages dynamic field arrays (add/remove/reorder rows). Wraps RHF's public `useFieldArray` and layers Forge's per-item `inputProps` preservation on top.

### Import

```ts
import { useFieldArray } from '@adexdsamson/forge';
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `FieldArrayPath<TFieldValues>` | **Yes** | Name of the array field in the form schema. |
| `inputProps` | `InputProps` | **Yes** | Per-item props object spread onto each field entry returned in `fields`. |
| `control` | `ForgeControl<TFieldValues>` | No | Explicit control (falls back to `useFormContext`). |
| `keyName` | `string` | No | Key name for the generated id (default: `'id'`). |
| `rules` | `RegisterOptions` | No | Validation rules for the array itself (min/max length, required). |
| `shouldUnregister` | `boolean` | No | Unregister fields when the array unmounts. |

### Returns

| Return | Type | Description |
|--------|------|-------------|
| `fields` | `(RHFFieldArrayReturn & { inputProps: InputProps })[]` | Array of field entries. Each entry has the RHF-generated `id` plus your `inputProps`. |
| `append` | `(value, options?) => void` | Appends one or more items to the array. |
| `prepend` | `(value, options?) => void` | Prepends one or more items. |
| `insert` | `(index, value, options?) => void` | Inserts at a specific index. |
| `update` | `(index, value) => void` | Updates the item at a specific index. |
| `remove` | `(index?) => void` | Removes one or all items. |
| `swap` | `(indexA, indexB) => void` | Swaps two items. |
| `move` | `(from, to) => void` | Moves an item to a new index. |
| `replace` | `(value) => void` | Replaces the entire array. |

### Example

```tsx
import { useFieldArray, Forge, Forger } from '@adexdsamson/forge';

function PhoneList({ control }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phones',
    inputProps: { placeholder: 'Enter phone number' },
  });

  return (
    <>
      {fields.map((field, index) => (
        <div key={field.id}>
          <Forger
            name={`phones.${index}.value`}
            component={TextInput}
            {...field.inputProps}
          />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ value: '' })}>Add phone</button>
    </>
  );
}
```

---

## useForgeValues

Thin wrapper over RHF's public `setValue`/`getValues` APIs. Provides typed `getValue(name)` with a descriptive error when the field is not registered, and exposes `getValues()` for reading multiple fields at once.

Must be used inside a `<Forge>` (i.e., inside a `FormProvider` context).

### Import

```ts
import { useForgeValues } from '@adexdsamson/forge';
```

### Parameters (UseForgeValuesProps)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `control` | `ForgeControl<TFieldValues>` | **Yes** | The control handle from `useForge`. |

### Returns (UseForgeValuesReturn)

| Return | Type | Description |
|--------|------|-------------|
| `getValue` | `<TFieldName extends Path<TFieldValues>>(name: TFieldName) => PathValue<TFieldValues, TFieldName>` | Returns the current value of a single registered field. Throws `Error` if the field is not in the form. |
| `setValue` | `UseFormSetValue<TFieldValues>` | RHF's `setValue` — sets a field value programmatically. Supports options `{ shouldDirty, shouldTouch, shouldValidate }`. |
| `getValues` | `UseFormGetValues<TFieldValues>` | RHF's `getValues` — returns all field values or a subset by name array. |

### Example

```tsx
import { useForgeValues } from '@adexdsamson/forge';

function MyFormControls({ control }) {
  const { getValue, setValue, getValues } = useForgeValues({ control });

  const handleReset = () => {
    setValue('email', '', { shouldDirty: true });
  };

  return <button type="button" onClick={handleReset}>Clear email</button>;
}
```

---

## usePersist

Subscribes to form value and state changes. Calls a handler on every change tick — useful for autosave or draft persistence.

Uses RHF's public `useWatch` + `useFormState` internally (zero private API access).

### Import

```ts
import { usePersist } from '@adexdsamson/forge';
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `control` | `Control<TFieldValues>` | **Yes** | The RHF control handle (compatible with the `control` from `useForge`). |
| `handler` | `(values: TFieldValues, state: { isDirty: boolean; isValid: boolean }) => void` | **Yes** | Called on every form value or state change. Receives the full values snapshot and scoped state flags. |

**Handler signature:**

```ts
handler: (
  values: TFieldValues,
  state: { isDirty: boolean; isValid: boolean }
) => void
```

> **Note (D-12 break):** In pre-v1 versions, `usePersist` fired a lower-level firehose of RHF internal state changes. The current v1 handler signature is the simplified `(values, { isDirty, isValid })` shape. If upgrading from a pre-release version, update your handler to match this signature.

### Returns

`void` — `usePersist` is a side-effect hook with no return value.

### Example

```tsx
import { usePersist } from '@adexdsamson/forge';

function AutoSave({ control }) {
  usePersist({
    control,
    handler: (values, { isDirty }) => {
      if (isDirty) {
        localStorage.setItem('draft', JSON.stringify(values));
      }
    },
  });
  return null;
}
```

---

## validateField

Async field validator. Runs the full RHF validation rule set against a single field. Platform-aware: on web, calls `inputRef.setCustomValidity` + `reportValidity`; on React Native, calls `inputRef.setNativeProps({ error })`.

> This is an internal-use function exposed for advanced consumers. Most use cases should rely on `rules` props on `<Forger>` or a schema resolver on `useForge`.

### Import

```ts
import { validateField } from '@adexdsamson/forge';
```

> **Note:** `validateField` is a named export of `@adexdsamson/forge` (re-exported from the module's `validateField` default).

### Signature

```ts
validateField(
  field: Field,
  formValues: TFieldValues,
  validateAllFieldCriteria: boolean,
  shouldUseNativeValidation?: boolean,
  isFieldArray?: boolean,
  disabledFieldNames?: InternalNameSet,
): Promise<InternalFieldErrors>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `field` | `Field` (RHF internal) | **Yes** | The RHF field descriptor containing `_f` metadata (ref, name, rules). |
| `formValues` | `TFieldValues` | **Yes** | Current snapshot of all form values. |
| `validateAllFieldCriteria` | `boolean` | **Yes** | When `true`, collects all validation errors instead of stopping at the first. |
| `shouldUseNativeValidation` | `boolean` | No | Whether to call `setCustomValidity` / `setNativeProps` for native browser/RN validation feedback. |
| `isFieldArray` | `boolean` | No | `true` when validating a field array (changes the `required` check to array-length). |
| `disabledFieldNames` | `InternalNameSet` | No | Set of field names that are disabled — skips validation for them. |

### Returns

`Promise<InternalFieldErrors>` — an object mapping field names to `FieldError` objects. Empty object `{}` means validation passed.

### Supported Validation Rules

| Rule | Type | Description |
|------|------|-------------|
| `required` | `boolean \| string \| ValidationRule<boolean>` | Field must have a non-empty value. |
| `min` | `number \| string \| ValidationRule<number \| string>` | Minimum numeric value or date. |
| `max` | `number \| string \| ValidationRule<number \| string>` | Maximum numeric value or date. |
| `minLength` | `number \| ValidationRule<number>` | Minimum string length. |
| `maxLength` | `number \| ValidationRule<number>` | Maximum string length. |
| `pattern` | `RegExp \| ValidationRule<RegExp>` | Must match the regular expression. |
| `validate` | `Validate \| Record<string, Validate>` | Custom sync or async validator function(s). Receives `(value, formValues)`. |

---

## Platform Detection Utilities

### Platform Booleans (from `src/utils.ts`)

Read-only module-level constants evaluated once at import time. Use for conditional rendering of platform-specific UI.

| Export | Type | Description |
|--------|------|-------------|
| `isWeb` | `boolean` | `true` when running in a browser environment (`typeof window !== 'undefined'`). |
| `isReactNative` | `boolean` | `true` when running in React Native (`typeof navigator !== 'undefined' && navigator.product === 'ReactNative'`). |
| `isMobile` | `boolean` | `true` on mobile environments (combines RN detection with UA sniffing). |
| `isTextInput` | `(component: unknown) => boolean` | Returns `true` when the component is a React Native `TextInput`. |
| `isCheckBoxInput` | `(ref: unknown) => boolean` | Returns `true` when the ref/component is a checkbox input. |
| `isRadioInput` | `(ref: unknown) => boolean` | Returns `true` when the ref/component is a radio input. |
| `isPicker` | `(component: unknown) => boolean` | Returns `true` when the component is a React Native `Picker`. |
| `isSwitch` | `(component: unknown) => boolean` | Returns `true` when the component is a React Native `Switch`. |
| `isSlider` | `(component: unknown) => boolean` | Returns `true` when the component is a React Native `Slider`. |

### React Native Helpers (from `src/reactNative.ts`)

| Export | Type | Description |
|--------|------|-------------|
| `REACT_NATIVE_COMPONENTS` | `const` | Object mapping known RN component names: `{ TextInput, Switch, Picker, Slider, CheckBox, RadioButton }`. |
| `REACT_NATIVE_VALIDATION_RULES` | `const` | Object of platform-specific validation helper functions for RN components (`textInput.maxLength`, `numeric.min`, `required`, etc.). |
| `getEventHandlerName` | `(componentType: string) => string` | Returns the correct event prop name for an RN component type (`'onChangeText'`, `'onValueChange'`, `'onChange'`). |
| `getValuePropertyName` | `(componentType: string) => string` | Returns the correct value prop name for an RN component type (`'value'`, `'selectedValue'`). |
| `getComponentType` | `(component: unknown) => string` | Resolves a component to a string type name (checks `displayName`, `type`, and `tagName`). |
| `mergePlatformProps` | `(baseProps: object, platformProps?: { web?: object; reactNative?: object }) => object` | Merges base props with platform-specific overrides depending on runtime platform. |
| `getPlatform` | `() => 'web' \| 'react-native' \| 'unknown'` | Returns the current runtime platform string. |
| `isValidReactNativeComponent` | `(component: unknown) => boolean` | Returns `true` when the component is a known React Native form component. |
| `setReactNativeError` | `(ref: unknown, error?: string) => void` | Sets a native error state on an RN component ref via `setNativeProps`. No-op on web. |
| `handleReactNativeFile` | `(file: unknown) => unknown` | Normalizes a React Native image/document picker result into a Forge-compatible file object. No-op on web. |

---

## TypeScript Types

All types are re-exported from `@adexdsamson/forge`. Source: `src/types.ts`.

| Type | Description |
|------|-------------|
| `ForgeControl<TFieldValues, TFieldProps>` | RHF `Control<TFieldValues>` augmented with `hasFields`, `fields[]`, and wizard state/navigation members. |
| `ForgeProps<TFieldValues, TFieldProps>` | Props for the `<Forge>` component. |
| `ForgerProps<TFieldValues>` | Props for the `<Forger>` component (extends `InputHTMLAttributes`). |
| `ForgerControllerProps<TFieldValues>` | Internal props for `ForgerController` (includes `methods: UseFormReturn`). |
| `ForgerSlotProps` | Props injected into the `Slot` wrapper around a rendered field. |
| `TForgerProps` | Minimal Forger prop shape `{ name, component, label? }`. |
| `FieldProps<TFieldProps, TFieldValues>` | Intersection of `ForgerProps` and `TFieldProps` — used for declarative `fields` array entries. |
| `UseForgeProps<TFieldProps, TFieldValues>` | Options passed to `useForge`. |
| `UseForgeResult<TFieldValues, TFieldProps>` | Return type of `useForge` — RHF `UseFormReturn` minus `control`, plus augmented `ForgeControl`. |
| `ReactNativeInputProps` | Props specific to React Native inputs: `onChangeText`, `onValueChange`, `selected`, `error`, `setNativeProps`. |
| `PlatformSpecificProps` | Prop bag split by platform: `{ web?: Record<string, any>; reactNative?: ReactNativeInputProps }`. |
| `CrossPlatformForgerProps<TFieldValues>` | Intersection of `ForgerProps` and `PlatformSpecificProps`. |
| `FormPropsRef` | Shape of the imperative ref handle exposed by `<Forge ref={...}>`: `{ onSubmit: () => void }`. |
