import React, { ComponentType, ReactNode, cloneElement, Children } from "react";
import {
  FieldValues,
  FormProvider,
  Resolver,
  SubmitErrorHandler,
  UseFormReturn,
  useForm,
} from "react-hook-form";
import { Forger } from "../Forger";
import { isButtonSlot } from "../../utils/isButtonSlot";
import { isInputSlot } from "../../utils/isInputSlot";

type ForgerProps = Record<string, any> & {
  name: string;
  component: any;
  label?: string;
};

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
export const useForge = <
  TFieldValues extends FieldValues = FieldValues,
  TFieldProps extends unknown = unknown
>({
  defaultValues,
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
    classNames,
    children,
    onSubmit,
    onError,
    control = "form",
  }: FormProps<TFieldValues>): JSX.Element => {
    const updatedChildren = Children.map(children, (child) => {
      if (isButtonSlot(child)) {
        return cloneElement(child, {
          onClick: formProps.handleSubmit(onSubmit, onError),
        });
      }

      if (isInputSlot(child) && control === "form") {
        return React.createElement(child.type, {
          ...{
            ...child.props,
            ...formProps.register(child.props.name),
            key: child.props.name,
          },
        });
      }

      return child;
    });

    const renderFieldProps = hasFieldProps
      ? fieldProps.map((inputs, index) => <Forger key={index} {...inputs} />)
      : null;

    return (
      <FormProvider {...formProps}>
        <div className={classNames}>
          {renderFieldProps}
          {updatedChildren}
        </div>
      </FormProvider>
    );
  };

  return { ...formProps, ForgeForm };
};
