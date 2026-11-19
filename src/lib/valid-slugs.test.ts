import { describe, expect, it } from "vitest";
import { validateSlug } from "./validate-slug";

describe("validateSlug", () => {
  const slugs = new Set(["installation", "skills"]);

  it("returns null for a known slug", () => {
    expect(validateSlug("skills", slugs, "lesson")).toBeNull();
  });

  it("names the kind and slug in the error", () => {
    expect(validateSlug("enrollment", slugs, "lesson")).toBe(
      'Unknown lesson slug: "enrollment"',
    );
    expect(validateSlug("nope", slugs, "exercise")).toBe(
      'Unknown exercise slug: "nope"',
    );
  });
});
