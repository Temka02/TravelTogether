import { render, screen } from "../../test-utils";
import CreateTrip from "../../../app/components/pages/CreateTrip";
import { describe, it, expect } from "vitest";

describe("CreateTrip", () => {
  it("renders all form fields", () => {
    render(<CreateTrip />);
    expect(screen.getByTestId("title-input")).toBeInTheDocument();
    expect(screen.getByTestId("destination-input")).toBeInTheDocument();
    expect(screen.getByTestId("description-input")).toBeInTheDocument();
    expect(screen.getByTestId("difficulty-select")).toBeInTheDocument();
    expect(screen.getByTestId("price-input")).toBeInTheDocument();
    expect(screen.getByTestId("max-participants-input")).toBeInTheDocument();
    expect(screen.getByTestId("start-date-input")).toBeInTheDocument();
    expect(screen.getByTestId("end-date-input")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
  });
});
