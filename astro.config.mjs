// Copyright (c) 2026 Zeke Sikelianos
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cloudflare from "@astrojs/cloudflare";
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { parse as parseJsonc } from "jsonc-parser";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";

// Read public, non-secret values from wrangler.jsonc so the deployment config
// is the single source of truth. These get inlined into the build, which is
// needed because human-facing pages are prerendered, so runtime `env` bindings
// aren't available when the HTML is generated.
//
// WRANGLER_CONFIG_PATH lets preview deploys build against a per-PR config
// (different Worker name, different KV namespace) without touching the
// checked-in wrangler.jsonc.
const projectRoot = dirname(fileURLToPath(import.meta.url));
const wranglerConfigPath = process.env.WRANGLER_CONFIG_PATH
  ? resolve(projectRoot, process.env.WRANGLER_CONFIG_PATH)
  : resolve(projectRoot, "wrangler.jsonc");
const wranglerConfig = parseJsonc(readFileSync(wranglerConfigPath, "utf-8"));
const wranglerVars = wranglerConfig?.vars ?? {};
const siteUrl = wranglerVars.SITE_URL || "http://localhost:4321";

export default defineConfig({
  site: siteUrl,
  output: "server",
  // No images are optimized, so skip the Cloudflare Images binding.
  // The site doesn't use Astro sessions, but the adapter always wires a KV
  // binding for them. Point it at the existing PROGRESS namespace so the
  // deploy doesn't need an extra, undeclared SESSION binding.
  adapter: cloudflare({
    configPath: wranglerConfigPath,
    imageService: "passthrough",
    sessionKVBindingName: "PROGRESS",
  }),
  integrations: [mdx()],
  markdown: {
    processor: unified({
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          { behavior: "wrap", properties: { class: "heading-anchor" } },
        ],
      ],
    }),
    shikiConfig: {
      theme: "vesper",
    },
  },
  security: {
    checkOrigin: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
