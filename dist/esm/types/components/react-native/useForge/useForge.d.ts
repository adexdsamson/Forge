import { ComponentType, ReactNode } from "react";
import { FieldValues, Resolver, SubmitErrorHandler, UseFormReturn } from "react-hook-form";
import { StyleProp, ViewProps } from "react-native";
import { ForgerProps } from "../Forger";
type FieldProps<TFieldProps extends unknown = unknown> = ForgerProps & TFieldProps;
type ForgeProps<TFieldProps extends unknown = unknown> = {
    defaultValues?: any;
    resolver?: Resolver<any>;
    fieldProps?: FieldProps<TFieldProps>[];
    mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
};
type UseForgeResult<T extends FieldValues> = UseFormReturn<T> & {
    ForgeForm: ComponentType<FormProps<T>>;
};
type FormProps<TFieldValues extends FieldValues> = {
    onSubmit: (submit: TFieldValues) => void;
    style?: StyleProp<ViewProps>;
    children?: ReactNode;
    onError?: SubmitErrorHandler<TFieldValues>;
};
/**
 * A custom hook that returns a form component and form control functions using the `react-hook-form` library.
 * @param {ForgeProps} options - The options for the form.
 * @returns {UseForgeResult} - The form control functions and the form component.
 */
export declare const useForge: <TFieldValues extends FieldValues = FieldValues, TFieldProps extends unknown = unknown>({ defaultValues, resolver, mode, fieldProps, ...props }: ForgeProps<TFieldProps>) => UseForgeResult<TFieldValues>;
export {};
