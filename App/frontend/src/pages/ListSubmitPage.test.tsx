import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AniListMedia } from "@/schemas/animeSchemas";
import ListSubmitPage from "@/pages/ListSubmitPage";
import { getAvailableGenres } from "@/services/api/animeCategoriesService";
import { postUserList } from "@/services/api/userListsService";
import { supabase } from "@/services/supabase/supabaseConnection";
import { toast } from "sonner";
import { vi, describe, it, expect, beforeEach } from "vitest";

const mockNavigate = vi.fn();
let mockAnimeId = 101;

// navigation mock
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// mock for genre func
vi.mock("@/services/api/animeCategoriesService", () => ({
  getAvailableGenres: vi.fn(),
}));

// mock for post func
vi.mock("@/services/api/userListsService", () => ({
  postUserList: vi.fn(),
}));

// session token mock
vi.mock("@/services/supabase/supabaseConnection", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// mock for toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// modal mock
vi.mock("@/components/forms/ListAnimeSearchModal", () => ({
  default: ({
    isOpen,
    onAdd,
    onClose,
  }: {
    isOpen: boolean;
    onAdd: (anime: AniListMedia) => void;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;

    return (
      <button
        type="button"
        onClick={() => {
          onAdd({
            id: mockAnimeId,
            title: { english: `Mock Anime ${mockAnimeId}` },
            coverImage: { large: "https://example.com/cover.jpg" },
          });
          mockAnimeId += 1;
          onClose();
        }}
      >
        Add mock anime
      </button>
    );
  },
}));

// test render
function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // app simulation
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ListSubmitPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

async function addEntries(count: number) {
  const user = userEvent.setup();
  for (let i = 0; i < count; i += 1) {
    await user.click(screen.getByRole("button", { name: /add anime/i }));
    await user.click(screen.getByRole("button", { name: /add mock anime/i }));
  }
}

describe("ListSubmitPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnimeId = 101;

    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });

    vi.mocked(getAvailableGenres).mockResolvedValue(["Action", "Drama"]);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
    vi.mocked(postUserList).mockResolvedValue({
      id: "list-id",
      title: "My List",
      genre: "Action",
      description: "desc",
      visibility: "public",
      owner_username: "tester",
      user_list_entry: [],
    });
  });

  it("renders initial state with disabled submit", async () => {
    renderPage();

    expect(
      await screen.findByText(/Add at least 5 anime to submit your list/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit list/i })).toBeDisabled();
  });

  it("enables submit after title and minimum entries are provided", async () => {
    renderPage();
    const user = userEvent.setup();

    await addEntries(5);
    await user.type(screen.getByLabelText(/list title/i), "Top picks");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /submit list/i }),
      ).toBeEnabled();
    });
  });

  it("shows toast when session validation fails", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: { message: "session failed" },
    });

    renderPage();
    const user = userEvent.setup();

    await addEntries(5);
    await user.type(screen.getByLabelText(/list title/i), "Top picks");
    await user.click(screen.getByRole("button", { name: /submit list/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Unable to validate your session. Please try again.",
      );
    });
  });

  it("shows sign-in toast when token is missing", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    renderPage();
    const user = userEvent.setup();

    await addEntries(5);
    await user.type(screen.getByLabelText(/list title/i), "Top picks");
    await user.click(screen.getByRole("button", { name: /submit list/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please sign in to submit a list.",
      );
    });
  });

  it("submits payload and navigates on success", async () => {
    renderPage();
    const user = userEvent.setup();

    await addEntries(5);
    await user.type(screen.getByLabelText(/list title/i), "Top picks");

    await user.click(screen.getByRole("button", { name: /select genre/i }));
    await user.click(screen.getByRole("button", { name: "Action" }));

    await user.click(screen.getByRole("button", { name: /private/i }));
    await user.type(
      screen.getByLabelText(/description/i),
      "These are my favorite anime.",
    );

    await user.click(screen.getByRole("button", { name: /submit list/i }));

    await waitFor(() => {
      expect(postUserList).toHaveBeenCalledWith(
        {
          title: "Top picks",
          genre: "Action",
          description: "These are my favorite anime.",
          visibility: "private",
          amount: 5,
          entries: [
            { anime_id: 101, rank: 1 },
            { anime_id: 102, rank: 2 },
            { anime_id: 103, rank: 3 },
            { anime_id: 104, rank: 4 },
            { anime_id: 105, rank: 5 },
          ],
        },
        "test-token",
      );
    });

    expect(toast.success).toHaveBeenCalledWith("Your list has been created.");
    expect(mockNavigate).toHaveBeenCalledWith("/lists");
  });

  it("shows toast when submission request fails", async () => {
    vi.mocked(postUserList).mockRejectedValueOnce(new Error("Network down"));

    renderPage();
    const user = userEvent.setup();

    await addEntries(5);
    await user.type(screen.getByLabelText(/list title/i), "Top picks");
    await user.click(screen.getByRole("button", { name: /submit list/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "List submission failed: Error: Network down",
      );
    });
  });

  it("enforces the 250-word description limit", async () => {
    renderPage();

    const textarea = screen.getByLabelText(/description/i);
    const words250 = new Array(250).fill("word").join(" ");
    const words251 = new Array(251).fill("word").join(" ");

    fireEvent.change(textarea, { target: { value: words250 } });
    expect(textarea).toHaveValue(words250);
    expect(screen.getByText("250 / 250 words")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: words251 } });
    expect(textarea).toHaveValue(words250);
    expect(screen.getByText("250 / 250 words")).toBeInTheDocument();
  });
});
