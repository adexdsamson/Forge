import React from 'react';
import { Control, FieldValues, useWatch, useFormState } from 'react-hook-form';

/**
 * ForgePersist handler signature (D-12, D-01 break from pre-v1 firehose shape).
 *
 * The handler receives:
 *   - `values`   — current snapshot of all form values (from useWatch)
 *   - `state`    — scoped form state flags { isDirty, isValid }
 *
 * Firing contract: useWatch returns a new object reference on every subscription
 * tick (RHF Pitfall 5), so the effect fires on every value change — which is the
 * intended behaviour for an autosave/draft subscription. If a consumer needs to
 * de-duplicate no-op saves it should compare values externally (e.g. serialise +
 * compare, or gate on `isDirty`).
 */
type ForgePersist<TFieldValues extends FieldValues = FieldValues> = {
  control: Control<TFieldValues>;
  handler: (values: TFieldValues, state: { isDirty: boolean; isValid: boolean }) => void;
};

/**
 * Subscribes to every form value change and fires a handler for autosave / draft persistence.
 *
 * @remarks
 * Handler fires on mount (drain the initial emission; gate on `isDirty` if you only want
 * to save after the user has interacted). Signature: `(values, { isDirty, isValid }) => void`.
 *
 * Uses RHF public `useWatch` + `useFormState` — zero private `_*` API access.
 * The handler reference is stabilised internally so inline functions are safe.
 *
 * @param props - `{ control, handler }` — the `ForgeControl` and a persist callback.
 * @returns void — side-effect only hook.
 *
 * @example
 * ```tsx
 * usePersist({
 *   control,
 *   handler: (values, { isDirty, isValid }) => {
 *     if (isDirty) saveToServer(values);
 *   },
 * });
 * ```
 */
export const usePersist = <TFieldProps extends FieldValues = FieldValues>({
  control,
  handler,
}: ForgePersist<TFieldProps>) => {
  // Preserve handler identity so the effect below does not re-bind on every
  // render when the consumer passes an inline function (KEEPER idiom).
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  // Public reactive subscriptions — zero _* access (D-12 / STAB-02).
  const values = useWatch({ control });
  const { isDirty, isValid } = useFormState({ control });

  React.useEffect(() => {
    handlerRef.current(values as TFieldProps, { isDirty, isValid });
  }, [values, isDirty, isValid]);
};
