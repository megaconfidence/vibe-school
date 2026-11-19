import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Astro turns every file under src/pages into a public route, so a test file
// there would ship to production and pull Vitest into the Worker bundle.
describe("src/pages", () => {
  it("holds no test files", () => {
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(entry)) found.push(full);
      }
    };
    walk("src/pages");
    expect(found).toEqual([]);
  });
});
