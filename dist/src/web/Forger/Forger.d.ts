import React from "react";
type ForgerProps = Record<string, any> & {
    name: string;
    component: any;
    label?: string;
};
export declare const Forger: (props: ForgerProps) => React.JSX.Element;
export {};
