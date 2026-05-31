/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import validateField from "./validateField";

// ---------------------------------------------------------------------------
// validateField — web rules (direct function call, no React render needed).
// All tests run under jsdom's default web mode (isWeb=true, isReactNative=false).
// RN-branch tests go in validateField.rn.test.ts (Plan 03) with vi.mock("./utils").
//
// Implementation note: validateField.ts checks isEmpty via:
//   (isHTMLElement(ref) && ref.value === "") || inputValue === "" || ...
// This means ref.value must be set to match formValues to avoid false isEmpty.
// We assign ref.value when the field has a non-empty value under test.
// ---------------------------------------------------------------------------

describe("validateField — web rules", () => {
  let ref: HTMLInputElement;

  beforeEach(() => {
    // Fresh jsdom HTMLInputElement per test.
    ref = document.createElement("input");
    ref.setCustomValidity = vi.fn() as any;
    ref.reportValidity = vi.fn() as any;
  });

  // -------------------------------------------------------------------------
  // Test 1: required rule — returns error for empty value
  // ref.value stays "" (the default); formValues.email is also "".
  // -------------------------------------------------------------------------
  it("required rule returns error for empty value", async () => {
    const field = {
      _f: {
        ref,
        refs: undefined,
        name: "email",
        required: "Email is required",
        mount: true,
        disabled: false,
      },
    } as any;

    // ref.value === "" and formValues.email === "" → both isEmpty conditions true
    const result = await validateField(field, { email: "" }, false);

    expect(result).toHaveProperty("email");
    expect(result.email?.type).toBe("required");
    expect(result.email?.message).toBe("Email is required");
  });

  // -------------------------------------------------------------------------
  // Test 2: minLength rule — returns error when value is too short
  // ref.value must match formValues.field so isEmpty is false.
  // -------------------------------------------------------------------------
  it("minLength rule returns error when value too short", async () => {
    // Set ref.value so isHTMLElement(ref) && ref.value === "" is false → isEmpty=false
    ref.value = "hi";

    const field = {
      _f: {
        ref,
        refs: undefined,
        name: "field",
        minLength: 5,
        mount: true,
        disabled: false,
      },
    } as any;

    const result = await validateField(field, { field: "hi" }, false);

    expect(result).toHaveProperty("field");
    expect(result.field?.type).toBe("minLength");
  });

  // -------------------------------------------------------------------------
  // Test 3: maxLength rule — returns error when value is too long
  // -------------------------------------------------------------------------
  it("maxLength rule returns error when value too long", async () => {
    ref.value = "toolong";

    const field = {
      _f: {
        ref,
        refs: undefined,
        name: "field",
        maxLength: 3,
        mount: true,
        disabled: false,
      },
    } as any;

    const result = await validateField(field, { field: "toolong" }, false);

    expect(result).toHaveProperty("field");
    expect(result.field?.type).toBe("maxLength");
  });

  // -------------------------------------------------------------------------
  // Test 4: pattern rule — returns error on mismatch
  // -------------------------------------------------------------------------
  it("pattern rule returns error on mismatch", async () => {
    ref.value = "abc";

    const field = {
      _f: {
        ref,
        refs: undefined,
        name: "field",
        pattern: { value: /^\d+$/, message: "Digits only" },
        mount: true,
        disabled: false,
      },
    } as any;

    const result = await validateField(field, { field: "abc" }, false);

    expect(result).toHaveProperty("field");
    expect(result.field?.type).toBe("pattern");
    expect(result.field?.message).toBe("Digits only");
  });

  // -------------------------------------------------------------------------
  // Test 5: custom validate fn returning a string is an error
  // -------------------------------------------------------------------------
  it("custom validate fn returning a string is an error", async () => {
    ref.value = "bad";

    const field = {
      _f: {
        ref,
        refs: undefined,
        name: "field",
        validate: (v: unknown) => (v === "bad" ? "Invalid" : true),
        mount: true,
        disabled: false,
      },
    } as any;

    const result = await validateField(field, { field: "bad" }, false);

    expect(result).toHaveProperty("field");
    expect(result.field?.type).toBe("validate");
    expect(result.field?.message).toBe("Invalid");
  });

  // -------------------------------------------------------------------------
  // Test 6: passing required validation returns empty error object
  // ref.value must be non-empty so isEmpty is false; required check then passes.
  // -------------------------------------------------------------------------
  it("passing required validation returns empty error object", async () => {
    ref.value = "hello";

    const field = {
      _f: {
        ref,
        refs: undefined,
        name: "field",
        required: "Required",
        mount: true,
        disabled: false,
      },
    } as any;

    const result = await validateField(field, { field: "hello" }, false);

    expect(result).toEqual({});
  });
});
