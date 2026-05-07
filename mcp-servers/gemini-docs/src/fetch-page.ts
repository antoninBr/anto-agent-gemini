import { request } from "undici";
import TurndownService from "turndown";

interface DocPage {
  url: string;
  title: string;
  content: string;
}

const cache = new Map<string, { result: DocPage; expiresAt: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 heure

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export async function readGeminiDocPage(url: string): Promise<DocPage> {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const response = await request(url, {
    headers: { "User-Agent": "anto-agent-gemini-mcp/0.1" },
  });

  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode} pour ${url}`);
  }

  const body = await response.body.text();
  const contentType = String(response.headers["content-type"] ?? "");

  let title = url;
  let content = body;

  if (contentType.includes("text/html")) {
    const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    content = turndown.turndown(body);
  } else {
    const firstHeading = body
      .split("\n")
      .find((line) => line.startsWith("# "));
    if (firstHeading) {
      title = firstHeading.replace(/^#\s+/, "").trim();
    }
  }

  const result: DocPage = { url, title, content };
  cache.set(url, { result, expiresAt: Date.now() + TTL_MS });
  return result;
}
