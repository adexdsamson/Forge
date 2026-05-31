/// <reference types="vitest/globals" />
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Forge } from "../Forge/Forge";
import { Forger } from "../Forger/Forger";
import { useForge } from "../useForge/useForge";
import { useFieldArray } from "./useFieldArray";
import { TextInput } from "../test-utils";

// ---------------------------------------------------------------------------
// DynamicForm: renders a Forge with useFieldArray wired to "items".
// Provides Add button (data-testid="add-btn") and per-item Remove buttons
// (data-testid="remove-N"). Forger uses name="items.N.value".
// ---------------------------------------------------------------------------
function DynamicForm({
  onSubmit = vi.fn(),
  initialItems = [{ value: "first" }],
}: {
  onSubmit?: ReturnType<typeof vi.fn>;
  initialItems?: { value: string }[];
}) {
  const { control } = useForge({
    defaultValues: { items: initialItems },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items" as any,
    inputProps: {},
  });

  return (
    <Forge control={control} onSubmit={onSubmit as any}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <Forger
            name={`items.${index}.value` as any}
            component={TextInput}
            data-testid={`item-${index}`}
          />
          <button
            type="button"
            onClick={() => remove(index)}
            data-testid={`remove-${index}`}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ value: "" } as any)}
        data-testid="add-btn"
      >
        Add
      </button>
      <button type="submit" data-testid="submit-btn">
        Submit
      </button>
    </Forge>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useFieldArray — append and remove integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("append adds a new field to the list", async () => {
    render(<DynamicForm initialItems={[{ value: "first" }]} />);

    // Initially 1 remove button
    expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(1);

    // Click Add
    await userEvent.click(screen.getByTestId("add-btn"));

    // Now 2 remove buttons visible
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(2);
    });
  });

  it("remove deletes a field by index", async () => {
    render(
      <DynamicForm initialItems={[{ value: "first" }, { value: "second" }]} />
    );

    // Initially 2 remove buttons
    expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(2);

    // Click Remove for index 0
    await userEvent.click(screen.getByTestId("remove-0"));

    // Now only 1 remove button remains
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /remove/i })).toHaveLength(1);
    });
  });
});
