import React from 'react';
import {
  FieldValues,
  FieldArrayPath,
  UseFieldArrayProps,
  useFormContext,
  useFieldArray as useRHFFieldArray,
} from 'react-hook-form';

type ForgeFieldArray<
  T extends FieldValues,
  TF extends FieldArrayPath<T>,
  TK extends string = 'id',
  IN = unknown,
> = UseFieldArrayProps<T, TF, TK> & {
  inputProps: IN;
};

/**
 * Manages dynamic field arrays and layers per-item `inputProps` onto each returned field.
 *
 * @remarks
 * Wraps RHF's `useFieldArray` and layers per-item `inputProps` onto each returned field.
 * The `inputProps` attachment is the reason this hook exists — do not replace with a plain
 * RHF `useFieldArray` call, as that would lose per-item input configuration.
 *
 * All mutation (`append`, `remove`, `insert`, `swap`, `update`), ID tracking, focus, and
 * validation are delegated to RHF's public `useFieldArray`. Zero private RHF API access.
 *
 * @param props - RHF `UseFieldArrayProps` plus `inputProps` — the input configuration
 *   object to attach to every returned field entry.
 * @returns RHF `UseFieldArrayReturn` with `fields` augmented: each entry has `inputProps` attached.
 *
 * @example
 * ```tsx
 * const { fields, append, remove } = useFieldArray({
 *   control,
 *   name: 'phones',
 *   inputProps: { placeholder: 'Phone number', keyboardType: 'phone-pad' },
 * });
 * return fields.map((f, i) => (
 *   <Forger key={f.id} name={`phones.${i}.number`} component={TextInput} {...f.inputProps} />
 * ));
 * ```
 */
export const useFieldArray = <
  InputProps = unknown,
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id',
>(
  props: ForgeFieldArray<TFieldValues, TFieldArrayName, TKeyName, InputProps>
) => {
  const methods = useFormContext<TFieldValues>();

  const { control = methods.control, name, keyName, inputProps, rules, shouldUnregister } = props;

  // D-06: Delegate all mutation, id tracking, focus, and validation to RHF's
  // public useFieldArray. Zero _* access.
  const rhf = useRHFFieldArray<TFieldValues, TFieldArrayName, TKeyName>({
    control,
    name,
    keyName,
    rules,
    shouldUnregister,
  });

  // D-05 KEEPER: Layer Forge's per-item inputProps onto RHF's returned fields.
  // This is the entire reason useFieldArray was hand-rolled — preserve it.
  // Post-mutation validation re-homes to RHF's built-in `rules`-based
  // validation (7.34.0+). No manual validateField / _subjects path.
  const fields = React.useMemo(
    () =>
      rhf.fields.map((field) => ({
        ...field,
        inputProps,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rhf.fields, inputProps]
  );

  // D-07: The unstable [fields, name, control] useEffect is deleted entirely.
  // RHF's public useFieldArray handles all internal sync, focus, and cleanup.

  return {
    ...rhf,
    fields,
  };
};
