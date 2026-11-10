#!/usr/bin/env node
/**
 * Runs every repository check in one go, the way the pull-request workflow
 * does, and tells you which one failed instead of stopping at the first.
 *
 * Run from the repository root before pushing:
 *
 *   node scripts/check-all.mjs
 *
 * This is the single list of checks. .github/workflows/validate.yml calls it,
 * so a check cannot exist in one place and be forgotten in the other.
 *
 * The two tools the workflow also runs - html-validate and lychee - are not
 * included here because they are downloaded with npx and lychee is a system
 * binary. Run them by hand when you have changed markup or links:
 *
 *   npx --yes html-validate@9.7.1 '*.html'
 *   lychee --config .lychee.toml '*.html'
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const CHECKS = [
  ["shared header, footer and preview tags", ["scripts/sync-shared-blocks.mjs", "--check"]],
  ["data files", ["scripts/check-data.mjs"]],
  ["footer dates and sitemap", ["scripts/stamp-last-updated.mjs", "--check"]],
  ["weekly meeting details vs the pages", ["scripts/check-meetings.mjs"]],
  ["book descriptions", ["scripts/generate-books-table.mjs", "--check"]],
  ["tournament cards", ["scripts/render-tournaments.mjs", "--check"]],
  ["photo gallery", ["scripts/render-gallery.mjs", "--check"]],
  ["posts", ["scripts/render-posts.mjs", "--check"]],
  ["announcement banner", ["scripts/render-banner.mjs", "--check"]],
  ["event structured data", ["scripts/generate-event-schema.mjs", "--check"]],
  ["FAQ structured data", ["scripts/generate-faq-schema.mjs", "--check"]],
  ["meeting structured data", ["scripts/generate-meeting-schema.mjs", "--check"]],
];

const failures = [];

function record(label, result) {
  const output = [result.stdout, result.stderr].filter(Boolean).join("").trim();
  if (result.status === 0) {
    console.log(`  ok    ${label}${output ? ` - ${output.split("\n").pop()}` : ""}`);
    return;
  }
  console.log(`  FAIL  ${label}`);
  if (output) console.log(output.replace(/^/gm, "        "));
  failures.push(label);
}

console.log("Repository checks\n");

for (const [label, args] of CHECKS) {
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    env: process.env,
  });
  if (result.error) {
    failures.push(label);
    console.log(`  FAIL  ${label}`);
    console.log(`        ${result.error.message}`);
    continue;
  }
  record(label, result);
}

// Syntax check every script the browser runs. Files with import/export are ES
// modules and have to go through stdin; the rest are plain scripts.
const browserScripts = readdirSync("assets").filter((name) => name.endsWith(".js")).sort();
let syntaxOk = 0;
for (const name of browserScripts) {
  const path = `assets/${name}`;
  const source = readFileSync(path, "utf8");
  const isModule = /^\s*(?:import|export)\s/m.test(source);
  const result = isModule
    ? spawnSync(process.execPath, ["--input-type=module", "--check"], { input: source, encoding: "utf8" })
    : spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });

  if (result.status === 0) {
    syntaxOk += 1;
    continue;
  }
  failures.push(`syntax: ${path}`);
  console.log(`  FAIL  syntax: ${path}`);
  console.log([result.stderr, result.stdout].filter(Boolean).join("").trim().replace(/^/gm, "        "));
}

console.log(`  ok    JavaScript syntax - ${syntaxOk} of ${browserScripts.length} files in assets/`);

if (failures.length) {
  console.error(
    `\n${failures.length} check(s) failed: ${failures.join(", ")}\n` +
      "Fix the cause, or run the matching script without --check if a generated block is simply out of date."
  );
  process.exit(1);
}

console.log(`\nAll ${CHECKS.length + 1} checks passed.`);
console.log("Not run here: html-validate and lychee (see the note at the top of this script).");
