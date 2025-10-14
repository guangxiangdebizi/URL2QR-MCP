import express, { Request, Response } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import path from "node:path";
import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema, CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

// Import business tools
import { url2qr } from "./tools/url2qr.js";

// Session storage (maintaining sessions via headers in stateless HTTP)
interface Session { id: string; server: Server; createdAt: Date; lastActivity: Date }
const sessions = new Map<string, Session>();

function createMCPServer(): Server {
  const server = new Server(
    { name: "URL2QR-MCP", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  const tools: Tool[] = [
    { name: url2qr.name, description: url2qr.description, inputSchema: url2qr.parameters as any }
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params as any;
    switch (name) {
      case "url_to_qrcode": return await url2qr.run(args);
      default: throw new Error(`Unknown tool: ${name}`);
    }
  });

  return server;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const QR_OUTPUT_DIR = process.env.QR_OUTPUT_DIR || "./qrcodes";
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");

app.use(cors({ 
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization", "Mcp-Session-Id", "Last-Event-ID"],
  exposedHeaders: ["Content-Type", "Mcp-Session-Id"]
}));
app.use(express.json({ limit: "10mb" }));

// Static file serving for QR codes
app.use("/qrcodes", express.static(path.resolve(QR_OUTPUT_DIR)));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ 
    status: "healthy", 
    transport: "streamable-http", 
    activeSessions: sessions.size,
    serverName: "URL2QR-MCP",
    version: "1.0.0"
  });
});

// Root endpoint with API info
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "URL2QR MCP Server",
    version: "1.0.0",
    description: "MCP server that converts URLs to QR codes",
    endpoints: {
      mcp: "/mcp",
      health: "/health",
      qrcodes: "/qrcodes/:filename"
    },
    author: {
      name: "Xingyu Chen",
      github: "https://github.com/guangxiangdebizi",
      npm: "https://www.npmjs.com/~xingyuchen"
    }
  });
});

// Streamable HTTP main endpoint: POST /mcp (JSON-RPC)
app.all("/mcp", async (req: Request, res: Response) => {
  const sessionIdHeader = req.headers["mcp-session-id"] as string | undefined;
  const method = req.method.toUpperCase();

  if (method === "POST") {
    const body = req.body;
    if (!body) return res.status(400).json({ jsonrpc: "2.0", error: { code: -32600, message: "Empty body" }, id: null });

    // Ignore notifications (like notifications/initialized)
    const isNotification = (body.id === undefined || body.id === null) && typeof body.method === "string" && body.method.startsWith("notifications/");
    if (isNotification) {
      if (sessionIdHeader && sessions.has(sessionIdHeader)) sessions.get(sessionIdHeader)!.lastActivity = new Date();
      return res.status(204).end();
    }

    // Initialize/session management
    const isInit = body.method === "initialize";
    let session: Session | undefined;
    if (sessionIdHeader && sessions.has(sessionIdHeader)) {
      session = sessions.get(sessionIdHeader)!; session.lastActivity = new Date();
    } else if (isInit) {
      const newId = randomUUID();
      const server = createMCPServer();
      session = { id: newId, server, createdAt: new Date(), lastActivity: new Date() };
      sessions.set(newId, session); res.setHeader("Mcp-Session-Id", newId);
    } else {
      return res.status(400).json({ jsonrpc: "2.0", error: { code: -32000, message: "No session and not initialize" }, id: null });
    }

    // Handle core methods
    if (body.method === "initialize") {
      return res.json({ 
        jsonrpc: "2.0", 
        result: { 
          protocolVersion: "2024-11-05", 
          capabilities: { tools: {} }, 
          serverInfo: { name: "URL2QR-MCP", version: "1.0.0" } 
        }, 
        id: body.id 
      });
    }
    if (body.method === "tools/list") {
      const tools = [
        { name: url2qr.name, description: url2qr.description, inputSchema: url2qr.parameters }
      ];
      return res.json({ jsonrpc: "2.0", result: { tools }, id: body.id });
    }
    if (body.method === "tools/call") {
      const { name, arguments: args } = body.params;
      let result: any;
      switch (name) {
        case "url_to_qrcode": result = await url2qr.run(args); break;
        default: throw new Error(`Unknown tool: ${name}`);
      }
      return res.json({ jsonrpc: "2.0", result, id: body.id });
    }

    return res.status(400).json({ jsonrpc: "2.0", error: { code: -32601, message: `Method not found: ${body.method}` }, id: body.id });
  }

  return res.status(405).json({ jsonrpc: "2.0", error: { code: -32600, message: "Method Not Allowed" }, id: null });
});

// Session cleanup (every 30 minutes)
setInterval(() => {
  const now = new Date();
  const timeout = 30 * 60 * 1000; // 30 minutes
  for (const [id, session] of sessions.entries()) {
    if (now.getTime() - session.lastActivity.getTime() > timeout) {
      sessions.delete(id);
      console.log(`Session ${id} expired and removed`);
    }
  }
}, 15 * 60 * 1000); // Run every 15 minutes

// Start server (Streamable HTTP mode)
app.listen(PORT, () => {
  console.log(`\n🚀 URL2QR MCP Server Started`);
  console.log(`   Transport: Streamable HTTP`);
  console.log(`   MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   QR codes: http://localhost:${PORT}/qrcodes/`);
  console.log(`\n📝 Author: Xingyu Chen`);
  console.log(`   GitHub: https://github.com/guangxiangdebizi`);
  console.log(`   npm: https://www.npmjs.com/~xingyuchen\n`);
});

