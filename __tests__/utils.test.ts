import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("combines multiple CSS classes", () => {
    expect(cn("flex", "items-center")).toBe(
      "flex items-center"
    );
  });

  it("merges conflicting Tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores false and undefined values", () => {
    expect(cn("flex", false, undefined)).toBe(
      "flex"
    );
  });

  it("returns an empty string without arguments", () => {
    expect(cn()).toBe("");
  });
});