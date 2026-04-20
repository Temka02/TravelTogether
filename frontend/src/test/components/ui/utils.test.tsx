import { cn } from "../../../app/components/ui/utils";
import { describe, it, expect } from "vitest";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("foo", { bar: true, baz: false })).toBe("foo bar");
    expect(cn("px-2", "py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });
});
