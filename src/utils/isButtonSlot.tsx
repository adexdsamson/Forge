import { ReactElement, ReactNode, isValidElement } from "react";

export function isButtonSlot(child: ReactNode): child is ReactElement {
  return isValidElement(child) && child.props.type === "submit";
}
