// ============================================================
// Reranker Provider — 替換 Vane 本地端 rerank 函式
// ============================================================
//
// 將 Cross-Encoder 推論轉移至遠端微服務，
// 同時保留原始函式簽章以進行 drop-in 替換。
// ============================================================
import { ColbertClient } from "../client/colbert.js";
import { RerankClient } from "../client/rerank.js";
/**
 * 遠端 Reranker Provider — 支援兩階段重排：
 *
 * 1. **ColBERT** (輕量 late-interaction)：大量候選 → 精篩候選
 * 2. **Cross-Encoder** (重量精排)：精篩候選 → 最終排序
 *
 * ```ts
 * const reranker = new RemoteRerankerProvider(config);
 *
 * // 單階段：直接 Cross-Encoder
 * const results = await reranker.rerank(query, docs);
 *
 * // 兩階段漏斗
 * const results = await reranker.rerankTwoStage(query, docs, {
 *   colbertTopK: 20,
 *   rerankTopK: 10,
 * });
 * ```
 */
export class RemoteRerankerProvider {
    colbert;
    rerank;
    constructor(config) {
        this.colbert = new ColbertClient(config);
        this.rerank = new RerankClient(config);
    }
    /**
     * 直接使用 Cross-Encoder 重排（適合候選數 ≤ 20）。
     * 這是 Vane `rerank()` 的 drop-in 替代。
     */
    async rerankDocs(query, documents, topK) {
        const docs = documents.map((d) => ({
            doc_id: d.id,
            content: d.content,
            ...(d.metadata !== undefined && { metadata: d.metadata }),
        }));
        return this.rerank.rerank(query, docs, topK);
    }
    /** 使用 ColBERT 進行輕量重排（適合大量候選的初篩） */
    async colbertRerank(query, candidates, topK) {
        const mapped = candidates.map((c) => ({
            id: c.id,
            content: c.content,
            ...(c.score !== undefined && { score: c.score }),
            ...(c.metadata !== undefined && { metadata: c.metadata }),
        }));
        return this.colbert.rerank(query, mapped, topK);
    }
    /**
     * 兩階段漏斗重排：
     * ColBERT (candidates → colbertTopK) → Cross-Encoder (→ rerankTopK)
     */
    async rerankTwoStage(query, candidates, options) {
        const colbertTopK = options?.colbertTopK ?? 20;
        const rerankTopK = options?.rerankTopK ?? 10;
        // Stage 1: ColBERT 篩選
        const colbertResults = await this.colbert.rerank(query, candidates.map((c) => ({
            id: c.id,
            content: c.content,
            ...(c.score !== undefined && { score: c.score }),
            ...(c.metadata !== undefined && { metadata: c.metadata }),
        })), colbertTopK);
        // Stage 2: Cross-Encoder 精排
        const rerankDocs = colbertResults.map((r) => ({
            doc_id: r.id,
            content: r.content,
            ...(r.metadata !== undefined && { metadata: r.metadata }),
        }));
        return this.rerank.rerank(query, rerankDocs, rerankTopK);
    }
}
//# sourceMappingURL=reranker.js.map