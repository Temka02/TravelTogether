import { render, screen, waitFor } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import MyTrips from "../../../app/components/pages/MyTrips";
import { apiClient } from "@/app/api/client";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/client", () => ({
  apiClient: {
    getTrips: vi.fn(),
    isAuthenticated: vi.fn(() => true),
    getMe: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: {
          _id: "1",
          organizedTrips: ["trip1"],
          joinedTrips: ["trip2"],
        },
      }),
    ),
  },
}));

describe("MyTrips", () => {
  beforeEach(() => {
    (apiClient.getTrips as any).mockResolvedValue({
      success: true,
      data: [
        {
          _id: "trip1",
          title: "Organized Trip",
          destination: "Place1",
          startDate: "2025-08-01",
          endDate: "2025-08-10",
          maxParticipants: 5,
          participants: [],
          difficulty: "hard",
        },
        {
          _id: "trip2",
          title: "Joined Trip",
          destination: "Place2",
          startDate: "2025-08-01",
          endDate: "2025-08-10",
          maxParticipants: 5,
          participants: [],
          difficulty: "easy",
        },
      ],
      pagination: { total: 2, page: 1, limit: 10, pages: 1 },
    });
  });

  it("displays organized and joined trips", async () => {
    const user = userEvent.setup();
    render(<MyTrips />);

    // Проверяем организованную поездку
    await waitFor(() =>
      expect(screen.getByText("Organized Trip")).toBeInTheDocument(),
    );

    // Переключаемся на вкладку "Участие"
    const participationTab = screen.getByRole("tab", { name: /Участие/i });
    await user.click(participationTab);

    // Ждём появления поездки, в которой пользователь участвует
    await waitFor(() =>
      expect(screen.getByText("Joined Trip")).toBeInTheDocument(),
    );
  });
});
