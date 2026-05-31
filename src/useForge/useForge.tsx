"use strict";

import { FieldValues, useForm } from "react-hook-form";
import { useState } from "react";
import { UseForgeProps, UseForgeResult } from "../types";

/**
 * A custom hook that returns a form component and form control functions using the `react-hook-form` library.
 * @param {UseForgeProps} options - The options for the form.
 * @returns {UseForgeResult} - The form control functions and the form component.
 */
export const useForge = <
  TFieldValues extends FieldValues = FieldValues,
  TFieldProps = unknown
>({
  defaultValues,
  resolver,
  mode,
  fields,
  isWizard = false,
  totalSteps = 0,
  initialStep = 0,
  ...props
}: UseForgeProps<TFieldProps, TFieldValues>): UseForgeResult<TFieldValues> => {
  // Initialize react-hook-form directly
  const methods = useForm<TFieldValues>({
    defaultValues,
    resolver,
    mode,
    ...(props as any),
  });

  const hasFields =
    (typeof fields !== "undefined" && fields?.length !== 0) ?? false;

  // Wizard state management
  const [currentStep, setCurrentStep] = useState(initialStep);

  // Wizard navigation handlers
  const handleNext = () => {
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Wizard submit handler: accepts the consumer's onSubmit callback and returns
  // an RHF-validated submit handler. RHF's handleSubmit gates the call on
  // whole-form validation — invalid form blocks onSubmit and populates errors.
  const handleWizardSubmit = (onSubmit?: (data: TFieldValues) => void) =>
    methods.handleSubmit(onSubmit ?? (() => {}));

  // Create wizard props object
  const wizardProps = isWizard ? {
    isWizard,
    currentStep,
    totalSteps,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    handleNext,
    handlePrevious,
    handleWizardSubmit,
  } : {};

  return { 
    ...methods, 
    control: { 
      ...methods.control, 
      hasFields, 
      fields,
      ...wizardProps
    } 
  };
};
