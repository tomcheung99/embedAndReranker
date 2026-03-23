// ============================================================
// API Server — OpenAI-compatible Embedding + Rerank
// ============================================================
//
// 兩條 API：
//   POST /v1/embeddings  — OpenAI 格式
//   POST /v1/rerank      — Cohere / Jina 格式
//
// RAM 管理：
//   - 大批量自動分塊（MAX_BATCH_SIZE）
//   - 佇列控制並發（CONCURRENCY）
//   - 限制最大文件數（MAX_DOCUMENTS）
// ============================================================

import { createServer } from "node:http";
import { Router, json } from "./router.js";
import { loadServerConfig } from "./config.js";
import { TaskQueue } from "../queue/task-queue.js";
import { EmbedClient } from "../client/embed.js";
import { RerankClient } from "../client/rerank.js";
import type { ClientConfig } from "../config.js";
import type {
  OpenAIEmbeddingRequest,
  OpenAIEmbeddingResponse,
  OpenAIEmbeddingData,
  RerankAPIRequest,
  RerankAPIResponse,
  RerankAPIResult,
  RerankBackendDocument,
} from "../types.js";

// ── Bootstrap ───────────────────────────────────────────────

const serverCfg = loadServerConfig();

const clientCfg: ClientConfig = {
  endpoints: {
    embed: serverCfg.embedUrl,
    rerank: serverCfg.rerankUrl,
  },
  timeoutMs: serverCfg.timeoutMs,
  maxRetries: serverCfg.maxRetries,
};

const embedClient = new EmbedClient(clientCfg);
const rerankClient = new RerankClient(clientCfg);
const taskQueue = new TaskQueue(serverCfg.concurrency);

// ── Router Setup ────────────────────────────────────────────

const router = new Router();

// ---------- POST /v1/embeddings (OpenAI-compatible) ----------
router.post("/v1/embeddings", async (_req, res, body) => {
  const b = body as OpenAIEmbeddingRequest | null;
  if (!b?.input) {
    json(res, 400, { error: { message: "\"input\" is required", type: "invalid_request_error" } });
    return;
  }

  const texts = normalizeInput(b.input);
  if (texts.length === 0) {
    json(res, 400, { error: { message: "\"input\" must not be empty", type: "invalid_request_error" } });
    return;
  }

  const model = b.model ?? serverCfg.defaultEmbedModel;
  const maxBatch = serverCfg.maxBatchSize;

  const handle = taskQueue.submit(async () => {
    const allData: OpenAIEmbeddingData[] = [];

    // 分塊處理，避免爆 RAM
    for (let offset = 0; offset < texts.length; offset += maxBatch) {
      const chunk = texts.slice(offset, offset + maxBatch);
      const results = chunk.length === 1
        ? [await embedClient.embed(chunk[0]!)]
        : await embedClient.embed(chunk);

      for (let i = 0; i < results.length; i++) {
        allData.push({
          object: "embedding",
          embedding: results[i]!.dense,
          index: offset + i,
        });
      }
    }

    return allData;
  });

  const data = await handle.promise;

  const response: OpenAIEmbeddingResponse = {
    object: "list",
    data,
    model,
    usage: { prompt_tokens: 0, total_tokens: 0 },
  };

  json(res, 200, response);
});

// ---------- POST /v1/rerank (Cohere/Jina-compatible) ----------
router.post("/v1/rerank", async (_req, res, body) => {
  const b = body as RerankAPIRequest | null;
  if (!b?.query || !b?.documents) {
    json(res, 400, { error: { message: "\"query\" and \"documents\" are required", type: "invalid_request_error" } });
    return;
  }

  const docs = normalizeDocuments(b.documents);
  if (docs.length === 0) {
    json(res, 400, { error: { message: "\"documents\" must not be empty", type: "invalid_request_error" } });
    return;
  }
  if (docs.length > serverCfg.maxDocuments) {
    json(res, 400, {
      error: {
        message: `Too many documents: ${docs.length} exceeds max ${serverCfg.maxDocuments}`,
        type: "invalid_request_error",
      },
    });
    return;
  }

  const topN = b.top_n ?? docs.length;
  const returnDocuments = b.return_documents ?? true;
  const model = b.model ?? serverCfg.defaultRerankModel;

  const handle = taskQueue.submit(async () => {
    const backendDocs: RerankBackendDocument[] = docs.map((text, i) => ({
      doc_id: i,
      content: text,
    }));

    const backendResults = await rerankClient.rerank(b.query, backendDocs, topN);

    const results: RerankAPIResult[] = backendResults.map((r) => {
      const idx = typeof r.doc_id === "number" ? r.doc_id : parseInt(String(r.doc_id), 10);
      const result: RerankAPIResult = {
        index: idx,
        relevance_score: r.score,
      };
      if (returnDocuments) {
        result.document = { text: docs[idx] ?? r.content };
      }
      return result;
    });

    // 依 relevance_score 降序排列
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    return results;
  });

  const results = await handle.promise;

  const response: RerankAPIResponse = {
    model,
    results,
    usage: { total_tokens: 0 },
  };

  json(res, 200, response);
});

// ── Helpers ─────────────────────────────────────────────────

function normalizeInput(input: string | string[]): string[] {
  if (typeof input === "string") return [input];
  return input;
}

function normalizeDocuments(docs: string[] | Array<{ text: string }>): string[] {
  return docs.map((d) => (typeof d === "string" ? d : d.text));
}

// ── Start Server ────────────────────────────────────────────

const server = createServer((req, res) => {
  router.handle(req, res).catch((err) => {
    console.error("Unhandled:", err);
    if (!res.headersSent) {
      json(res, 500, { error: { message: "Internal Server Error", type: "server_error" } });
    }
  });
});

server.listen(serverCfg.port, () => {
  const banner = `
╔══════════════════════════════════════════════════════╗
║  Embed & Reranker Gateway                            ║
║  Port:          ${String(serverCfg.port).padEnd(37)}║
║  Concurrency:   ${String(serverCfg.concurrency).padEnd(37)}║
║  Max Batch:     ${String(serverCfg.maxBatchSize).padEnd(37)}║
║  Max Documents: ${String(serverCfg.maxDocuments).padEnd(37)}║
║  Embed Model:   ${serverCfg.defaultEmbedModel.padEnd(37)}║
║  Rerank Model:  ${serverCfg.defaultRerankModel.padEnd(37)}║
║                                                      ║
║  POST /v1/embeddings  (OpenAI-compatible)            ║
║  POST /v1/rerank      (Cohere/Jina-compatible)       ║
╚══════════════════════════════════════════════════════╝
`;
  process.stdout.write(banner);
});

export { server };
