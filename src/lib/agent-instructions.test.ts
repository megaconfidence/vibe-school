import { describe, expect, it } from "vitest";
import { buildAgentInstructions, replaceOrigin } from "./agent-instructions";
import { FORMATTING_INSTRUCTIONS } from "./formatting-instructions";
import { QUIZ_INSTRUCTIONS } from "./quiz-instructions";

describe("replaceOrigin", () => {
  it("replaces every {origin} placeholder", () => {
    expect(replaceOrigin("{origin}/a and {origin}/b", "http://x")).toBe(
      "http://x/a and http://x/b",
    );
  });
});

describe("buildAgentInstructions", () => {
  it("adds the formatting note and replaces {origin}", () => {
    const out = buildAgentInstructions("Fetch {origin}/llms.txt", {
      origin: "http://localhost:4321",
    });
    expect(out.startsWith("Fetch http://localhost:4321/llms.txt")).toBe(true);
    expect(out).toContain(FORMATTING_INSTRUCTIONS);
    expect(out).not.toContain(QUIZ_INSTRUCTIONS);
  });

  it("adds the quiz only for thorough pace on quiz lessons", () => {
    const thorough = buildAgentInstructions("x", {
      origin: "o",
      quiz: true,
      pace: "thorough",
    });
    const fast = buildAgentInstructions("x", {
      origin: "o",
      quiz: true,
      pace: "fast",
    });
    expect(thorough).toContain(QUIZ_INSTRUCTIONS);
    expect(fast).not.toContain(QUIZ_INSTRUCTIONS);
  });
});
