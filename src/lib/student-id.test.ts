import { describe, expect, it } from "vitest";
import { generateStudentId, isValidStudentId } from "./student-id";

describe("generateStudentId", () => {
  it("produces an adjective-noun-nnnn id", async () => {
    const id = await generateStudentId();
    expect(isValidStudentId(id)).toBe(true);
  });

  it("produces different ids across calls", async () => {
    const ids = new Set(
      await Promise.all(Array.from({ length: 20 }, () => generateStudentId())),
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  it("retries on collision when a kv namespace is provided", async () => {
    // The first two candidates collide, the third is free.
    let calls = 0;
    const kv = {
      get: async () => {
        calls++;
        return calls <= 2 ? "taken" : null;
      },
    } as unknown as KVNamespace;

    const id = await generateStudentId(kv);
    expect(isValidStudentId(id)).toBe(true);
    expect(calls).toBe(3);
  });

  it("throws after maxRetries collisions", async () => {
    let calls = 0;
    const kv = {
      get: async () => {
        calls++;
        return "taken";
      },
    } as unknown as KVNamespace;

    await expect(generateStudentId(kv, 3)).rejects.toThrow(
      /Failed to generate a unique student ID/,
    );
    expect(calls).toBe(3);
  });
});

describe("isValidStudentId", () => {
  it("accepts well-formed ids", () => {
    expect(isValidStudentId("curious-hacker-2019")).toBe(true);
  });

  it("rejects malformed ids", () => {
    expect(isValidStudentId("not-an-id")).toBe(false);
    expect(isValidStudentId("Curious-Hacker-2019")).toBe(false);
    expect(isValidStudentId("curious-hacker-19")).toBe(false);
    expect(isValidStudentId("")).toBe(false);
    // Bounded so a crafted ID can't exceed the KV key limit.
    expect(isValidStudentId(`${"a".repeat(33)}-b-1234`)).toBe(false);
    expect(isValidStudentId(`a-${"b".repeat(300)}-1234`)).toBe(false);
    expect(isValidStudentId("steady-tramontane-4821")).toBe(true);
  });
});
