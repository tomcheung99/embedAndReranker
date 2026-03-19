import type { ClientConfig } from "../config.js";
import type { SparseVector } from "../types.js";
export interface EmbeddingOutput {
    dense: number[];
    sparse: SparseVector;
}
/**
 * 遠端 Embedding Provider。
 *
 * ```ts
 * const provider = new RemoteEmbeddingProvider(config);
 * const { dense, sparse } = await provider.getTextEmbedding("你的查詢");
 * ```
 */
export declare class RemoteEmbeddingProvider {
    private readonly client;
    constructor(config: ClientConfig);
    /** 取得單筆文字的 dense + sparse 向量 */
    getTextEmbedding(text: string): Promise<EmbeddingOutput>;
    /** 批次取得多筆文字的 embedding */
    getTextEmbeddingBatch(texts: string[]): Promise<EmbeddingOutput[]>;
    /** 取得 query 向量（在 BGE-M3 中 query 與 document 使用相同模型） */
    getQueryEmbedding(query: string): Promise<EmbeddingOutput>;
}
//# sourceMappingURL=embedding.d.ts.map