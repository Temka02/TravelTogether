import { render, screen } from "../test-utils";
import { Header } from "../../app/components/Header";
import { describe, it, expect, beforeEach } from "vitest";

import { apiClient } from "@/app/api/client";

describe("Header", () => {
  beforeEach(() => {
    (apiClient.isAuthenticated as any).mockReturnValue(false);
  });

  it("shows login/register when not authenticated", () => {
    render(<Header />);
    expect(screen.getByText("Войти")).toBeInTheDocument();
    expect(screen.getByText("Регистрация")).toBeInTheDocument();
  });

  it("shows user menu when authenticated", async () => {
    (apiClient.isAuthenticated as any).mockReturnValue(true);
    (apiClient.getMe as any).mockResolvedValue({
      success: true,
      data: {
        firstName: "John",
        lastName: "Doe",
        role: "user",
        email: "john@doe.com",
      },
    });
    render(<Header />);
    await screen.findByText("John Doe");
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
