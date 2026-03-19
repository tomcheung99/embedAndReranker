import type { ClientConfig } from "../config.js";
import type { ColbertResult, RerankResult } from "../types.js";
export interface RerankableDoc {
    id: string | number;
    content: string;
    score?: number;
    metadata?: Record<string, unknown>;
}
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
export declare class RemoteRerankerProvider {
    private readonly colbert;
    private readonly rerank;
    constructor(config: ClientConfig);
    /**
     * 直接使用 Cross-Encoder 重排（適合候選數 ≤ 20）。
     * 這是 Vane `rerank()` 的 drop-in 替代。
     */
    rerankDocs(query: string, documents: RerankableDoc[], topK?: number): Promise<RerankResult[]>;
    /** 使用 ColBERT 進行輕量重排（適合大量候選的初篩） */
    colbertRerank(query: string, candidates: RerankableDoc[], topK?: number): Promise<ColbertResult[]>;
    /**
     * 兩階段漏斗重排：
     * ColBERT (candidates → colbertTopK) → Cross-Encoder (→ rerankTopK)
     */
    rerankTwoStage(query: string, candidates: RerankableDoc[], options?: {
        colbertTopK?: number;
        rerankTopK?: number;
    }): Promise<RerankResult[]>;
}
//# sourceMappingURL=reranker.d.ts.map