import { render, screen } from "../../test-utils";
import { Button } from "../../../app/components/ui/button";
import { describe, it, expect } from "vitest";

describe("Button", () => {
  it("renders with default variant", () => {
    render(<Button>Click</Button>);
    const button = screen.getByRole("button", { name: "Click" });
    expect(button).toBeInTheDocument();
  });
});
