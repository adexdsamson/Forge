import { FieldError, FieldErrors, FieldValues, InternalFieldName } from 'react-hook-form';
import { get, set } from '../utils';

export default <T extends FieldValues = FieldValues>(
  errors: FieldErrors<T>,
  error: Partial<Record<string, FieldError>>,
  name: InternalFieldName
): FieldErrors<T> => {
  const existing = get(errors, name);
  // Field-array errors are index-aligned: errors[name][i] corresponds to row i, with
  // `undefined` holes for valid rows. Only synthesize a fresh array when the slot is
  // uninitialized — never strip `undefined` holes (e.g. via compact/filter(Boolean)),
  // which would shift later rows' errors to earlier indices and silently misalign them.
  // The Array.isArray guard also kills the original `[undefined]` phantom that
  // convertToArrayPayload(undefined) produced (WR-03 / CR-01).
  const fieldArrayErrors = Array.isArray(existing) ? existing : [];
  set(fieldArrayErrors, 'root', error[name]);
  set(errors, name, fieldArrayErrors);
  return errors;
};
