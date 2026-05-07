#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readGeminiDocPage } from "./fetch-page.js";
import { searchGeminiDocs } from "./search-docs.js";

const server = new Server(
  { name: "gemini-docs", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_gemini_docs",
      description:
        "Recherche dans la doc officielle Gemini (CLI sur GitHub, Code Assist, spec MCP). Retourne une liste {title, url, snippet}.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Mots-clés de recherche." },
          limit: {
            type: "number",
            description: "Nombre max de résultats (défaut 5).",
            default: 5,
          },
        },
        required: ["query"],
      },
    },
    {
      name: "read_gemini_doc_page",
      description:
        "Récupère le contenu (markdown) d'une page de doc officielle Gemini ou MCP. Utilise une URL retournée par search_gemini_docs.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL absolue de la page." },
        },
        required: ["url"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search_gemini_docs") {
    const results = await searchGeminiDocs(
      args?.query as string,
      (args?.limit as number) ?? 5,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }

  if (name === "read_gemini_doc_page") {
    const page = await readGeminiDocPage(args?.url as string);
    return {
      content: [{ type: "text", text: JSON.stringify(page, null, 2) }],
    };
  }

  throw new Error(`Outil inconnu: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
