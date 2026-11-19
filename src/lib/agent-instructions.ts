// Builds the agentInstructions string the lessons and exercises API serve:
// the MDX frontmatter text, with `{origin}` replaced by the request origin,
// plus the quiz boilerplate (thorough pace only) and the shared formatting
// note.

import { withFormattingInstructions } from "./formatting-instructions";
import type { StudentProfile } from "./progress";
import { shouldIncludeQuiz, withQuizInstructions } from "./quiz-instructions";

export function replaceOrigin(text: string, origin: string): string {
  return text.replaceAll("{origin}", origin);
}

export function buildAgentInstructions(
  raw: string,
  options: {
    origin: string;
    quiz?: boolean;
    pace?: StudentProfile["pace"];
  },
): string {
  let text = replaceOrigin(raw, options.origin);
  if (shouldIncludeQuiz(options.quiz ?? false, options.pace)) {
    text = withQuizInstructions(text);
  }
  return withFormattingInstructions(text);
}
