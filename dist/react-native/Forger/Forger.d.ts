import React, { Component } from "react";
import { FieldValues, RegisterOptions, UseFormReturn } from "react-hook-form";
import { StyleProp, TextInputProps, TextStyle } from "react-native";
type ForgeControllerProps = {
    name: string;
    Component: typeof Component<TextInputProps>;
    methods: UseFormReturn;
    style?: StyleProp<TextStyle>;
    rules?: Omit<RegisterOptions<FieldValues, any>, "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled">;
    transform?: {
        input?: (value: string) => string;
        output?: (val: string) => string;
    };
    handler?: "onChangeText" | "onChange";
};
export type ForgerProps = Record<string, any> & {
    name: string;
    component: any;
    label?: string;
    handler?: ForgeControllerProps["handler"];
};
export declare const Forger: (props: ForgerProps) => React.JSX.Element;
export {};
