import { FieldError, FieldErrors, FieldValues, InternalFieldName } from "react-hook-form";
import { compact, get, set } from "../utils";

export default <T extends FieldValues = FieldValues>(
  errors: FieldErrors<T>,
  error: Partial<Record<string, FieldError>>,
  name: InternalFieldName,
): FieldErrors<T> => {
  // Use compact instead of convertToArrayPayload so an undefined/non-array error slot
  // yields [] rather than [undefined] — prevents a phantom leading undefined element
  // from appearing at errors[name][0] when the slot is uninitialized (WR-03).
  const fieldArrayErrors = compact(get(errors, name));
  set(fieldArrayErrors, 'root', error[name]);
  set(errors, name, fieldArrayErrors);
  return errors;
};