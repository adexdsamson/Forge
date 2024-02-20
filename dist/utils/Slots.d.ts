import React from "react";
import { StyleProp } from "react-native";
type SlotProps = {
    children?: React.ReactNode;
    style?: StyleProp<any>;
};
export declare function Slot({ children, ...props }: SlotProps): React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | null;
export type AsChildProps<DefaultElementProps, CustomProps> = ({
    asChild?: false;
} & DefaultElementProps) | ({
    asChild: true;
    children: React.ReactNode;
} & CustomProps);
export {};
