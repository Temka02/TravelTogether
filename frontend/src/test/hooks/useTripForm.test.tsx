import { renderHook, act } from "@testing-library/react";
import { useTripForm } from "../../app/hooks/useTripForm";
import { apiClient } from "../../app/api/client";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../app/api/client", () => ({
  apiClient: {
    createTrip: vi.fn(),
    updateTrip: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useNavigate: () => mockNavigate,
}));

describe("useTripForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates required fields", () => {
    const { result } = renderHook(() => useTripForm({}));
    act(() => {
      result.current.setTitle("");
      result.current.setDestination("");
      result.current.setDescription("");
      result.current.setPrice("");
      result.current.setStartDate("");
      result.current.setEndDate("");
    });
    act(() => {
      result.current.validate();
    });
    expect(result.current.errors.title).toBeDefined();
    expect(result.current.errors.destination).toBeDefined();
    expect(result.current.errors.description).toBeDefined();
    expect(result.current.errors.price).toBeDefined();
    expect(result.current.errors.startDate).toBeDefined();
    expect(result.current.errors.endDate).toBeDefined();
  });

  it("validates price > 0", () => {
    const { result } = renderHook(() => useTripForm({}));
    act(() => {
      result.current.setPrice("0");
    });
    act(() => {
      result.current.validate();
    });
    expect(result.current.errors.price).toBe("Цена должна быть больше 0");
  });

  it("validates maxParticipants range", () => {
    const { result } = renderHook(() => useTripForm({}));
    act(() => {
      result.current.setMaxParticipants(0);
    });
    act(() => {
      result.current.validate();
    });
    expect(result.current.errors.maxParticipants).toBe("От 1 до 50 участников");
  });

  it("submits create trip successfully", async () => {
    (apiClient.createTrip as any).mockResolvedValue({
      success: true,
      data: { _id: "123" },
    });
    const { result } = renderHook(() => useTripForm({}));
    act(() => {
      result.current.setTitle("Trip");
      result.current.setDestination("Paris");
      result.current.setDescription("Nice");
      result.current.setPrice("100");
      result.current.setMaxParticipants(5);
      result.current.setStartDate("2025-08-01");
      result.current.setEndDate("2025-08-10");
    });
    await act(async () => {
      await result.current.submit();
    });
    expect(apiClient.createTrip).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Trip",
        destination: "Paris",
        price: 100,
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/trips/123");
  });

  it("submits edit trip successfully", async () => {
    (apiClient.updateTrip as any).mockResolvedValue({
      success: true,
      data: { _id: "123" },
    });
    const { result } = renderHook(() =>
      useTripForm({
        isEdit: true,
        tripId: "123",
        initialData: { title: "Old" },
      }),
    );
    act(() => {
      result.current.setTitle("Updated");
      result.current.setDestination("Paris");
      result.current.setDescription("Nice");
      result.current.setPrice("100");
      result.current.setMaxParticipants(5);
      result.current.setStartDate("2025-08-01");
      result.current.setEndDate("2025-08-10");
    });
    await act(async () => {
      await result.current.submit();
    });
    expect(apiClient.updateTrip).toHaveBeenCalledWith(
      "123",
      expect.objectContaining({ title: "Updated" }),
    );
  });
});
