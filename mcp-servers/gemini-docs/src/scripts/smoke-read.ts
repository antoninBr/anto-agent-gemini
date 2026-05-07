import { readGeminiDocPage } from "../fetch-page.js";

const url =
  process.argv[2] ??
  "https://raw.githubusercontent.com/google-gemini/gemini-cli/main/README.md";

const page = await readGeminiDocPage(url);
console.log(`URL    : ${page.url}`);
console.log(`Title  : ${page.title}`);
console.log(`Length : ${page.content.length} chars`);
console.log(`--- Aperçu (500 premiers chars) ---`);
console.log(page.content.slice(0, 500));
