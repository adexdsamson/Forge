import React from "react";
import { StyleProp } from "react-native";

type SlotProps = {
  children?: React.ReactNode;
  style?: StyleProp<any>;
};

export function Slot({ children, ...props }: SlotProps) {
  if (React.Children.count(children) > 1) {
    throw new Error("Only one child allowed");
  }

  if (React.isValidElement(children)) {
    const customChildStyle = children?.props?.style ?? [];
    const style = props?.style ?? [];

    return React.cloneElement(children, {
      ...props,
      ...children.props,
      style: [
        ...style,
        ...customChildStyle,
      ],
    });
  }

  return null;
}

export type AsChildProps<DefaultElementProps, CustomProps> =
  | ({ asChild?: false } & DefaultElementProps)
  | ({ asChild: true; children: React.ReactNode } & CustomProps);
