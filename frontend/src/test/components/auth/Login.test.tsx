import { render, screen, waitFor } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { Login } from "../../../app/components/auth/Login";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { apiClient } from "@/app/api/client";

describe("Login", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("submits form with email and password", async () => {
    const user = userEvent.setup();
    (apiClient.login as any).mockResolvedValue({
      success: true,
      accessToken: "at",
      refreshToken: "rt",
      user: {},
    });
    (apiClient.getMe as any).mockResolvedValue({
      success: true,
      data: { _id: "1", email: "test@test.com", role: "user" },
    });

    render(<Login />);
    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/пароль/i), "password123");
    await user.click(screen.getByRole("button", { name: /войти/i }));
    await waitFor(() =>
      expect(apiClient.login).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      }),
    );
  });

  it("shows error on failed login", async () => {
    const user = userEvent.setup();
    (apiClient.login as any).mockRejectedValue({
      response: { data: { error: "Invalid credentials" } },
    });

    render(<Login />);
    await user.type(screen.getByLabelText(/email/i), "test@test.com");
    await user.type(screen.getByLabelText(/пароль/i), "wrong");
    await user.click(screen.getByRole("button", { name: /войти/i }));
    await waitFor(() =>
      expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument(),
    );
  });
});
