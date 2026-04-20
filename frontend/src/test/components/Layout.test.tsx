import { render, screen } from "../test-utils";
import { Layout } from "../../app/components/Layout";
import { describe, it, expect } from "vitest";

describe("Layout", () => {
  it("renders header and main", () => {
    render(<Layout />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
