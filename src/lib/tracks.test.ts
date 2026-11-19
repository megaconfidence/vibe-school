import { describe, expect, it } from "vitest";
import {
  SURFACE_LABELS,
  SURFACES,
  TRACK_BLURBS,
  TRACK_LABELS,
  TRACKS,
} from "./tracks";

describe("tracks", () => {
  it("has a label and blurb for every track", () => {
    for (const t of TRACKS) {
      expect(TRACK_LABELS[t]).toBeTruthy();
      expect(TRACK_BLURBS[t]).toBeTruthy();
    }
  });

  it("has a label for every surface", () => {
    for (const s of SURFACES) expect(SURFACE_LABELS[s]).toBeTruthy();
  });

  it("orders surfaces before code and team last", () => {
    expect(TRACKS.indexOf("surfaces")).toBeLessThan(TRACKS.indexOf("code"));
    expect(TRACKS[TRACKS.length - 1]).toBe("team");
  });
});
