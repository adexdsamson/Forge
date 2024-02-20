import { ElementType, ReactElement, ReactNode, isValidElement } from "react";

export function isInputSlot(child: ReactNode): child is ReactElement {
  return isValidElement(child) && child.props.name;
}
