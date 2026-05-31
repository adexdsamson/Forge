// IMPORTANT: vi.mock must be the very first statement in this file.
// Vitest hoists vi.mock() calls above all static imports at transform time,
// so the factory runs before validateField.ts (the SUT) is imported and evaluates
// its module-level isReactNative/isWeb constants from ./utils. Without hoisting,
// isReactNative would be false (jsdom sets typeof window, so isWeb=true) and the
// setNativeProps branch at validateField.ts lines 159-163 would never execute.
vi.mock("./utils", async (importOriginal) => {
  const original = await importOriginal<typeof import("./utils")>();
  return {
    ...original,       // preserve all other exports (deepEqual, Slot, cloneObject, etc.)
    isReactNative: true,
    isWeb: false,
    isMobile: true,
  };
});

/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import validateField from "./validateField";

// ---------------------------------------------------------------------------
// Tests: validateField RN branch (setNativeProps path)
// ---------------------------------------------------------------------------
// validateField.ts lines 153-165:
//   const inputRef: any = refs ? refs[0] : ref;
//   const setCustomValidity = (message?) => {
//     if (shouldUseNativeValidation) {
//       if (isWeb && inputRef?.reportValidity) { ... web path ... }
//       else if (isReactNative && inputRef?.setNativeProps) {
//         inputRef.setNativeProps({ error: isBoolean(message) ? undefined : message || undefined });
//       }
//     }
//   };
// ---------------------------------------------------------------------------

describe("validateField — RN branch (isReactNative=true via vi.mock)", () => {
  let mockSetNativeProps: ReturnType<typeof vi.fn>;
  let rnRef: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetNativeProps = vi.fn();
    rnRef = { setNativeProps: mockSetNativeProps };
  });

  it("Test 1: required rule calls setNativeProps({ error }) when shouldUseNativeValidation=true", async () => {
    const field = {
      _f: {
        ref: rnRef,
        refs: undefined, // inputRef = ref (validateField.ts line 153)
        name: "username",
        required: "Required",
        mount: true,
        disabled: false,
      },
    } as any;

    const result = await validateField(
      field,
      { username: "" },
      false,
      true, // shouldUseNativeValidation=true gates the setNativeProps call
    );

    // Validation must return error on "username" key
    expect(result).toHaveProperty("username");
    expect(result.username?.type).toBe("required");

    // setNativeProps must be called with { error: "Required" }
    // validateField.ts line 162: error: isBoolean(message) ? undefined : message || undefined
    // isBoolean("Required") = false, so: "Required" || undefined = "Required"
    expect(mockSetNativeProps).toHaveBeenCalled();
    expect(mockSetNativeProps).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Required" }),
    );
  });

  it("Test 2: required rule does NOT call setNativeProps when shouldUseNativeValidation is omitted", async () => {
    const field = {
      _f: {
        ref: rnRef,
        refs: undefined,
        name: "username",
        required: "Required",
        mount: true,
        disabled: false,
      },
    } as any;

    // Call without the 4th arg (shouldUseNativeValidation defaults to undefined/falsy)
    await validateField(field, { username: "" }, false);

    // Validation error still returned
    // But setNativeProps must NOT be called — shouldUseNativeValidation guard (line 155)
    expect(mockSetNativeProps).not.toHaveBeenCalled();
  });
});
