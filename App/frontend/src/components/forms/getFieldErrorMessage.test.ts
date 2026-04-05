import { describe, expect, it } from "vitest";

import { getFieldErrorMessage } from "./getFieldErrorMessage";

describe("getFieldErrorMessage", () => {
  it("returns a string error as-is", () => {
    expect(getFieldErrorMessage("Required field")).toBe("Required field");
  });

  it("returns message from an error-like object", () => {
    expect(getFieldErrorMessage({ message: "Invalid value" })).toBe(
      "Invalid value",
    );
  });

  it("returns null for values without a string message", () => {
    expect(getFieldErrorMessage({ message: 42 })).toBeNull();
    expect(getFieldErrorMessage(null)).toBeNull();
    expect(getFieldErrorMessage(undefined)).toBeNull();
  });
});
