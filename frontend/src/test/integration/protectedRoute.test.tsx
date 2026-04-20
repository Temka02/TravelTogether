import { render, waitFor } from "../test-utils";
import { MemoryRouter } from "react-router";
import { Profile } from "../../app/components/pages/Profile";
import { apiClient } from "@/app/api/client";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useNavigate: () => mockNavigate,
}));

describe("Protected route redirect (integration)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (apiClient.isAuthenticated as any).mockReturnValue(false);
    (apiClient.getMe as any).mockResolvedValue({ success: true, data: null });
  });

  it("redirects to login when accessing Profile without token", async () => {
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Profile />
      </MemoryRouter>,
      { noRouter: true },
    );
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});
