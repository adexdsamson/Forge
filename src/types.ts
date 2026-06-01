import { ReactNode, RefObject } from 'react';
import type { Accept } from 'react-dropzone';
import {
  Control,
  DefaultValues,
  FieldValues,
  Path,
  RegisterOptions,
  Resolver,
  UseFormReturn,
} from 'react-hook-form';

/**
 * Ref shape for programmatic form submission via `<Forge ref={...}>`.
 * Call `ref.current.onSubmit()` to trigger the same submit path as a native form submit.
 */
export type FormPropsRef = {
  onSubmit: () => void;
};

/**
 * RHF `Control<T>` augmented in-place with Forge metadata (hasFields, fields, wizard state).
 *
 * @remarks
 * Created by `useForge` via `Object.assign(methods.control, forgeProps)` — it is the **same**
 * RHF `Control` instance with Forge props overlaid. The RHF prototype chain and all internal
 * fields remain intact. Pass this as the `control` prop to `<Forge>` and any other Forge hook.
 */
export type ForgeControl<T extends FieldValues, TFieldProps = unknown> = Control<T, any> & {
  fields?: FieldProps<TFieldProps>[];
  hasFields: boolean;
  // Wizard state and functions
  isWizard?: boolean;
  currentStep?: number;
  totalSteps?: number;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  handleNext?: () => void;
  handlePrevious?: () => void;
  handleWizardSubmit?: (onSubmit?: (data: any) => void) => () => void;
};

type AsyncDefaultValues<TFieldValues> = (payload?: unknown) => Promise<TFieldValues>;

/**
 * Props for `<Forger>`. `name` and `component` are required; all extra props are spread to `component` via `...rest`.
 *
 * @remarks
 * Extra props (beyond the named `name`, `component`, `label`, `onChange`, `accept`, `multiple`,
 * `control`) are typed as `Record<string, unknown>` and forwarded directly to the rendered
 * `component`. This is how React Native-specific props (e.g. `keyboardType`, `secureTextEntry`)
 * reach the underlying input — pass them flat on `<Forger>`, not via `reactNative={{}}`.
 */
export type ForgerProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'name'
> & {
  name: Path<TFieldValues>;
  component: React.ElementType;
  label?: string | React.ReactElement;
  onChange?: (value: string) => void;
  accept?: Accept;
  multiple?: boolean;
  control?: ForgeControl<TFieldValues>;
} & Record<string, unknown>;

/**
 * Internal props for `ForgerController` — the RHF-wired inner component rendered by `<Forger>`.
 * Not intended for direct consumer use; use `ForgerProps` instead.
 */
export type ForgerControllerProps<TFieldValues extends FieldValues = FieldValues> = {
  name: Path<TFieldValues>;
  className?: string;
  rules?: Omit<
    RegisterOptions<TFieldValues, any>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  transform?: {
    input?: (value: unknown) => unknown;
    output?: (val: unknown) => unknown;
  };
  component: React.ElementType;
  handler?: string;
  methods: UseFormReturn<TFieldValues>;
  dependencies?: any[];
} & Record<string, unknown>;

/**
 * Props injected into a field's `Slot` wrapper by `ForgerController`.
 * Exposes the raw field name, current error message, value, and RHF event callbacks.
 */
export type ForgerSlotProps = {
  name: string;
  error: string;
  value: string;
  placeholder?: string;
  control: ForgeControl<FieldValues>;
  onBlur: RegisterOptions['onBlur'];
  onChange: RegisterOptions['onChange'];
};

/**
 * Minimal field descriptor used for type-narrowing in tree-walker guards.
 * Contains only the props required for Forge to detect and wire an input slot.
 */
export type TForgerProps = {
  name: string;
  component: React.ElementType;
  label?: string;
};

/**
 * Shape for entries in the declarative `fields` array passed to `useForge`.
 * Merges `ForgerProps` with any additional per-field input configuration (`TFieldProps`).
 */
export type FieldProps<
  TFieldProps = unknown,
  TFieldValues extends FieldValues = FieldValues,
> = ForgerProps<TFieldValues> & TFieldProps;

/**
 * Options for `useForge`. Mirrors RHF `useForm` options plus Forge-specific wizard config.
 *
 * @remarks
 * `fields` — declarative field definitions rendered automatically by `<Forge>` (no explicit `<Forger>` JSX needed).
 * `isWizard` / `totalSteps` / `initialStep` — enable wizard/multi-step mode.
 * All standard RHF options (`defaultValues`, `resolver`, `mode`, `reValidateMode`, etc.) are forwarded to `useForm`.
 */
export type UseForgeProps<TFieldProps = unknown, TFieldValues extends FieldValues = FieldValues> = {
  defaultValues?: AsyncDefaultValues<TFieldValues> | DefaultValues<TFieldValues> | undefined;
  resolver?: Resolver<TFieldValues>;
  fields?: FieldProps<TFieldProps>[];
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  // Wizard configuration
  initialStep?: number;
  totalSteps?: number;
  isWizard?: boolean;
};

/**
 * Return type of `useForge`. Same shape as RHF `UseFormReturn` but `control` is `ForgeControl<T>`.
 *
 * @remarks
 * Destructure `control` and pass it to `<Forge>`. All other members (`register`, `handleSubmit`,
 * `formState`, `watch`, `reset`, etc.) are the standard RHF equivalents.
 */
export type UseForgeResult<T extends FieldValues, TFieldProps = unknown> = Omit<
  UseFormReturn<T>,
  'control'
> & {
  control: ForgeControl<T, TFieldProps>;
};

/**
 * Props for `<Forge>`. The `control` prop is required and must come from `useForge`.
 *
 * @remarks
 * `platform`: `'web'` | `'react-native'` | `'auto'` (default `'auto'`). Auto-detection reads
 * module-level `isReactNative` at import time.
 *
 * `debug`: when `true`, mounts `@hookform/devtools` (install it as a dev dependency separately).
 *
 * `isWizard`: enable wizard mode — `<Forge>` renders only the current step's child.
 * Must agree with the `isWizard` flag passed to `useForge`.
 */
export type ForgeProps<TFieldValues extends FieldValues, TFieldProps = unknown> = {
  onSubmit?: (submit: TFieldValues) => void;
  noValidate?: boolean;
  className?: string;
  children?: ReactNode;
  control: ForgeControl<TFieldValues, TFieldProps>;
  ref?: RefObject<FormPropsRef | null>;
  isNative?: boolean;
  debug?: boolean;
  platform?: 'web' | 'react-native' | 'auto';
  isWizard?: boolean;
};

/**
 * React Native input event and state props that Forge may inject or read from RN components.
 */
export type ReactNativeInputProps = {
  onChangeText?: (text: string) => void;
  onValueChange?: (value: any) => void;
  selected?: boolean;
  error?: string;
  setNativeProps?: (props: any) => void;
};

/**
 * Container for platform-specific prop branches (`web` and `reactNative`).
 * Used by `mergePlatformProps` to select the correct branch at runtime.
 */
export type PlatformSpecificProps = {
  web?: Record<string, any>;
  reactNative?: ReactNativeInputProps;
};

/**
 * `ForgerProps` extended with platform-specific prop branches for consumers who need
 * fine-grained web/RN prop separation. In most cases, passing RN props directly on
 * `<Forger>` is simpler — see `ForgerProps` remarks.
 */
export type CrossPlatformForgerProps<TFieldValues extends FieldValues = FieldValues> =
  ForgerProps<TFieldValues> & PlatformSpecificProps;

/**
 * Props interface for a submit button used inside `<Forge>` in React Native mode.
 * Add `forgeSubmit` (or `forgeSubmit={true}`) to any button and Forge will
 * automatically inject an `onPress` handler wired to `handleSubmit(onSubmit)`.
 * The `forgeSubmit` prop is stripped before it reaches the host component.
 */
export interface ForgeSubmitButtonProps {
  forgeSubmit?: boolean;
}
