// ============================================================
// BaseEmbedding Provider — 替換 Vane 本地端 Embedding 推論
// ============================================================
//
// 實作與 LlamaIndex / Vane 的 BaseEmbedding 介面相容的提供者，
// 讓所有依賴 embedding 的程式碼只需替換 provider 即可無縫遷移。
// ============================================================

import { EmbedClient } from "../client/embed.js";
import type { ClientConfig } from "../config.js";
import type { EmbedResult, SparseVector } from "../types.js";

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
export class RemoteEmbeddingProvider {
  private readonly client: EmbedClient;

  constructor(config: ClientConfig) {
    this.client = new EmbedClient(config);
  }

  /** 取得單筆文字的 dense + sparse 向量 */
  async getTextEmbedding(text: string): Promise<EmbeddingOutput> {
    const result: EmbedResult = await this.client.embed(text);
    return { dense: result.dense, sparse: result.sparse };
  }

  /** 批次取得多筆文字的 embedding */
  async getTextEmbeddingBatch(texts: string[]): Promise<EmbeddingOutput[]> {
    const results: EmbedResult[] = await this.client.embed(texts);
    return results.map((r) => ({ dense: r.dense, sparse: r.sparse }));
  }

  /** 取得 query 向量（在 BGE-M3 中 query 與 document 使用相同模型） */
  async getQueryEmbedding(query: string): Promise<EmbeddingOutput> {
    return this.getTextEmbedding(query);
  }
}
