import { FieldValues, useForm } from "react-hook-form";
import { useState } from "react";
import { ForgeControl, UseForgeProps, UseForgeResult } from "../types";

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
  // Initialize react-hook-form directly.
  // NOTE: `...(props as any)` is an INTERNAL INPUT spread — it passes remaining
  // UseForgeProps options (e.g. reValidateMode, criteriaMode) into useForm. This
  // is NOT the public return surface; the STAB-05 public-return gate is the typed
  // `control: ForgeControl<T>` in the return statement below.
  const methods = useForm<TFieldValues>({
    defaultValues,
    resolver,
    mode,
    ...(props as any),
  });

  const hasFields =
    (typeof fields !== "undefined" && fields?.length !== 0) ?? false;

  // Wizard state management — currentStep stays in React state so that wizard
  // step transitions trigger re-renders independently of control identity.
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

  // Create wizard props object (same shape as before; only the attach mechanism changes).
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

  // D-11: Augment control IN PLACE — same instance, prototype + _* internals intact.
  // This fixes the unstable-control identity that caused the useFieldArray useEffect
  // (D-07) to misfire on every render when the old spread produced a new object.
  const forgeProps = { hasFields, fields, ...wizardProps };
  Object.assign(methods.control, forgeProps);

  return {
    ...methods,
    control: methods.control as ForgeControl<TFieldValues, TFieldProps>,
  };
};
