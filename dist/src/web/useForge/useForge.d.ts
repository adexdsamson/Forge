import { ComponentType, ReactNode } from "react";
import { FieldValues, Resolver, SubmitErrorHandler, UseFormReturn } from "react-hook-form";
type ForgerProps = Record<string, any> & {
    name: string;
    component: any;
    label?: string;
};
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
    classNames?: string;
    children?: ReactNode;
    onError?: SubmitErrorHandler<TFieldValues>;
    control?: "form" | "forger";
};
/**
 * A custom hook that returns a form component and form control functions using the `react-hook-form` library.
 * @param {ForgeFormProps} options - The options for the form.
 * @returns {UseForgeFormResult} - The form control functions and the form component.
 */
export declare const useForge: <TFieldValues extends FieldValues = FieldValues, TFieldProps extends unknown = unknown>({ defaultValues, resolver, mode, fieldProps, ...props }: ForgeProps<TFieldProps>) => UseForgeResult<TFieldValues>;
export {};
