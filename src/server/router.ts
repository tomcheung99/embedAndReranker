// ============================================================
// HTTP Router — 輕量路由（零依賴）
// ============================================================

import type { IncomingMessage, ServerResponse } from "node:http";
import { logInfo, logError } from "../logger.js";

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown,
) => Promise<void>;

interface Route {
  method: string;
  path: string;
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  post(path: string, handler: Handler): void {
    this.routes.push({ method: "POST", path, handler });
  }

  get(path: string, handler: Handler): void {
    this.routes.push({ method: "GET", path, handler });
  }

  put(path: string, handler: Handler): void {
    this.routes.push({ method: "PUT", path, handler });
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = req.method ?? "GET";
    const url = req.url ?? "/";

    // 健康檢查 (不印 log，避免洗版)
    if (url === "/health" && method === "GET") {
      json(res, 200, { status: "ok" });
      return;
    }

    const start = Date.now();
    logInfo(`--> ${method} ${url}`);

    const route = this.routes.find(
      (r) => r.method === method && r.path === url,
    );

    if (!route) {
      logInfo(`<-- ${method} ${url} 404 (${Date.now() - start}ms)`);
      json(res, 404, { error: "Not Found" });
      return;
    }

    try {
      const body = method === "GET" ? null : await parseBody(req);
      await route.handler(req, res, body);
      logInfo(`<-- ${method} ${url} ${res.statusCode} (${Date.now() - start}ms)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logError(`<-- ${method} ${url} 500 (${Date.now() - start}ms) Error: ${message}`);
      json(res, 500, { error: message });
    }
  }
}

/** 回傳 JSON */
export function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

/** 解析 request body（限制 10 MB） */
function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const MAX = 10 * 1024 * 1024; // 10 MB

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX) {
        req.destroy();
        reject(new Error("Request body too large"));
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf-8");
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}
