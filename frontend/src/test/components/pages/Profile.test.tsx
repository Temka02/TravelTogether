import { render, screen, waitFor } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import { Profile } from "../../../app/components/pages/Profile";
import { describe, it, expect, beforeEach } from "vitest";
import { apiClient } from "@/app/api/client";

const mockUser = {
  _id: "1",
  email: "user@test.com",
  firstName: "John",
  lastName: "Doe",
  role: "user",
  tripsAsOrganizer: 2,
  tripsAsParticipant: 3,
  skills: ["hiking", "swimming"],
  mainSkills: ["hiking"],
  allergies: [],
  medicalConditions: [],
  dietaryRestrictions: [],
};

describe("Profile", () => {
  beforeEach(() => {
    (apiClient.isAuthenticated as any).mockReturnValue(true);
    (apiClient.getMe as any).mockResolvedValue({
      success: true,
      data: mockUser,
    });
    (apiClient.getAvatar as any).mockResolvedValue({
      success: true,
      avatarUrl: null,
    });
  });

  it("displays user info", async () => {
    render(<Profile />);
    await waitFor(() =>
      expect(screen.getByText("John Doe")).toBeInTheDocument(),
    );
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("uploads avatar", async () => {
    const file = new File(["dummy"], "avatar.png", { type: "image/png" });
    (apiClient.uploadAvatar as any).mockResolvedValue({
      success: true,
      avatarUrl: "http://example.com/avatar.png",
    });
    render(<Profile />);
    await waitFor(() =>
      expect(screen.getByText("John Doe")).toBeInTheDocument(),
    );
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    await userEvent.upload(fileInput, file);
    await waitFor(() =>
      expect(apiClient.uploadAvatar).toHaveBeenCalledWith(file),
    );
  });

  it("renders edit button", async () => {
    render(<Profile />);
    await waitFor(() =>
      expect(screen.getByText("John Doe")).toBeInTheDocument(),
    );
    const editButton = screen.getByRole("button", {
      name: /Редактировать профиль/i,
    });
    expect(editButton).toBeInTheDocument();
  });
});
