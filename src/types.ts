import { ReactNode, RefObject } from "react";
import type { Accept } from "react-dropzone";
import {
  Control,
  DefaultValues,
  FieldValues,
  Path,
  RegisterOptions,
  Resolver,
  UseFormReturn,
} from "react-hook-form";

export type FormPropsRef = {
  onSubmit: () => void;
};

export type ForgeControl<
  T extends FieldValues,
  TFieldProps = unknown
> = Control<T, any> & {
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

type AsyncDefaultValues<TFieldValues> = (
  payload?: unknown
) => Promise<TFieldValues>;

export type ForgerProps<TFieldValues extends FieldValues = FieldValues> = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "name"
> & {
  name: Path<TFieldValues>;
  component: React.ElementType;
  label?: string | React.ReactElement;
  onChange?: (value: string) => void;
  accept?: Accept;
  multiple?: boolean;
  control?: ForgeControl<TFieldValues>;
} & Record<string, unknown>;

export type ForgerControllerProps<
  TFieldValues extends FieldValues = FieldValues
> = {
  name: Path<TFieldValues>;
  className?: string;
  rules?: Omit<
    RegisterOptions<TFieldValues, any>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
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

export type ForgerSlotProps = {
  name: string;
  error: string;
  value: string;
  placeholder?: string;
  control: ForgeControl<FieldValues>;
  onBlur: RegisterOptions["onBlur"];
  onChange: RegisterOptions["onChange"];
};

export type TForgerProps = {
  name: string;
  component: React.ElementType;
  label?: string;
};

export type FieldProps<
  TFieldProps = unknown,
  TFieldValues extends FieldValues = FieldValues
> = ForgerProps<TFieldValues> & TFieldProps;

export type UseForgeProps<
  TFieldProps = unknown,
  TFieldValues extends FieldValues = FieldValues
> = {
  defaultValues?:
    | AsyncDefaultValues<TFieldValues>
    | DefaultValues<TFieldValues>
    | undefined;
  resolver?: Resolver<TFieldValues>;
  fields?: FieldProps<TFieldProps>[];
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
   // Wizard configuration
  initialStep?: number;
  totalSteps?: number;
  isWizard?: boolean;
};

export type UseForgeResult<T extends FieldValues, TFieldProps = unknown> = Omit<
  UseFormReturn<T>,
  "control"
> & {
  control: ForgeControl<T, TFieldProps>;
};

export type ForgeProps<
  TFieldValues extends FieldValues,
  TFieldProps = unknown
> = {
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

// React Native specific types
export type ReactNativeInputProps = {
  onChangeText?: (text: string) => void;
  onValueChange?: (value: any) => void;
  selected?: boolean;
  error?: string;
  setNativeProps?: (props: any) => void;
};

export type PlatformSpecificProps = {
  web?: Record<string, any>;
  reactNative?: ReactNativeInputProps;
};

export type CrossPlatformForgerProps<TFieldValues extends FieldValues = FieldValues> = 
  ForgerProps<TFieldValues> & PlatformSpecificProps;
