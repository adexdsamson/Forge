import { isEqual } from "lodash";
import { ForgerProps } from "../types";
import { Slot } from "../../utils/Slots";
import React, { Component, ElementType, memo } from "react";
import { Controller, FieldValues, RegisterOptions, UseFormReturn, useFormContext } from "react-hook-form";

type ForgeProps = {
  name: string;
  className?: string;
  rules?: Omit<
    RegisterOptions<FieldValues, any>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
  transform?: {
    input?: (value: string) => string;
    output?: (val: string) => string;
  };
  Component: typeof Component<any> | ElementType<"input">;
  controller?: boolean;
  methods: UseFormReturn;
};

const ForgerController = (props: ForgeProps) => {
  const { rules, transform, methods,  ...rest } = props;

    const getTextTransform = (text: string) => {
    return typeof transform === "undefined" ? text : transform.output?.(text);
  };

  const getTransformedValue = (text: string) => {
    return typeof transform === "undefined" ? text : transform.input?.(text);
  };

  return (
    <Controller
      control={methods.control}
      name={rest?.name}
      rules={rules}
      render={({ field: { onBlur, onChange, value } }) => {
        return (
          <Component
            {...rest}
            onBlur={onBlur}
            value={getTransformedValue(value)}
            onChange={(value: string) => onChange(getTextTransform(value))}
          />
        );
      }}
    />
  );
}

const MemorizeController = memo<ForgeProps>(
  (props) => <ForgerController {...props} />,
  (prev, next) => {
    const { methods, ...others } = next;
    const { methods: _, ...rest } = prev;

    if (_.formState.isDirty === methods.formState.isDirty) {
      return true;
    }

    if (isEqual(rest, others)) {
      return true;
    }

    return true;
  }
);


export const Forger = (props: ForgerProps) => {
  const methods = useFormContext();

  return (
    <Slot>
      <MemorizeController
        {...props}
        name={props.name}
        methods={methods}
        Component={props.component}
      />
    </Slot>
  );
};