// Copyright (c) 2026 Zeke Sikelianos
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

const adjectives = [
  "bold",
  "brisk",
  "calm",
  "clever",
  "crisp",
  "curious",
  "deft",
  "keen",
  "nimble",
  "quiet",
  "steady",
  "sunny",
  "swift",
  "warm",
];

// Mistral is a wind, and the M is a pixel cat.
const nouns = [
  "bise",
  "builder",
  "chat",
  "maker",
  "mistral",
  "pixel",
  "sirocco",
  "tinkerer",
  "tramontane",
  "zephyr",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(): number {
  return Math.floor(Math.random() * 9000) + 1000; // 1000-9999
}

/**
 * Generate a student ID like "steady-mistral-4821".
 *
 * If a KV namespace is provided, checks for collisions and retries
 * up to `maxRetries` times.
 */
export async function generateStudentId(
  kv?: KVNamespace,
  maxRetries = 10,
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const id = `${pick(adjectives)}-${pick(nouns)}-${randomNumber()}`;
    if (!kv) return id;

    const existing = await kv.get(`student:${id}`);
    if (!existing) return id;
  }
  throw new Error("Failed to generate a unique student ID after retries");
}

/** Validate that a string looks like a valid student ID format. */
export function isValidStudentId(id: string): boolean {
  // Word lengths are bounded so a crafted ID can't exceed KV's key limit.
  return /^[a-z]{1,32}-[a-z]{1,32}-\d{4}$/.test(id);
}
