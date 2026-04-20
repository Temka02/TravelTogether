import { render, screen, waitFor } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { TripDetail } from "../../../app/components/pages/TripDetail";
import { describe, it, expect, beforeEach } from "vitest";
import { apiClient } from "@/app/api/client";

const mockTrip = {
  success: true,
  data: {
    _id: "123",
    title: "Mountain Trip",
    description: "Adventure",
    destination: "Alps",
    price: 500,
    maxParticipants: 10,
    participants: [],
    difficulty: "hard",
    startDate: "2025-08-01",
    endDate: "2025-08-10",
    createdBy: { _id: "org1", firstName: "Guide", lastName: "Smith" },
    status: "planning",
  },
};

describe("TripDetail", () => {
  beforeEach(() => {
    (apiClient.getTripById as any).mockResolvedValue(mockTrip);
    (apiClient.checkApplication as any).mockResolvedValue({
      success: true,
      data: null,
    });
    (apiClient.getWeather as any).mockResolvedValue({
      success: true,
      data: { temp: 22, description: "sunny", icon: "01d", city: "Alps" },
    });
    (apiClient.getMe as any).mockResolvedValue({
      success: true,
      data: {
        _id: "user1",
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        role: "user",
      },
    });
    (apiClient.isAuthenticated as any).mockReturnValue(true);
  });

  it("displays trip details", async () => {
    render(
      <MemoryRouter initialEntries={["/trips/123"]}>
        <Routes>
          <Route path="/trips/:id" element={<TripDetail />} />
        </Routes>
      </MemoryRouter>,
      { noRouter: true },
    );
    await waitFor(() =>
      expect(screen.getByText("Mountain Trip")).toBeInTheDocument(),
    );
    expect(screen.getByText("Alps")).toBeInTheDocument();
    expect(screen.getByText("500 ₽")).toBeInTheDocument();
  });

  it("allows user to apply", async () => {
    const user = userEvent.setup();
    (apiClient.createApplication as any).mockResolvedValue({
      success: true,
      data: {},
    });

    render(
      <MemoryRouter initialEntries={["/trips/123"]}>
        <Routes>
          <Route path="/trips/:id" element={<TripDetail />} />
        </Routes>
      </MemoryRouter>,
      { noRouter: true },
    );
    await waitFor(() =>
      expect(screen.getByText("Mountain Trip")).toBeInTheDocument(),
    );
    const textarea = screen.getByPlaceholderText(/Сообщение для организатора/);
    await user.type(textarea, "Take me!");
    const applyButton = screen.getByRole("button", { name: /Подать заявку/ });
    await user.click(applyButton);
    await waitFor(() =>
      expect(apiClient.createApplication).toHaveBeenCalledWith(
        "123",
        "Take me!",
      ),
    );
  });

  it("shows weather info", async () => {
    render(
      <MemoryRouter initialEntries={["/trips/123"]}>
        <Routes>
          <Route path="/trips/:id" element={<TripDetail />} />
        </Routes>
      </MemoryRouter>,
      { noRouter: true },
    );
    await waitFor(() =>
      expect(screen.getByText(/Погода в городе/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/22°C/)).toBeInTheDocument();
  });
});
