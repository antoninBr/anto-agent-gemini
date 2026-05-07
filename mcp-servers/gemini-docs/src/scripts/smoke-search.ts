import { searchGeminiDocs } from "../search-docs.js";

const query = process.argv[2] ?? "extensions";
const limit = process.argv[3] ? Number(process.argv[3]) : 5;

const results = await searchGeminiDocs(query, limit);
console.log(JSON.stringify(results, null, 2));

if (results.length === 0) {
  console.error(`[smoke-search] aucun résultat pour "${query}"`);
  process.exit(1);
}
