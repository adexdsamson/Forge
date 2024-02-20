import { ComponentType, ReactNode } from "react";
import { FieldValues, Resolver, SubmitErrorHandler, UseFormReturn } from "react-hook-form";

export type ForgerProps = Record<string, any> & {
  name: string;
  component: any;
  label?: string;
};

export type FieldProps<TFieldProps extends unknown = unknown> = ForgerProps &
  TFieldProps;

export type ForgeProps<TFieldProps extends unknown = unknown> = {
  defaultValues?: any;
  resolver?: Resolver<any>;
  fieldProps?: FieldProps<TFieldProps>[];
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
};

export type UseForgeResult<T extends FieldValues> = UseFormReturn<T> & {
  ForgeForm: ComponentType<FormProps<T>>;
};

export type FormProps<TFieldValues extends FieldValues> = {
  onSubmit: (submit: TFieldValues) => void;
  classNames?: string;
  children?: ReactNode;
  onError?: SubmitErrorHandler<TFieldValues>;
  control?: "form" | "forger";
};