import {
  FieldValues,
  Path,
  PathValue,
  UseFormSetValue,
  UseFormGetValues,
  useFormContext,
} from "react-hook-form";
import { ForgeControl } from "../types";

export type UseForgeValuesProps<
  TFieldValues extends FieldValues = FieldValues
> = {
  control: ForgeControl<TFieldValues>;
};

export type UseForgeValuesReturn<
  TFieldValues extends FieldValues = FieldValues
> = {
  setValue: UseFormSetValue<TFieldValues>;
  getValue: <TFieldName extends Path<TFieldValues>>(
    name: TFieldName
  ) => PathValue<TFieldValues, TFieldName>;
  getValues: UseFormGetValues<TFieldValues>;
};

/**
 * Walk a dot-path (and bracket-index syntax) against an object to test key presence.
 *
 * Known limitation (RISK-01 / Assumption A5): a field registered with no defaultValue
 * and never written may be absent from getValues() until first interaction. Existence
 * detection is reliable for fields that have a defaultValue or have been written at
 * least once — which matches Forge's controlled <Forger> usage pattern.
 *
 * Do NOT replace this check with private RHF internals (STAB-02).
 */
const hasPath = (obj: unknown, path: string): boolean => {
  // Normalize bracket notation: items[0].name → items.0.name
  const segments = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cur: unknown = obj;
  for (const seg of segments) {
    if (cur == null || typeof cur !== "object") return false;
    if (!(seg in (cur as Record<string, unknown>))) return false;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return true;
};

/**
 * Thin pass-through wrapper over RHF's public setValue / getValues.
 *
 * getValue(name) delegates to RHF getValues(name) but throws a Forge-named error
 * when the field is not found in the whole-form getValues() object (RISK-01 / D-04).
 *
 * @param {UseForgeValuesProps} props - The props containing forgeControl
 * @returns {UseForgeValuesReturn} - Object containing setValue, getValue, and getValues
 */
export const useForgeValues = <TFieldValues extends FieldValues = FieldValues>({
  control: _control,
}: UseForgeValuesProps<TFieldValues>): UseForgeValuesReturn<TFieldValues> => {
  // Mirror the Forger.tsx delegation idiom (Forger.tsx:27-30): derive RHF public
  // methods from useFormContext rather than touching RHF private internals.
  const ctx = useFormContext<TFieldValues>();

  const { setValue, getValues } = ctx;

  const getValue = <TFieldName extends Path<TFieldValues>>(
    name: TFieldName
  ): PathValue<TFieldValues, TFieldName> => {
    const all = ctx.getValues();
    if (!hasPath(all, String(name))) {
      throw new Error(
        `useForgeValues.getValue: field "${String(name)}" is not registered`
      );
    }
    return ctx.getValues(name);
  };

  return { setValue, getValue, getValues };
};
