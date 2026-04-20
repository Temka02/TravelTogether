import { render, screen, waitFor } from "../test-utils";
import userEvent from "@testing-library/user-event";
import { useAuth } from "../../app/contexts/AuthContext";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { apiClient } from "@/app/api/client";

const TestComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="user">{user?.email}</span>
      <button onClick={() => login({ email: "a@a.com", password: "p" })}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads user from token on mount", async () => {
    localStorage.setItem("accessToken", "token");
    (apiClient.isAuthenticated as any).mockReturnValue(true); // добавить
    (apiClient.getMe as any).mockResolvedValue({
      success: true,
      data: { _id: "1", email: "test@test.com", role: "user" },
    });
    render(<TestComponent />);
    await waitFor(() => expect(apiClient.getMe).toHaveBeenCalled());
    expect(screen.getByTestId("auth")).toHaveTextContent("yes");
    expect(screen.getByTestId("user")).toHaveTextContent("test@test.com");
  });

  it("logs in successfully", async () => {
    (apiClient.isAuthenticated as any).mockReturnValue(false);
    const user = userEvent.setup();
    (apiClient.login as any).mockResolvedValue({
      success: true,
      accessToken: "at",
      refreshToken: "rt",
      user: { _id: "1", email: "a@a.com" },
    });
    (apiClient.getMe as any).mockResolvedValue({
      success: true,
      data: { _id: "1", email: "a@a.com", role: "user" },
    });
    render(<TestComponent />);
    await user.click(screen.getByText("login"));
    await waitFor(() =>
      expect(screen.getByTestId("auth")).toHaveTextContent("yes"),
    );
    expect(apiClient.login).toHaveBeenCalledWith({
      email: "a@a.com",
      password: "p",
    });
  });

  it("logs out", async () => {
    const user = userEvent.setup();
    localStorage.setItem("accessToken", "token");
    (apiClient.isAuthenticated as any).mockReturnValue(true); // добавить
    (apiClient.getMe as any).mockResolvedValue({
      success: true,
      data: { _id: "1", email: "test@test.com", role: "user" },
    });
    render(<TestComponent />);
    await waitFor(() =>
      expect(screen.getByTestId("auth")).toHaveTextContent("yes"),
    );
    await user.click(screen.getByText("logout"));
    expect(apiClient.logout).toHaveBeenCalled();
    expect(screen.getByTestId("auth")).toHaveTextContent("no");
  });
});
