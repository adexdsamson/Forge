"use client";

import React, {
  Children,
  cloneElement,
  createElement,
  FormEvent,
  useCallback,
  useImperativeHandle,
} from "react";
import { FieldValues, FormProvider } from "react-hook-form";
import { ForgeProps } from "../types";
import {
  isButtonSlot,
  isButtonSubmitSlot,
  isElementSlot,
  isInputSlot,
  isNestedSlot,
  isReactNative,
} from "../utils";
import {
  getComponentType,
  getEventHandlerName,
} from "../reactNative";
import { Forger } from "../Forger";

// Dev-only: lazy-load @hookform/devtools via synchronous require so it is never
// included in the production bundle. @hookform/devtools is declared as an optional
// peer dependency — consumers only need it when they use debug={true}.
// The `declare` avoids a hard @types/node dependency while keeping the call synchronous
// (dynamic import() cannot satisfy the synchronous-throw requirement — D-09).
declare function require(module: string): any; // eslint-disable-line no-var

function loadDevTool(): React.ComponentType<{ control: unknown }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("@hookform/devtools").DevTool;
  } catch {
    throw new Error(
      "Forge: debug mode requires '@hookform/devtools'. Install it with `npm i -D @hookform/devtools`."
    );
  }
}

export const Forge = <TFieldValues extends FieldValues = FieldValues>({
  className,
  children,
  onSubmit,
  noValidate = false,
  control,
  ref,
  isNative,
  debug,
  platform = "auto",
}: ForgeProps<TFieldValues>) => {
  const safeOnSubmit = useCallback(onSubmit ?? (() => {}), [onSubmit]);
  // Determine the actual platform to use
  const actualPlatform =
    platform === "auto" ? (isReactNative ? "react-native" : "web") : platform;

  const isRNMode =
    actualPlatform === "react-native" || (isNative && isReactNative);

  // Wizard state management
  // Handle both ReactNode and function children for wizard mode
  const childrenArray =
    typeof children === "function" ? [children] : Children.toArray(children);

  // Get wizard state and functions from control object
  const {
    isWizard,
    currentStep = 0,
    totalSteps = 0,
    isFirstStep = true,
    isLastStep = true,
    handleNext,
    handlePrevious,
    handleWizardSubmit,
  } = control;

  // AnyElement: a React element with an open prop bag (Record<string, unknown>) so we can
  // read typed props without `as any`. Every branch and prop-merge is byte-for-byte
  // equivalent to the previous implementation — this is a TYPE-ONLY change (D-10, RISK-04).
  type AnyElement = React.ReactElement<Record<string, unknown>>;

  // Recursive function to traverse and process the entire nested tree of children
  const processChildrenRecursively = (
    children: React.ReactNode,
    depth = 0
  ): React.ReactNode => {
    // Prevent infinite recursion with a reasonable depth limit
    if (depth > 10) {
      return children;
    }

    return Children.map(children, (child) => {
      // Skip non-React elements (strings, numbers, null, undefined)
      if (!isElementSlot(child)) {
        return child;
      }

      // isElementSlot is a type guard (child is ReactElement). Cast to AnyElement so
      // childProps reads as Record<string, unknown> instead of {} (the default ReactElement
      // props type when no generic is supplied). NO runtime change.
      const el = child as AnyElement;
      const childProps = el.props;

      // Handle render props pattern - if child is a function, call it with wizard step info
      // NOTE: a ReactElement's .type can be a function (FC/class), but the element itself
      // is never a function after isValidElement. This branch guards legacy render-prop
      // consumers who accidentally pass a bare function as a child before Forge wraps it.
      if (typeof child === "function") {
        const wizardProps = isWizard
          ? {
              currentStep,
              totalSteps,
              isFirstStep,
              isLastStep,
              handleNext,
              handlePrevious,
              handleWizardSubmit,
            }
          : {};

        return (child as unknown as (p: Record<string, unknown>) => React.ReactNode)({ control, ...wizardProps });
      }

      // Handle submit button
      if (isButtonSubmitSlot(child)) {
        if (isRNMode) {
          // Native: no <form> element exists, so wire onClick to drive handleSubmit
          return cloneElement(el, {
            onClick: control.handleSubmit(safeOnSubmit),
          });
        }
        // Web: the <form onSubmit> drives handleSubmit via native form submit
        // (Enter + button click), so do NOT inject a second onClick binding here
        // — that would cause double-submit. Return the button unchanged.
        return child;
      }

      // Handle button elements - attach form submit handler or wizard navigation
      if (isButtonSlot(child)) {
        const wizardNav = childProps["data-wizard-nav"];

        if (isWizard && wizardNav) {
          let onClick: (() => void) | undefined;
          let disabled = false;

          if (wizardNav === "next") {
            if (currentStep === totalSteps - 1) {
              // Last step - submit form via RHF-validated handleWizardSubmit threaded with onSubmit.
              // Fall back to handleSubmit when handleWizardSubmit is absent (hand-built ForgeControl).
              onClick = control.handleWizardSubmit
                ? control.handleWizardSubmit(safeOnSubmit)
                : control.handleSubmit(safeOnSubmit);
            } else {
              // Navigate to next step
              onClick = handleNext;
            }
          } else if (wizardNav === "previous") {
            onClick = handlePrevious;
            disabled = currentStep === 0;
          }

          return cloneElement(el, {
            ...childProps,
            onClick,
            className: `${(childProps.className as string) || ""} ${
              isWizard ? "wizard-button" : ""
            }`,
            disabled: disabled || childProps.disabled,
          });
        }

        return cloneElement(el, {});
      }

      // Handle input elements in native/React Native mode - register with form control
      if (isInputSlot(child) && (isNative || isRNMode)) {
        const componentType = getComponentType(child);
        const eventHandlerName = getEventHandlerName(componentType);
        const registrationProps = control.register(childProps.name as Parameters<typeof control.register>[0]);

        // Merge platform-specific props
        const platformProps = isRNMode
          ? {
              [eventHandlerName]: registrationProps.onChange,
              onBlur: registrationProps.onBlur,
              ref: registrationProps.ref,
              name: registrationProps.name,
            }
          : registrationProps;

        return createElement(el.type, {
          ...childProps,
          ...platformProps,
          key: childProps.name,
        });
      }

      // Get child's children for recursive processing
      const childChildren = childProps?.children as React.ReactNode | undefined;

      // If this element has children, process them recursively
      if (childChildren) {
        const processedChildren = processChildrenRecursively(
          childChildren,
          depth + 1
        );

        // For nested container elements (div, section, main), use createElement to preserve structure
        if (isNestedSlot(child)) {
          return createElement(el.type, {
            ...childProps,
            children: processedChildren,
          });
        }

        // For other elements with children, clone and update with wizard props if in wizard mode
        const wizardProps = isWizard
          ? {
              currentStep,
              totalSteps,
              isFirstStep,
              isLastStep,
              handleNext,
              handlePrevious,
              handleWizardSubmit,
            }
          : {};

        return cloneElement(el, {
          control,
          ...wizardProps,
          children: processedChildren,
        });
      }

      // For leaf elements without children, pass control prop and wizard props if in wizard mode
      const wizardProps = isWizard
        ? {
            currentStep,
            totalSteps,
            isFirstStep,
            isLastStep,
            handleNext,
            handlePrevious,
            handleWizardSubmit,
          }
        : {};

      return cloneElement(el, { control, ...wizardProps });
    });
  };

  // Process children based on wizard mode
  let updatedChildren;
  if (isWizard && childrenArray.length > 0) {
    // In wizard mode, only process and render the current step's child
    const currentChild = childrenArray[currentStep];
    updatedChildren = processChildrenRecursively(currentChild);
  } else {
    // Normal mode - process all children
    updatedChildren = processChildrenRecursively(children);
  }

  useImperativeHandle(
    ref,
    () => {
      return {
        onSubmit: () => {
          if (isWizard && !isLastStep) {
            // On intermediate wizard steps, programmatic submit advances the wizard,
            // agreeing with the in-tree wizard nav button behavior (WR-02).
            handleNext?.();
            return;
          }
          // On the last step (or non-wizard), submit via the same path as the nav button.
          if (control.handleWizardSubmit) {
            control.handleWizardSubmit(safeOnSubmit)();
          } else {
            control.handleSubmit(safeOnSubmit)();
          }
        },
        currentStep,
        totalSteps,
      };
    },
    [safeOnSubmit, control, currentStep, totalSteps, isWizard, isLastStep, handleNext]
  );

  // CR-01: Wizard-aware form submit guard.
  // On intermediate wizard steps, Enter/implicit submit advances the wizard instead
  // of calling safeOnSubmit with partial data. On the last step (or non-wizard),
  // delegate to RHF's handleSubmit which calls event.preventDefault() internally.
  const onFormSubmit = (e: FormEvent) => {
    if (isWizard && !isLastStep) {
      e.preventDefault();
      handleNext?.();
      return;
    }
    return control.handleSubmit(safeOnSubmit)(e as unknown as React.BaseSyntheticEvent);
  };

  const renderFieldProps = control.hasFields
    ? control?.fields?.map((inputs, index) => (
        <Forger key={index} {...inputs} />
      ))
    : null;

  const formChildren = (
    <>
      {renderFieldProps}
      {updatedChildren}
      {isWizard && (
        <div
          className="wizard-info"
          style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#666" }}
        >
          Step {currentStep + 1} of {totalSteps}
        </div>
      )}
    </>
  );

  // Dev-only: load @hookform/devtools synchronously when debug={true}. This call is
  // inside an if-block so bundlers that tree-shake dead branches (and the rollup
  // `external` declaration) never pull the package into a production consumer's graph.
  let devtools: React.ReactNode = null;
  if (debug) {
    const DevTool = loadDevTool();
    devtools = <DevTool control={control} />;
  }

  return (
    // FormProvider expects the full UseFormReturn<T> methods object. <Forge> receives only
    // `control` (ForgeControl<T>), which is RHF's Control instance augmented in-place by
    // useForge via Object.assign. Spreading control here makes FormProvider's context
    // available to child useFormContext() calls. This narrow cast is intentional: changing
    // it would alter the runtime wiring that Phase-1 CORR-01/CORR-04 fixes depend on.
    // Tracked for a clean retype in a future phase when <Forge> accepts `methods` directly.
    <FormProvider
      {...(control as unknown as Parameters<typeof FormProvider>[0])}
      control={control as unknown as Parameters<typeof FormProvider>[0]["control"]}
    >
      {isRNMode ? (
        // React Native: render a plain Fragment — no wrapper element, no className/style
        // (consumers wrap in their own <View> for layout). No hard react-native import.
        <>
          {formChildren}
        </>
      ) : (
        // Web: render a real <form> element so native browser submit semantics apply
        // (Enter-to-submit, type="submit" button, native required/pattern validation).
        // RHF's handleSubmit calls event.preventDefault() internally (T-01-01).
        <form
          className={className}
          noValidate={noValidate}
          onSubmit={onFormSubmit}
        >
          {formChildren}
        </form>
      )}
      {devtools}
    </FormProvider>
  );
};
