#!/usr/bin/env node
/**
 * Regenerates the FAQPage JSON-LD block in faq.html from the question/answer
 * markup on that page, so structured data can never drift from the answers
 * visitors actually read.
 *
 * Run from the repository root:  node scripts/generate-faq-schema.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "faq.html";
const START = "<!-- faq-schema:start";
const END = "<!-- faq-schema:end -->";
const SITE_URL = "https://goderichchessclub.com/faq";

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "\u2014",
  "&ndash;": "\u2013",
  "&rsquo;": "\u2019",
  "&lsquo;": "\u2018",
  "&ldquo;": "\u201c",
  "&rdquo;": "\u201d",
  "&hellip;": "\u2026",
};

function toText(html) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z#0-9]+;/g, (entity) => (entity in ENTITIES ? ENTITIES[entity] : entity))
    .replace(/\s+/g, " ")
    .trim();
}

const html = readFileSync(PAGE, "utf8");

// <div class="faq-item"> <h2 class="faq-heading"><button class="faq-question">Q<span class="faq-icon">+</span></button></h2>
//   <div class="faq-answer" id="faq-a-1"><div class="faq-answer-inner">A</div></div>
// </div>
// The heading wrapper is optional so this keeps working either way.
const ITEM = /<div class="faq-item">\s*(?:<h2 class="faq-heading">\s*)?<button class="faq-question"[^>]*>([\s\S]*?)<span class="faq-icon"[\s\S]*?<div class="faq-answer"[^>]*><div class="faq-answer-inner">([\s\S]*?)<\/div><\/div>/g;

const questions = [];
for (const match of html.matchAll(ITEM)) {
  const name = toText(match[1]);
  const text = toText(match[2]);
  if (!name || !text) continue;
  questions.push({
    "@type": "Question",
    name,
    acceptedAnswer: { "@type": "Answer", text },
  });
}

if (!questions.length) {
  console.error(`generate-faq-schema: no question/answer pairs found in ${PAGE}`);
  process.exit(1);
}

const startIndex = html.indexOf(START);
const endIndex = html.indexOf(END);

if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
  console.error(`generate-faq-schema: markers not found in ${PAGE}`);
  process.exit(1);
}

const block = [
  `${START} — generated from the question/answer markup below by`,
  "  scripts/generate-faq-schema.mjs; do not edit this block by hand -->",
  '<script type="application/ld+json">',
  JSON.stringify(
    [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": SITE_URL,
        url: SITE_URL,
        mainEntity: questions,
      },
    ],
    null,
    2
  ),
  "</script>",
  END,
].join("\n");

writeFileSync(PAGE, html.slice(0, startIndex) + block + html.slice(endIndex + END.length));
console.log(`generate-faq-schema: wrote ${questions.length} question(s) to ${PAGE}`);
