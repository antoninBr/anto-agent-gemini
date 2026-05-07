import { request } from "undici";

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
}

const GITHUB_REPO = "google-gemini/gemini-cli";
const GITHUB_API = "https://api.github.com";

// Pages curées en dur — sources hors GitHub. À enrichir au fil du temps.
const KNOWN_PAGES: Array<{ title: string; url: string; tags: string[] }> = [
  {
    title: "Gemini Code Assist — Aperçu",
    url: "https://docs.cloud.google.com/gemini/docs/codeassist/overview",
    tags: ["code assist", "vscode", "ide"],
  },
  {
    title: "Model Context Protocol — Spécification",
    url: "https://modelcontextprotocol.io/specification",
    tags: ["mcp", "protocol", "tools"],
  },
  {
    title: "MCP — Server quickstart",
    url: "https://modelcontextprotocol.io/quickstart/server",
    tags: ["mcp", "server", "typescript"],
  },
];

export async function searchGeminiDocs(
  query: string,
  limit: number = 5,
): Promise<SearchHit[]> {
  const queryLower = query.toLowerCase();

  const githubHits = await searchGitHub(query, limit);

  const curatedHits: SearchHit[] = KNOWN_PAGES.filter(
    (p) =>
      p.title.toLowerCase().includes(queryLower) ||
      p.tags.some((t) => t.includes(queryLower)),
  ).map((p) => ({ title: p.title, url: p.url, snippet: "[curated]" }));

  return [...githubHits, ...curatedHits].slice(0, limit);
}

async function searchGitHub(
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const q = `${query} repo:${GITHUB_REPO} path:docs extension:md`;
  const url = `${GITHUB_API}/search/code?q=${encodeURIComponent(q)}&per_page=${limit}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "anto-agent-gemini-mcp/0.1",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await request(url, { headers });

  if (response.statusCode === 401 || response.statusCode === 403) {
    const reason =
      response.statusCode === 401
        ? "GitHub Code Search exige une authentification"
        : "Rate-limit GitHub atteint";
    throw new Error(
      `${reason}. Définis la variable d'env GITHUB_TOKEN (token GitHub personnel, sans scope spécial requis pour la recherche publique).`,
    );
  }
  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode} sur GitHub Search.`);
  }

  const data = (await response.body.json()) as {
    items?: Array<{
      path: string;
      html_url: string;
      repository: { full_name: string };
    }>;
  };

  return (data.items ?? []).map((item) => ({
    title: item.path,
    url: item.html_url.replace("/blob/", "/raw/"),
    snippet: `${item.repository.full_name}/${item.path}`,
  }));
}
