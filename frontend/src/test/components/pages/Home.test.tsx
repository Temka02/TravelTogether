import { render, screen, waitFor } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { Home } from "../../../app/components/pages/Home";
import { describe, it, expect, beforeEach } from "vitest";
import { apiClient } from "@/app/api/client";

const mockTrips = {
  success: true,
  data: [
    {
      _id: "1",
      title: "Trip 1",
      destination: "Paris",
      description: "Nice",
      price: 100,
      maxParticipants: 5,
      participants: [],
      difficulty: "easy",
      startDate: "2025-07-01",
      endDate: "2025-07-05",
      createdBy: { firstName: "John", lastName: "Doe" },
      status: "planning",
    },
  ],
  pagination: { total: 1, page: 1, limit: 9, pages: 1 },
};

describe("Home Page", () => {
  beforeEach(() => {
    (apiClient.getTrips as any).mockResolvedValue(mockTrips);
  });

  it("loads and displays trips", async () => {
    render(<Home />);
    expect(screen.getByText("Загрузка путешествий...")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Trip 1")).toBeInTheDocument());
    expect(screen.getByText("Paris")).toBeInTheDocument();
  });

  it("filters by search query", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await waitFor(() => expect(screen.getByText("Trip 1")).toBeInTheDocument());
    const searchInput = screen.getByPlaceholderText(/Поиск по названию/);
    await user.type(searchInput, "Trip");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(apiClient.getTrips).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Trip" }),
      ),
    );
  });

  it("changes sort order", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await waitFor(() => expect(screen.getByText("Trip 1")).toBeInTheDocument());
    const sortSelect = screen.getByRole("combobox");
    await user.click(sortSelect);
    await waitFor(() =>
      expect(screen.getByText("Цена: по возрастанию")).toBeInTheDocument(),
    );
    await user.click(screen.getByText("Цена: по возрастанию"));
    await waitFor(() =>
      expect(apiClient.getTrips).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: "price", order: "asc" }),
      ),
    );
  });

  it("shows empty message when no trips", async () => {
    (apiClient.getTrips as any).mockResolvedValue({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 9, pages: 1 },
    });
    render(<Home />);
    await waitFor(() =>
      expect(screen.getByText(/Путешествия не найдены/i)).toBeInTheDocument(),
    );
  });
});
