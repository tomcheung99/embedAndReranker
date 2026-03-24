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
      const message = fullErrorMessage(err);
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

/**
 * 遞迴展開 Error.cause 鏈，回傳完整錯誤訊息
 * 支援 AggregateError（Node.js fetch ECONNREFUSED 等）
 * 例如 "fetch failed: connect ECONNREFUSED 127.0.0.1:8000"
 */
function fullErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return String(err);

  const parts: string[] = [err.message];
  let current: unknown = err.cause;
  while (current) {
    if (current instanceof AggregateError && current.errors.length > 0) {
      parts.push(current.errors.map((e) => e.message || String(e)).join(", "));
      break;
    } else if (current instanceof Error) {
      const msg = current.message || (current as NodeJS.ErrnoException).code;
      if (msg) parts.push(msg);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(": ");
}
