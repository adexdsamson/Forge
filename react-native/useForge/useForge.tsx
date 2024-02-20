import React, { ComponentType, ReactNode, cloneElement, Children } from "react";
import {
  FieldValues,
  FormProvider,
  Resolver,
  SubmitErrorHandler,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import { StyleProp, View, ViewProps } from "react-native";
import { Forger, ForgerProps } from "../Forger";
import { isButtonSlot } from "../../src/utils/isButtonSlot";

type FieldProps<TFieldProps extends unknown = unknown> = ForgerProps &
  TFieldProps;

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
export const useForge = <
  TFieldValues extends FieldValues = FieldValues,
  TFieldProps extends unknown = unknown
>({
  defaultValues = {},
  resolver,
  mode,
  fieldProps,
  ...props
}: ForgeProps<TFieldProps>): UseForgeResult<TFieldValues> => {
  const formProps = useForm<TFieldValues>({
    defaultValues,
    resolver,
    mode,
    ...props,
  });
  const hasFieldProps =
    typeof fieldProps !== "undefined" && fieldProps?.length !== 0;

  /**
   * The form component that wraps the form content and provides the form control functions and properties.
   * @param {FormProps} props - The props for the form component.
   * @returns {JSX.Element} - The rendered form component.
   */
  const ForgeForm = ({
    style,
    children,
    onSubmit,
    onError,
  }: FormProps<TFieldValues>): JSX.Element => {
    const updatedChildren = Children.map(children, (child) => {
      if (isButtonSlot(child)) {
        return cloneElement(child, {
          onPress: formProps.handleSubmit(onSubmit, onError),
        });
      }
      return child;
    });

    const renderFieldProps = hasFieldProps
      ? fieldProps.map((inputs, index) => <Forger key={index} {...inputs} />)
      : null;

    return (
      <FormProvider {...formProps}>
        <View style={style}>
          {renderFieldProps}
          {updatedChildren}
        </View>
      </FormProvider>
    );
  };

  return { ...formProps, ForgeForm };
};
