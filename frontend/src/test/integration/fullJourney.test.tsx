import { render, screen, waitFor, fireEvent } from "../test-utils";
import userEvent from "@testing-library/user-event";
import App from "../../app/App";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "@/app/api/client";

describe.skip("Full user journey", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (apiClient.isAuthenticated as any).mockReturnValue(false);
    (apiClient.getMe as any).mockResolvedValue({ success: true, data: null });
  });

  it("logs in, creates a trip, and views it", async () => {
    const user = userEvent.setup();

    (apiClient.login as any).mockResolvedValue({
      success: true,
      accessToken: "at",
      refreshToken: "rt",
      user: { _id: "1", email: "user@test.com", role: "user" },
    });
    (apiClient.getMe as any).mockResolvedValue({
      success: true,
      data: {
        _id: "1",
        email: "user@test.com",
        firstName: "John",
        lastName: "Doe",
        role: "user",
        tripsAsOrganizer: 0,
        tripsAsParticipant: 0,
        skills: [],
      },
    });
    (apiClient.getTrips as any).mockResolvedValue({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 9, pages: 1 },
    });
    (apiClient.createTrip as any).mockResolvedValue({
      success: true,
      data: { _id: "trip123", title: "My Trip" },
    });

    render(<App />, { noRouter: true });

    // Логин
    await user.click(screen.getByText("Войти"));
    await user.type(screen.getByLabelText(/email/i), "user@test.com");
    await user.type(screen.getByLabelText(/пароль/i), "pass123");
    await user.click(screen.getByRole("button", { name: /войти/i }));
    await waitFor(() =>
      expect(screen.getByText("John Doe")).toBeInTheDocument(),
    );

    // Переход к созданию поездки
    const createLink = await screen.findByText(
      /Организуйте свое путешествие!/i,
    );
    await user.click(createLink);

    // Заполнение формы
    await user.type(screen.getByTestId("title-input"), "My Trip");
    await user.type(screen.getByTestId("destination-input"), "Paris");
    await user.type(screen.getByTestId("description-input"), "Nice trip");

    // Для полей number и date – используем fireEvent.change (работает без clear)
    const priceInput = screen.getByTestId("price-input");
    fireEvent.change(priceInput, { target: { value: "100" } });

    const participantsInput = screen.getByTestId("max-participants-input");
    fireEvent.change(participantsInput, { target: { value: "5" } });

    const startDateInput = screen.getByTestId("start-date-input");
    fireEvent.change(startDateInput, { target: { value: "2025-08-01" } });

    const endDateInput = screen.getByTestId("end-date-input");
    fireEvent.change(endDateInput, { target: { value: "2025-08-10" } });

    await user.click(screen.getByTestId("submit-button"));

    await waitFor(() =>
      expect(apiClient.createTrip).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "My Trip",
          destination: "Paris",
          price: 100,
        }),
      ),
    );
  });
});
