// Course tracks and surfaces, in display order. Single source of truth for
// the sidebar, homepage, lesson pages, content schema and OpenAPI spec.

export const TRACKS = ["start", "surfaces", "code", "work", "team"] as const;
export type Track = (typeof TRACKS)[number];

export const TRACK_LABELS: Record<Track, string> = {
  start: "Get started",
  surfaces: "Surfaces",
  code: "Vibe Code",
  work: "Vibe Work",
  team: "Team",
};

export const TRACK_BLURBS: Record<Track, string> = {
  start: "Install Vibe, tell it about yourself, and pick your surfaces.",
  surfaces:
    "One lesson per surface: the CLI, VS Code, Vibe Desktop and Vibe Code Web. Learn the controls first, then the concepts.",
  code: "The concepts behind every coding surface: config, permissions, instructions, models, skills, agents, MCP, hooks and more.",
  work: "Vibe's productivity mode: research, projects, connectors, canvas and scheduled tasks.",
  team: "Bring it all together and roll Vibe out to your team.",
};

/**
 * Where a lesson's hands-on part can be done.
 * - cli: Vibe CLI in a terminal
 * - vscode: Mistral Vibe extension in VS Code
 * - desktop: Vibe Desktop app (macOS / Windows), local or cloud sessions
 * - code-web: Vibe Code Web (cloud sandbox on a GitHub or GitLab repo)
 * - work: Vibe Work on the web/desktop (chat.mistral.ai)
 */
export const SURFACES = [
  "cli",
  "vscode",
  "desktop",
  "code-web",
  "work",
] as const;
export type Surface = (typeof SURFACES)[number];

export const SURFACE_LABELS: Record<Surface, string> = {
  cli: "CLI",
  vscode: "VS Code",
  desktop: "Desktop",
  "code-web": "Code Web",
  work: "Work",
};

/** Pixel icon for each surface, in /public/pixel. */
export const SURFACE_ICONS: Record<Surface, string> = {
  cli: "/pixel/computer.svg",
  vscode: "/pixel/chat-code.svg",
  desktop: "/pixel/window.svg",
  "code-web": "/pixel/cloud.svg",
  work: "/pixel/briefcase.svg",
};

/** Pixel icon for each track, in /public/pixel. */
export const TRACK_ICONS: Record<Track, string> = {
  start: "/pixel/rocket.svg",
  surfaces: "/pixel/keyboard-key.svg",
  code: "/pixel/m-book.svg",
  work: "/pixel/briefcase.svg",
  team: "/pixel/trophy.svg",
};

export const SURFACE_BLURBS: Record<Surface, string> = {
  cli: "Vibe in your terminal",
  vscode: "The Mistral Vibe extension",
  desktop: "The Vibe Desktop app",
  "code-web": "Cloud sessions on your repos",
  work: "Research, docs and tasks",
};
