import { render, screen, waitFor } from "../../test-utils";
import { MemoryRouter, Route, Routes } from "react-router";
import EditTrip from "../../../app/components/pages/EditTrip";
import { apiClient } from "@/app/api/client";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/api/client", () => ({
  apiClient: {
    getTripById: vi.fn(),
    updateTrip: vi.fn(),
    isAuthenticated: vi.fn(() => true),
    getMe: vi.fn(() =>
      Promise.resolve({ success: true, data: { _id: "1", role: "user" } }),
    ),
  },
}));

describe.skip("EditTrip", () => {
  beforeEach(() => {
    (apiClient.getTripById as any).mockResolvedValue({
      success: true,
      data: {
        _id: "123",
        title: "Test Trip",
        destination: "Test",
        description: "Desc",
        price: 100,
        maxParticipants: 5,
        startDate: "2025-08-01",
        endDate: "2025-08-10",
        difficulty: "medium",
        createdBy: "1",
        participants: [],
        status: "planning",
      },
    });
    (apiClient.updateTrip as any).mockResolvedValue({
      success: true,
      data: { _id: "123" },
    });
  });

  it("renders edit form with trip data", async () => {
    render(
      <MemoryRouter initialEntries={["/trips/edit-trip/123"]}>
        <Routes>
          <Route path="/trips/edit-trip/:id" element={<EditTrip />} />
        </Routes>
      </MemoryRouter>,
      { noRouter: true },
    );
    // Ждём появления значения в поле title
    await waitFor(
      () => {
        expect(screen.getByDisplayValue("Test Trip")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Desc")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Сохранить изменения/i }),
    ).toBeInTheDocument();
  });

  it("submits edit form with updated data", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/trips/edit-trip/123"]}>
        <Routes>
          <Route path="/trips/edit-trip/:id" element={<EditTrip />} />
        </Routes>
      </MemoryRouter>,
      { noRouter: true },
    );
    await waitFor(
      () => {
        expect(screen.getByDisplayValue("Test Trip")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    const titleInput = screen.getByTestId("title-input");
    // Очищаем поле и вводим новое значение
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Trip");

    const submitButton = screen.getByTestId("submit-button");
    await user.click(submitButton);

    await waitFor(() =>
      expect(apiClient.updateTrip).toHaveBeenCalledWith(
        "123",
        expect.objectContaining({ title: "Updated Trip" }),
      ),
    );
  });
});
