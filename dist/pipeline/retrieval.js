// ============================================================
// Retrieval Pipeline Orchestrator
// ============================================================
//
// 將四階段微服務串聯為單一管線：
//   Query → Embed → Retrieve → (ColBERT) → Rerank → Results
//
// 支援跳過 ColBERT 階段（小型候選集場景），
// 並在每個階段紀錄精確耗時供監控 / 日誌使用。
// ============================================================
import { EmbedClient } from "../client/embed.js";
import { RetrieveClient } from "../client/retrieve.js";
import { ColbertClient } from "../client/colbert.js";
import { RerankClient } from "../client/rerank.js";
export class RetrievalPipeline {
    embed;
    retrieve;
    colbert;
    rerank;
    constructor(config) {
        this.embed = new EmbedClient(config);
        this.retrieve = new RetrieveClient(config);
        this.colbert = new ColbertClient(config);
        this.rerank = new RerankClient(config);
    }
    /**
     * 執行完整的檢索 → 重排管線。
     *
     * ```
     * ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
     * │  Embed   │───▶│ Retrieve  │───▶│ ColBERT  │───▶│  Rerank  │
     * │ (BGE-M3) │    │ (Hybrid)  │    │ (filter) │    │ (CE)     │
     * └──────────┘    └───────────┘    └──────────┘    └──────────┘
     *   dense+sparse    top_k=50        top_k=20        top_k=10
     * ```
     */
    async run(query, options) {
        const retrieveTopK = options?.retrieveTopK ?? 50;
        const colbertTopK = options?.colbertTopK ?? 20;
        const rerankTopK = options?.rerankTopK ?? 10;
        const skipColbert = options?.skipColbert ?? false;
        const totalStart = performance.now();
        // ── Stage 1: Embed ──────────────────────────────────────
        const embedStart = performance.now();
        const embedResult = await this.embed.embed(query);
        const embedTime = performance.now() - embedStart;
        // ── Stage 2: Retrieve ───────────────────────────────────
        const retrieveStart = performance.now();
        const retrieveParams = {
            queryVector: embedResult.dense,
            sparseWeights: embedResult.sparse,
            topK: retrieveTopK,
        };
        if (options?.collection !== undefined)
            retrieveParams.collection = options.collection;
        if (options?.filter !== undefined)
            retrieveParams.filter = options.filter;
        const docs = await this.retrieve.retrieve(retrieveParams);
        const retrieveTime = performance.now() - retrieveStart;
        // ── Stage 3: ColBERT（可選） ────────────────────────────
        let colbertTime;
        let candidatesForRerank;
        if (!skipColbert && docs.length > colbertTopK) {
            const colbertStart = performance.now();
            const colbertCandidates = docs.map((d) => ({
                id: d.id,
                content: d.content,
                ...(d.score !== undefined && { score: d.score }),
                ...(d.metadata !== undefined && { metadata: d.metadata }),
            }));
            const colbertResults = await this.colbert.rerank(query, colbertCandidates, colbertTopK);
            colbertTime = performance.now() - colbertStart;
            candidatesForRerank = colbertResults;
        }
        else {
            candidatesForRerank = docs;
        }
        // ── Stage 4: Cross-Encoder Rerank ───────────────────────
        const rerankStart = performance.now();
        const rerankDocs = candidatesForRerank.map((d) => ({
            doc_id: d.id,
            content: d.content,
            ...(d.metadata !== undefined && { metadata: d.metadata }),
        }));
        const results = await this.rerank.rerank(query, rerankDocs, rerankTopK);
        const rerankTime = performance.now() - rerankStart;
        const totalTime = performance.now() - totalStart;
        const timing = {
            embed: Math.round(embedTime),
            retrieve: Math.round(retrieveTime),
            rerank: Math.round(rerankTime),
            total: Math.round(totalTime),
        };
        if (colbertTime !== undefined)
            timing.colbert = Math.round(colbertTime);
        return { results, timing };
    }
}
//# sourceMappingURL=retrieval.js.map