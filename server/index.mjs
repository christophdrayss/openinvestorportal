import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { root, loadPortals, summarize, searchPortals, deployments } from "./registry.mjs";
import { handleSite } from "./site/router.mjs";

const PORT = Number(process.env.PORT ?? 4310);
const schema = readFileSync(join(root, "schema/portal.schema.json"), "utf8");

// The registry is small and file-based: reload per request so edits show up without a restart.
const portals = () => loadPortals();

// ---------- MCP server: lets any agent query the registry ----------
function buildMcp() {
  const mcp = new McpServer({ name: "openinvestorportal-registry", version: "0.1.0" });
  mcp.registerTool(
    "search_portals",
    {
      title: "Search investor portals",
      description:
        "Find investor portals in the OpenInvestorPortal registry and see which access channels (API, MCP, SFTP, OIPP) each one offers.",
      inputSchema: {
        query: z.string().optional().describe("Free text: portal or vendor name"),
        capability: z.string().optional().describe("e.g. documents, capital_calls, distributions, capital_account_statements"),
        region: z.string().optional().describe("e.g. europe, dach, north-america, global"),
        channel: z
          .enum(["api", "mcp", "sftp", "webhooks"])
          .optional()
          .describe("Only portals where this channel is available, partner-only or beta"),
      },
    },
    async (args) => ({
      content: [{ type: "text", text: JSON.stringify(searchPortals(portals(), args).map((e) => summarize(e)), null, 2) }],
    })
  );
  mcp.registerTool(
    "get_portal",
    {
      title: "Get portal entry",
      description: "Full registry entry for one portal: access channels, auth, docs URLs, capabilities, terms, verification.",
      inputSchema: { id: z.string().describe("Portal id, e.g. juniper-square") },
    },
    async ({ id }) => {
      const e = portals().find((p) => p.id === id);
      return e
        ? { content: [{ type: "text", text: JSON.stringify(e, null, 2) }] }
        : { content: [{ type: "text", text: `No portal with id "${id}"` }], isError: true };
    }
  );
  return mcp;
}

async function handleMcp(req, res) {
  // Stateless mode: fresh server + transport per request, no session bookkeeping.
  const mcp = buildMcp();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    mcp.close();
  });
  await mcp.connect(transport);
  let body;
  if (req.method === "POST") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "null");
  }
  await transport.handleRequest(req, res, body);
}

// ---------- REST + landing page ----------
const json = (res, status, data) => {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=60",
  });
  res.end(JSON.stringify(data, null, 2));
};


createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === "/mcp") return await handleMcp(req, res);
    if (req.method !== "GET") return json(res, 405, { error: "method not allowed" });
    if (url.pathname === "/health") return json(res, 200, { ok: true, portals: portals().length });
    // static assets (favicons, manifest) from server/public
    const asset = url.pathname.match(/^\/((?:logos\/)?[a-z0-9-]+\.(svg|png|ico|webmanifest|css|js))$/);
    if (asset) {
      const file = join(root, "server/public", asset[1]);
      if (!existsSync(file)) return json(res, 404, { error: "not found" });
      const types = { svg: "image/svg+xml", png: "image/png", ico: "image/x-icon", webmanifest: "application/manifest+json", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8" };
      res.writeHead(200, { "content-type": types[asset[2]], "cache-control": ["css", "js"].includes(asset[2]) ? "no-cache" : "public, max-age=86400" });
      return res.end(readFileSync(file));
    }
    if (url.pathname === "/schema/portal.schema.json") {
      res.writeHead(200, { "content-type": "application/schema+json" });
      return res.end(schema);
    }
    if (url.pathname === "/v1/portals") {
      const p = url.searchParams;
      const list = searchPortals(portals(), {
        query: p.get("q"),
        capability: p.get("capability"),
        region: p.get("region"),
        channel: p.get("channel"),
      });
      return json(res, 200, { count: list.length, portals: list.map((e) => summarize(e)) });
    }
    if (url.pathname === "/v1/deployments") {
      const product = url.searchParams.get("product");
      const list = deployments().filter((d) => !product || d.product === product);
      return json(res, 200, { count: list.length, deployments: list });
    }
    const m = url.pathname.match(/^\/v1\/portals\/([a-z0-9-]+)$/);
    if (m) {
      const e = portals().find((p) => p.id === m[1]);
      return e ? json(res, 200, { ...e, deployments: deployments().filter((d) => d.product === e.id) }) : json(res, 404, { error: "not found" });
    }
    // Server-rendered pages: landing, registry, portals, administrators, comparisons, guides, badges, sitemap, robots, llms.txt
    if (await handleSite(req, res, url)) return;
    json(res, 404, { error: "not found" });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) json(res, 500, { error: "internal error" });
  }
}).listen(PORT, "127.0.0.1", () =>
  console.log(`OpenInvestorPortal registry: http://localhost:${PORT}  (MCP endpoint: POST /mcp)`)
);
