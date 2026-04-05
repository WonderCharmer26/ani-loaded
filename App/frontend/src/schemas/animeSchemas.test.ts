import { describe, expect, it } from "vitest";

import { getDisplayTitle } from "./animeSchemas";

describe("getDisplayTitle", () => {
  it("prefers english title first", () => {
    expect(
      getDisplayTitle({ english: "English", romaji: "Romaji", native: "Native" }),
    ).toBe("English");
  });

  it("falls back to romaji when english is missing", () => {
    expect(getDisplayTitle({ romaji: "Romaji", native: "Native" })).toBe(
      "Romaji",
    );
  });

  it("falls back to native when english and romaji are missing", () => {
    expect(getDisplayTitle({ native: "Native" })).toBe("Native");
  });

  it("returns empty string when all title fields are missing", () => {
    expect(getDisplayTitle({})).toBe("");
  });
});
