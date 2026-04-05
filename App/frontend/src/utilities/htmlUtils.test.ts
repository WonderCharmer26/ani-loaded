import { describe, expect, it } from "vitest";

import { sanitizeHtml } from "./htmlUtils";

describe("sanitizeHtml", () => {
  it("strips unsafe tags and attributes", () => {
    const dirty =
      '<img src="x" onerror="alert(1)"><script>alert(1)</script><b onclick="evil()">Safe</b><i>Text</i>';

    const clean = sanitizeHtml(dirty);

    expect(clean).not.toContain("script");
    expect(clean).not.toContain("img");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("onclick");
    expect(clean).toContain("<b>Safe</b>");
    expect(clean).toContain("<i>Text</i>");
  });

  it("keeps allowed formatting tags", () => {
    const input = "<strong>Bold</strong><br><em>Italic</em>";
    const clean = sanitizeHtml(input);

    expect(clean).toBe("<strong>Bold</strong><br><em>Italic</em>");
  });
});
