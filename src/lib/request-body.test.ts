import { describe, expect, it } from "vitest";
import { completionTarget, parseJsonObject, undoTarget } from "./request-body";

function req(body: string): Request {
  return new Request("https://example.com", { method: "PUT", body });
}

describe("parseJsonObject", () => {
  it("accepts a JSON object", async () => {
    const r = await parseJsonObject(req('{"a":1}'));
    expect(r).toEqual({ ok: true, body: { a: 1 } });
  });

  it.each([
    "null",
    "42",
    '"str"',
    "[1,2]",
    "true",
  ])("rejects non-object JSON %s", async (raw) => {
    const r = await parseJsonObject(req(raw));
    expect(r).toEqual({ ok: false, error: "JSON body must be an object" });
  });

  it("rejects invalid JSON", async () => {
    const r = await parseJsonObject(req("{nope"));
    expect(r).toEqual({ ok: false, error: "Invalid JSON body" });
  });
});

describe("completionTarget", () => {
  it("picks a lesson", () => {
    expect(completionTarget({ lessonSlug: "skills" })).toEqual({
      ok: true,
      kind: "lesson",
      slug: "skills",
    });
  });

  it("picks an exercise", () => {
    expect(completionTarget({ exerciseSlug: "build-a-website" })).toEqual({
      ok: true,
      kind: "exercise",
      slug: "build-a-website",
    });
  });

  it("rejects both slugs", () => {
    const r = completionTarget({
      lessonSlug: "interview",
      exerciseSlug: "build-a-website",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects missing or empty slugs", () => {
    expect(completionTarget({}).ok).toBe(false);
    expect(completionTarget({ lessonSlug: "" }).ok).toBe(false);
    expect(completionTarget({ lessonSlug: 3 }).ok).toBe(false);
  });
});

describe("undoTarget", () => {
  it("accepts reset alone", () => {
    expect(undoTarget({ reset: true })).toEqual({ ok: true, kind: "reset" });
  });

  it("accepts a single slug", () => {
    expect(undoTarget({ exerciseSlug: "automate-ci" })).toEqual({
      ok: true,
      kind: "exercise",
      slug: "automate-ci",
    });
  });

  it("rejects more than one target", () => {
    expect(undoTarget({ reset: true, lessonSlug: "skills" }).ok).toBe(false);
    expect(
      undoTarget({ lessonSlug: "skills", exerciseSlug: "automate-ci" }).ok,
    ).toBe(false);
  });

  it("rejects an empty body", () => {
    expect(undoTarget({}).ok).toBe(false);
    expect(undoTarget({ reset: "yes" }).ok).toBe(false);
  });
});
