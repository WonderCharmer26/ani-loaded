import { describe, expect, it } from "vitest";

import {
  UserWatchlistRequestSchema,
  UserWatchlistStatusUpdateRequestSchema,
} from "./userWatchlistSchema";

describe("userWatchlistSchema", () => {
  it("accepts valid watchlist status values", () => {
    const payload = {
      anime_id: 100,
      title: "Attack on Titan",
      genres: ["Action", "Drama"],
      status: "completed",
    };

    expect(UserWatchlistRequestSchema.parse(payload)).toEqual(payload);
  });

  it("rejects invalid watchlist status values", () => {
    expect(() =>
      UserWatchlistStatusUpdateRequestSchema.parse({ status: "queued" }),
    ).toThrow();
  });

  it("rejects non-string genres", () => {
    expect(() =>
      UserWatchlistRequestSchema.parse({
        anime_id: 100,
        title: "Attack on Titan",
        genres: ["Action", 123],
        status: "watching",
      }),
    ).toThrow();
  });
});
