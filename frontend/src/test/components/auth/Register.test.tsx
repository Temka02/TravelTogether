import { render, screen, waitFor } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { Register } from "../../../app/components/auth/Register";
import { apiClient } from "@/app/api/client";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/app/api/client", () => ({
  apiClient: {
    register: vi.fn(),
    isAuthenticated: vi.fn(),
    getMe: vi.fn(),
  },
}));

describe("Register", () => {
  beforeEach(() => {
    (apiClient.register as any).mockResolvedValue({
      success: true,
      accessToken: "at",
      refreshToken: "rt",
      user: {},
    });
    (apiClient.getMe as any).mockResolvedValue({
      success: true,
      data: { _id: "1", email: "test@test.com", role: "user" },
    });
  });

  it("renders registration form", () => {
    render(<Register />);
    expect(screen.getByText(/Создать аккаунт/i)).toBeInTheDocument();
  });

  it("submits registration form", async () => {
    const user = userEvent.setup();
    render(<Register />);
    await user.type(screen.getByLabelText(/Имя/i), "John");
    await user.type(screen.getByLabelText(/Фамилия/i), "Doe");
    await user.type(screen.getByLabelText(/Email/i), "john@example.com");
    await user.type(screen.getByLabelText(/Пароль/i), "password123");
    await user.click(
      screen.getByRole("button", { name: /Зарегистрироваться/i }),
    );
    await waitFor(() =>
      expect(apiClient.register).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          password: "password123",
        }),
      ),
    );
  });
});
