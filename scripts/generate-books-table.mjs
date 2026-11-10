#!/usr/bin/env node
/**
 * Rebuilds the description column of the Books for sale table from
 * assets/books/descriptions.json, so each blurb lives in exactly one place.
 *
 * The page keeps working without JavaScript: the script writes plain <p>
 * elements into the table, it does not render the column in the browser.
 *
 * Run from the repository root:
 *
 *   node scripts/generate-books-table.mjs           rewrite the table
 *   node scripts/generate-books-table.mjs --check   fail if it is out of date
 *
 * The deploy workflow runs it, and the validate workflow runs --check, so a
 * description edited in only one place is caught before it reaches the site.
 */
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "books-for-sale.html";
const JSON_FILE = "assets/books/descriptions.json";
const checkOnly = process.argv.includes("--check");

const descriptions = JSON.parse(readFileSync(JSON_FILE, "utf8"));
const page = readFileSync(PAGE, "utf8");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paragraphs(text) {
  return String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

const rowPattern =
  /<tr><td>(.*?)<\/td><td>(.*?)<\/td><td class="desc-col">([\s\S]*?)<\/td><td class="price-col">(.*?)<\/td><\/tr>/g;

const used = new Set();
const problems = [];

const updated = page.replace(
  rowPattern,
  (row, title, author, oldDescription, price) => {
    const key = title.trim();

    if (!Object.prototype.hasOwnProperty.call(descriptions, key)) {
      problems.push(`no entry in ${JSON_FILE} for the book "${key}"`);
      return row;
    }

    used.add(key);

    const description = paragraphs(descriptions[key]);

    if (description === oldDescription) {
      return row;
    }

    return `<tr><td>${title}</td><td>${author}</td><td class="desc-col">${description}</td><td class="price-col">${price}</td></tr>`;
  }
);

for (const key of Object.keys(descriptions)) {
  if (!used.has(key)) {
    problems.push(`"${key}" is in ${JSON_FILE} but no row in ${PAGE} uses it`);
  }
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
  process.exit();
}

if (updated === page) {
  console.log(`${PAGE}: descriptions match ${JSON_FILE}`);
  process.exit();
}

if (checkOnly) {
  console.error(
    `${PAGE} is out of date - run: node scripts/generate-books-table.mjs`
  );
  process.exitCode = 1;
  process.exit();
}

writeFileSync(PAGE, updated);
console.log(`${PAGE}: descriptions rebuilt from ${JSON_FILE}`);
