import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AnimeCard } from "./AnimeCard";

const toggleWatchlist = vi.fn();

vi.mock("@/hooks/useWatchlistToggle", () => ({
  useWatchlistToggle: () => ({
    isInWatchlist: false,
    isPending: false,
    toggleWatchlist,
  }),
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("AnimeCard", () => {
  it("does not navigate when + watchlist button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <AnimeCard
                  anime={{
                    id: 99,
                    title: { english: "Samurai Champloo" },
                    coverImage: { large: "https://example.com/cover.jpg" },
                  }}
                />
                <LocationDisplay />
              </>
            }
          />
          <Route path="/anime/:id" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText("Add to watchlist"));

    expect(toggleWatchlist).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });
});
