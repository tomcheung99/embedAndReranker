// ============================================================
// API Server — HTTP 入口 + 排隊/插隊 + 可調 top_k
// ============================================================
import { createServer } from "node:http";
import { Router, json } from "./router.js";
import { loadServerConfig } from "./config.js";
import { TaskQueue } from "../queue/task-queue.js";
import { RetrievalPipeline } from "../pipeline/retrieval.js";
import { RemoteEmbeddingProvider } from "../providers/embedding.js";
import { RemoteRerankerProvider } from "../providers/reranker.js";
// ── Bootstrap ───────────────────────────────────────────────
const serverCfg = loadServerConfig();
const clientCfg = {
    endpoints: {
        embed: serverCfg.embedUrl,
        retrieve: serverCfg.retrieveUrl,
        colbert: serverCfg.colbertUrl,
        rerank: serverCfg.rerankUrl,
    },
    timeoutMs: serverCfg.timeoutMs,
    maxRetries: serverCfg.maxRetries,
};
const pipeline = new RetrievalPipeline(clientCfg);
const embeddingProvider = new RemoteEmbeddingProvider(clientCfg);
const rerankerProvider = new RemoteRerankerProvider(clientCfg);
const taskQueue = new TaskQueue(serverCfg.concurrency);
// 可 runtime 修改的預設 top_k
let defaults = { ...serverCfg.defaults };
// ── Router Setup ────────────────────────────────────────────
const router = new Router();
// ---------- GET /health ----------
// (handled by Router internally)
// ---------- GET /v1/settings ----------
router.get("/v1/settings", async (_req, res) => {
    json(res, 200, {
        defaults,
        queue: taskQueue.stats(),
    });
});
// ---------- PUT /v1/settings ----------
router.put("/v1/settings", async (_req, res, body) => {
    const b = body;
    if (!b) {
        json(res, 400, { error: "Body required" });
        return;
    }
    if (b.retrieveTopK !== undefined)
        defaults.retrieveTopK = clampTopK(b.retrieveTopK);
    if (b.colbertTopK !== undefined)
        defaults.colbertTopK = clampTopK(b.colbertTopK);
    if (b.rerankTopK !== undefined)
        defaults.rerankTopK = clampTopK(b.rerankTopK);
    json(res, 200, { defaults });
});
// ---------- GET /v1/queue ----------
router.get("/v1/queue", async (_req, res) => {
    json(res, 200, taskQueue.stats());
});
// ---------- POST /v1/search ----------
// 全管線搜尋（排隊）
router.post("/v1/search", async (_req, res, body) => {
    const b = body;
    if (!b?.query) {
        json(res, 400, { error: "\"query\" is required" });
        return;
    }
    const priority = b.priority ?? 10;
    const opts = buildPipelineOptions(b);
    const handle = taskQueue.submit(() => pipeline.run(b.query, opts), priority);
    const result = await handle.promise;
    json(res, 200, {
        task_id: handle.id,
        queue_stats: taskQueue.stats(),
        ...result,
    });
});
// ---------- POST /v1/search/urgent ----------
// 插隊搜尋（priority = 0）
router.post("/v1/search/urgent", async (_req, res, body) => {
    const b = body;
    if (!b?.query) {
        json(res, 400, { error: "\"query\" is required" });
        return;
    }
    const opts = buildPipelineOptions(b);
    const handle = taskQueue.submitUrgent(() => pipeline.run(b.query, opts));
    const result = await handle.promise;
    json(res, 200, {
        task_id: handle.id,
        urgent: true,
        queue_stats: taskQueue.stats(),
        ...result,
    });
});
// ---------- POST /v1/embed ----------
// 直接呼叫 embedding（排隊）
router.post("/v1/embed", async (_req, res, body) => {
    const b = body;
    if (!b?.text) {
        json(res, 400, { error: "\"text\" is required" });
        return;
    }
    const priority = b.priority ?? 10;
    const handle = taskQueue.submit(async () => {
        if (typeof b.text === "string") {
            return embeddingProvider.getTextEmbedding(b.text);
        }
        return embeddingProvider.getTextEmbeddingBatch(b.text);
    }, priority);
    const result = await handle.promise;
    json(res, 200, { task_id: handle.id, results: Array.isArray(result) ? result : [result] });
});
// ---------- POST /v1/rerank ----------
// 直接呼叫 reranker（排隊）
router.post("/v1/rerank", async (_req, res, body) => {
    const b = body;
    if (!b?.query || !b?.documents) {
        json(res, 400, { error: "\"query\" and \"documents\" are required" });
        return;
    }
    const priority = b.priority ?? 10;
    const topK = b.rerank_top_k ?? defaults.rerankTopK;
    const useTwoStage = b.two_stage ?? false;
    const handle = taskQueue.submit(async () => {
        if (useTwoStage) {
            return rerankerProvider.rerankTwoStage(b.query, b.documents, {
                colbertTopK: b.colbert_top_k ?? defaults.colbertTopK,
                rerankTopK: topK,
            });
        }
        return rerankerProvider.rerankDocs(b.query, b.documents, topK);
    }, priority);
    const result = await handle.promise;
    json(res, 200, { task_id: handle.id, results: result });
});
function buildPipelineOptions(b) {
    const opts = {
        retrieveTopK: b.retrieve_top_k ?? defaults.retrieveTopK,
        colbertTopK: b.colbert_top_k ?? defaults.colbertTopK,
        rerankTopK: b.rerank_top_k ?? defaults.rerankTopK,
    };
    if (b.skip_colbert !== undefined)
        opts.skipColbert = b.skip_colbert;
    if (b.collection !== undefined)
        opts.collection = b.collection;
    if (b.filter !== undefined)
        opts.filter = b.filter;
    return opts;
}
function clampTopK(n) {
    return Math.max(1, Math.min(1000, Math.round(n)));
}
// ── Start Server ────────────────────────────────────────────
const server = createServer((req, res) => {
    router.handle(req, res).catch((err) => {
        console.error("Unhandled:", err);
        if (!res.headersSent) {
            json(res, 500, { error: "Internal Server Error" });
        }
    });
});
server.listen(serverCfg.port, () => {
    const banner = `
╔══════════════════════════════════════════════════════╗
║  Embed & Reranker Gateway                            ║
║  Port:        ${String(serverCfg.port).padEnd(39)}║
║  Concurrency: ${String(serverCfg.concurrency).padEnd(39)}║
║  Retrieve K:  ${String(defaults.retrieveTopK).padEnd(39)}║
║  ColBERT K:   ${String(defaults.colbertTopK).padEnd(39)}║
║  Rerank K:    ${String(defaults.rerankTopK).padEnd(39)}║
║  Access Log:  ENABLED                                ║
╚══════════════════════════════════════════════════════╝
`;
    process.stdout.write(banner);
});
export { server };
//# sourceMappingURL=app.js.map