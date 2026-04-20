import { render, waitFor } from "../test-utils";
import { SEO } from "../../app/components/SEO";
import { describe, it, expect } from "vitest";

describe("SEO", () => {
  it("sets meta tags correctly", async () => {
    render(
      <SEO
        title="Test Page"
        description="Test description"
        canonicalUrl="/test"
        ogImage="https://example.com/og.jpg"
        type="article"
      />,
    );

    await waitFor(() => {
      expect(document.title).toBe("Test Page | TravelTogether");

      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      expect(metaDescription).toHaveAttribute("content", "Test description");

      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical).toHaveAttribute(
        "href",
        expect.stringContaining("/test"),
      );

      const ogTitle = document.querySelector('meta[property="og:title"]');
      expect(ogTitle).toHaveAttribute("content", "Test Page | TravelTogether");

      const ogDescription = document.querySelector(
        'meta[property="og:description"]',
      );
      expect(ogDescription).toHaveAttribute("content", "Test description");

      const ogImage = document.querySelector('meta[property="og:image"]');
      expect(ogImage).toHaveAttribute("content", "https://example.com/og.jpg");
    });
  });
});
