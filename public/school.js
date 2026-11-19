// Copyright (c) 2026 Zeke Sikelianos
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0
// Modified for Vibe School.
//
// Vibe School client API: student ID, progress cache, preferences, and the
// checkmark updates used by every page. Loaded synchronously in <head>.
(() => {
  const memory = {};

  function read(key) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? memory[key] || null : v;
    } catch (_e) {
      return memory[key] || null;
    }
  }

  function write(key, value) {
    memory[key] = value;
    try {
      localStorage.setItem(key, value);
    } catch (_e) {
      // Some browsers block localStorage. Keep the page working.
    }
  }

  function remove(key) {
    delete memory[key];
    try {
      localStorage.removeItem(key);
    } catch (_e) {}
  }

  function deviceId() {
    let id = read("deviceId");
    if (!id) {
      id =
        window.crypto && typeof window.crypto.randomUUID === "function"
          ? window.crypto.randomUUID()
          : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      write("deviceId", id);
    }
    return id;
  }

  function slugOf(entry) {
    return typeof entry === "string" ? entry : entry.slug;
  }

  function asCompletion(entry) {
    return typeof entry === "string"
      ? { slug: entry, completedAt: null, source: "browser" }
      : entry;
  }

  // Paths by role. Mirrors src/lib/paths.ts.
  const PATHS = window.__schoolPaths || {};
  // [{slug, title, order, track, description, minutes, surfaces}] in order.
  const COURSE = window.__schoolCourse || [];

  window.school = {
    read: read,
    write: write,
    remove: remove,

    getStudentId: () => read("studentId"),
    setStudentId: (id) => {
      write("studentId", id);
    },
    getDeviceId: deviceId,

    // Preferences picked on the homepage. Surface also drives <SurfaceTabs>.
    getSurface: () => read("school:surface"),
    // Every surface picker on the page (SurfaceTabs, the launch bar)
    // listens for "school:surface" so they stay in sync.
    setSurface: (s) => {
      write("school:surface", s);
      document.documentElement.dataset.surface = s;
      document.dispatchEvent(
        new CustomEvent("school:surface", { detail: { surface: s } }),
      );
    },
    getRole: () => read("school:role"),
    setRole: (r) => {
      write("school:role", r);
      document.documentElement.dataset.role = r;
    },
    // The student's chosen path, else a default from role and surface
    // (same rule as defaultPath in src/lib/paths.ts).
    getPath: function () {
      const saved = read("school:path");
      if (saved) return saved;
      const prof = this.getCachedProgress()?.profile || {};
      const role = read("school:role") || prof.role;
      const surface = read("school:surface") || (prof.surfaces || [])[0];
      if (role === "team-lead") return "team-lead";
      if (role === "knowledge-worker" || surface === "work") return "work";
      if (surface === "vscode" || surface === "cli" || surface === "desktop")
        return surface;
      return "all";
    },
    setPath: (p) => {
      write("school:path", p);
    },
    pathLessons: function (p) {
      return PATHS[p || this.getPath()] || null;
    },

    // ---- Progress model, shared by every page ----
    course: () => COURSE,
    lessonInfo: (slug) => COURSE.find((l) => l.slug === slug) || null,
    /** Lessons on the student's path, in course order. */
    pathCourse: function (p) {
      const list = this.pathLessons(p);
      return list ? COURSE.filter((l) => list.indexOf(l.slug) !== -1) : COURSE;
    },
    /** { done, total, pct, next } for the student's path. */
    pathProgress: function (p) {
      const items = this.pathCourse(p);
      const done = items.filter((l) => this.isLessonComplete(l.slug)).length;
      const next = items.find((l) => !this.isLessonComplete(l.slug)) || null;
      return {
        done: done,
        total: items.length,
        pct: items.length ? Math.round((100 * done) / items.length) : 0,
        next: next,
      };
    },
    /** The lesson after `slug` on the student's path (navigation only). */
    nextOnPath: function (slug, p) {
      const items = this.pathCourse(p);
      const i = items.findIndex((l) => l.slug === slug);
      if (i !== -1) return items[i + 1] || null;
      const here = COURSE.find((l) => l.slug === slug);
      return (here && items.find((l) => l.order > here.order)) || null;
    },

    getCachedProgress: () => {
      try {
        return JSON.parse(read("progress") || "null");
      } catch (_e) {
        return null;
      }
    },
    setCachedProgress: (progress) => {
      write("progress", JSON.stringify(progress));
    },

    isLessonComplete: function (slug) {
      const p = this.getCachedProgress();
      return !!p?.completedLessons?.some((l) => slugOf(l) === slug);
    },
    getLessonCompletion: function (slug) {
      const p = this.getCachedProgress();
      const e = p?.completedLessons?.find((l) => slugOf(l) === slug);
      return e ? asCompletion(e) : null;
    },
    isExerciseComplete: function (slug) {
      const p = this.getCachedProgress();
      return !!p?.completedExercises?.some((e) => slugOf(e) === slug);
    },
    getExerciseCompletion: function (slug) {
      const p = this.getCachedProgress();
      const e = p?.completedExercises?.find((x) => slugOf(x) === slug);
      return e ? asCompletion(e) : null;
    },
    getArtifacts: function () {
      const p = this.getCachedProgress();
      return p?.artifacts || [];
    },
    getSurfacesUsed: function () {
      const p = this.getCachedProgress();
      return p?.surfacesUsed || [];
    },

    getVisitedLessons: () => {
      try {
        return JSON.parse(read("visitedLessons") || "[]");
      } catch (_e) {
        return [];
      }
    },
    isLessonVisited: function (slug) {
      return this.getVisitedLessons().indexOf(slug) !== -1;
    },
    markLessonVisited: function (slug) {
      const v = this.getVisitedLessons();
      if (v.indexOf(slug) === -1) {
        v.push(slug);
        write("visitedLessons", JSON.stringify(v));
      }
    },

    enroll: async function () {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: deviceId() }),
      });
      if (!res.ok) throw new Error("Enrollment failed");
      const data = await res.json();
      this.setStudentId(data.studentId);
      this.setCachedProgress(data.progress);
      return data;
    },

    saveProfile: async function (fields) {
      const id = this.getStudentId();
      if (!id) return null;
      try {
        const res = await fetch(`/api/profile/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
          keepalive: true,
        });
        return res.ok ? res.json() : null;
      } catch (_e) {
        return null;
      }
    },

    // Never rejects: offline or a restarting server just returns null.
    fetchProgress: async function () {
      const id = this.getStudentId();
      if (!id) return null;
      try {
        const res = await fetch(`/api/progress/${id}`);
        if (!res.ok) return null;
        const progress = await res.json();
        this.setCachedProgress(progress);
        return progress;
      } catch (_e) {
        return null;
      }
    },

    // Resolves after the first server fetch on this page (or right away when
    // not enrolled). Pages compare later progress against this baseline.
    ready: null,

    // Keyboard and ARIA for a group of tabs or radios: roving tabindex,
    // arrows, Home and End. `items` are buttons; `onSelect(el)` runs on
    // click and on keyboard moves. `attr` is "aria-selected" (tabs) or
    // "aria-checked" (radios).
    rovingGroup: (items, attr, onSelect) => {
      const list = Array.prototype.slice.call(items);
      const sync = () => {
        const on = list.find((b) => b.getAttribute(attr) === "true") || list[0];
        list.forEach((b) => {
          b.setAttribute("tabindex", b === on ? "0" : "-1");
        });
      };
      list.forEach((b, i) => {
        b.addEventListener("click", () => {
          onSelect(b);
          sync();
        });
        b.addEventListener("keydown", (e) => {
          let n = null;
          if (e.key === "ArrowRight" || e.key === "ArrowDown")
            n = list[(i + 1) % list.length];
          else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
            n = list[(i - 1 + list.length) % list.length];
          else if (e.key === "Home") n = list[0];
          else if (e.key === "End") n = list[list.length - 1];
          if (!n) return;
          e.preventDefault();
          onSelect(n);
          sync();
          n.focus();
        });
      });
      sync();
      return sync;
    },

    // A short burst of sunset squares from an element (lesson done).
    celebrate: (from) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const r = from
        ? from.getBoundingClientRect()
        : { left: innerWidth / 2, top: innerHeight / 3, width: 0, height: 0 };
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const colors = ["#FFAF01", "#FF8204", "#FA500F", "#E51300", "#C4001D"];
      const layer = document.createElement("div");
      layer.className = "burst";
      layer.setAttribute("aria-hidden", "true");
      for (let i = 0; i < 24; i++) {
        const sq = document.createElement("i");
        const a = (Math.PI * 2 * i) / 24 + Math.random() * 0.4;
        const d = 60 + Math.random() * 90;
        sq.style.left = `${cx}px`;
        sq.style.top = `${cy}px`;
        sq.style.background = colors[i % colors.length];
        sq.style.setProperty("--x", `${Math.cos(a) * d}px`);
        sq.style.setProperty("--y", `${Math.sin(a) * d - 20}px`);
        layer.appendChild(sq);
      }
      document.body.appendChild(layer);
      setTimeout(() => layer.remove(), 1000);
    },

    // A small confirmation at the bottom of the screen.
    toast: (text) => {
      let el = document.getElementById("school-toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "school-toast";
        el.className = "toast";
        el.setAttribute("role", "status");
        document.body.appendChild(el);
      }
      el.textContent = text;
      requestAnimationFrame(() => el.classList.add("is-on"));
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.remove("is-on"), 1800);
    },

    copy: (text) => {
      if (!navigator.clipboard?.writeText) {
        return Promise.reject(new Error("Clipboard not available"));
      }
      return navigator.clipboard.writeText(text);
    },

    _complete: async function (body) {
      const id = this.getStudentId();
      if (!id) return null;
      body.source = "browser";
      try {
        const res = await fetch(`/api/progress/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return null;
        const progress = await res.json();
        this.setCachedProgress(progress);
        return progress;
      } catch (_e) {
        return null;
      }
    },
    markComplete: function (lessonSlug) {
      return this._complete({ lessonSlug: lessonSlug });
    },
    markExerciseComplete: function (exerciseSlug) {
      return this._complete({ exerciseSlug: exerciseSlug });
    },

    // Listeners re-render when progress changes (polling, enrollment).
    _listeners: [],
    onProgress: function (fn) {
      this._listeners.push(fn);
    },

    updateAllCheckmarks: function () {
      let nextSet = false;
      const path = this.pathLessons();
      document.querySelectorAll("[data-lesson-slug]").forEach((el) => {
        const slug = el.getAttribute("data-lesson-slug");
        const row = el.querySelector(".lesson-row");
        const cta = el.querySelector(".lesson-cta");
        const status = el.querySelector(".lesson-status");
        const check = el.querySelector(".lesson-check");
        const dot = el.querySelector(".lesson-status-dot");
        const complete = this.isLessonComplete(slug);
        const onPath = !path || path.indexOf(slug) !== -1;
        const isNext = !complete && onPath && !nextSet;
        if (isNext) nextSet = true;
        if (row) {
          row.classList.toggle("lesson-row--next", isNext);
          row.classList.toggle("off-path", !onPath);
        }
        if (cta) {
          cta.classList.toggle("hidden", !isNext);
          if (isNext)
            cta.textContent = this.isLessonVisited(slug) ? "Continue" : "Start";
        }
        if (status)
          status.classList.toggle("lesson-status--complete", complete);
        if (check) {
          check.classList.toggle("hidden", !complete);
          check.classList.toggle("flex", complete);
        }
        if (dot) dot.classList.toggle("hidden", complete);
      });
      const railPath = this.pathLessons(this.getPath());
      document.querySelectorAll("[data-rail-slug]").forEach((el) => {
        const slug = el.getAttribute("data-rail-slug");
        const done = this.isLessonComplete(slug);
        el.classList.toggle("is-done", done);
        // Only lessons on your path, plus the one you're reading.
        const current = !!el.querySelector('[aria-current="page"]');
        el.hidden = !!railPath && railPath.indexOf(slug) === -1 && !current;
        const mark = el.querySelector(".rail-mark");
        if (mark)
          mark.textContent = done ? "\u2713" : mark.getAttribute("data-num");
      });
      document.querySelectorAll("[data-exercise-slug]").forEach((el) => {
        const done = this.isExerciseComplete(
          el.getAttribute("data-exercise-slug"),
        );
        const status = el.querySelector(".exercise-status");
        const check = el.querySelector(".exercise-check");
        const dot = el.querySelector(".exercise-status-dot");
        if (status) status.classList.toggle("lesson-status--complete", done);
        if (check) {
          check.classList.toggle("hidden", !done);
          check.classList.toggle("flex", done);
        }
        if (dot) dot.classList.toggle("hidden", done);
      });
      document.querySelectorAll("[data-track-progress]").forEach((el) => {
        const slugs = (el.getAttribute("data-track-progress") || "")
          .split(",")
          .filter(Boolean);
        const done = slugs.filter((s) => this.isLessonComplete(s)).length;
        const fill = el.querySelector(".progress-fill");
        const count = el.querySelector(".progress-count");
        if (fill)
          fill.style.width = slugs.length
            ? `${(100 * done) / slugs.length}%`
            : "0";
        if (count) count.textContent = `${done}/${slugs.length}`;
      });
      this._listeners.forEach((fn) => {
        try {
          fn(this.getCachedProgress());
        } catch (e) {
          console.error(e);
        }
      });
    },

    updateEnrolledIndicator: function () {
      const enrolled = !!this.getStudentId();
      document.documentElement.classList.toggle("is-enrolled", enrolled);
      document.querySelectorAll("[data-enrolled-only]").forEach((el) => {
        el.classList.toggle("hidden", !enrolled);
      });
    },
  };

  // ?sid= lets a tutor hand the browser a student ID. Handled here, before
  // any page script runs.
  try {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("sid");
    if (sid && /^[a-z]{1,32}-[a-z]{1,32}-\d{4}$/.test(sid)) {
      if (read("studentId") !== sid) {
        // A different student: drop everything tied to the previous one.
        for (const key of [
          "progress",
          "visitedLessons",
          "school:role",
          "school:path",
          "school:surface",
        ]) {
          remove(key);
        }
      }
      write("studentId", sid);
      params.delete("sid");
      const qs = params.toString();
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
      );
    }
  } catch (_e) {}

  window.school.ready = window.school.getStudentId()
    ? window.school.fetchProgress()
    : Promise.resolve(null);

  // Mark enrolled students before first paint, so pages can hide visitor-only
  // content without a flash.
  if (window.school.getStudentId()) {
    document.documentElement.classList.add("is-enrolled");
  }

  const s = read("school:surface");
  if (s) document.documentElement.dataset.surface = s;
  const r = read("school:role");
  if (r) document.documentElement.dataset.role = r;
})();
