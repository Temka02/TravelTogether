import { render, screen, waitFor } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import Applications from "../../../app/components/pages/Applications";
import { describe, it, expect, beforeEach } from "vitest";

import { apiClient } from "@/app/api/client";

const mockIncoming = [
  {
    _id: "app1",
    status: "pending",
    tripId: { title: "Trip A", destination: "City" },
    userId: { firstName: "User", lastName: "A" },
  },
];

describe("Applications", () => {
  beforeEach(() => {
    (apiClient.isAuthenticated as any).mockReturnValue(true);
    (apiClient.getApplicationsToMyTrips as any).mockResolvedValue({
      success: true,
      data: mockIncoming,
    });
    (apiClient.getMyApplications as any).mockResolvedValue({
      success: true,
      data: [],
    });
    (apiClient.getMe as any).mockResolvedValue({
      success: true,
      data: { _id: "1", role: "organizer" },
    });
  });

  it("displays incoming applications", async () => {
    render(<Applications />);
    await waitFor(() => expect(screen.getByText("Trip A")).toBeInTheDocument());
    expect(screen.getByText("User A")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Принять/ })).toBeInTheDocument();
  });

  it("accepts application", async () => {
    const user = userEvent.setup();
    (apiClient.acceptApplication as any).mockResolvedValue({ success: true });
    render(<Applications />);
    await waitFor(() => expect(screen.getByText("Trip A")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Принять/ }));
    await waitFor(() =>
      expect(apiClient.acceptApplication).toHaveBeenCalledWith("app1"),
    );
  });

  it("rejects application", async () => {
    const user = userEvent.setup();
    (apiClient.rejectApplication as any).mockResolvedValue({ success: true });
    render(<Applications />);
    await waitFor(() => expect(screen.getByText("Trip A")).toBeInTheDocument());
    const rejectButton = screen.getByRole("button", { name: /Отклонить/i });
    await user.click(rejectButton);
    await waitFor(() =>
      expect(apiClient.rejectApplication).toHaveBeenCalledWith("app1"),
    );
  });
});
