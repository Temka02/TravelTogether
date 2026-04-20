import { render, screen, waitFor } from "../../test-utils";
import { act } from "react";
import { ImageWithFallback } from "../../../app/components/figma/ImageWithFallback";
import { describe, it, expect } from "vitest";

describe("ImageWithFallback", () => {
  it("renders image with correct src", () => {
    render(<ImageWithFallback src="test.jpg" alt="Test" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "test.jpg");
    expect(img).toHaveAttribute("alt", "Test");
  });

  it("shows fallback on error", async () => {
    render(<ImageWithFallback src="broken.jpg" alt="Broken" />);
    const img = screen.getByRole("img");
    act(() => {
      img.dispatchEvent(new Event("error"));
    });
    await waitFor(() => {
      // После ошибки компонент перерисовывается, ищем новый img
      const fallbackImg = screen.getByRole("img");
      expect(fallbackImg.getAttribute("src")).toContain("data:image/svg+xml");
    });
  });
});
