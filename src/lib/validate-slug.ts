/**
 * Validate that a slug exists in the given set. Returns an error message
 * if invalid, or null if valid.
 */
export function validateSlug(
  slug: string,
  validSlugs: Set<string>,
  type: "lesson" | "exercise",
): string | null {
  if (!validSlugs.has(slug)) {
    return `Unknown ${type} slug: "${slug}"`;
  }
  return null;
}
