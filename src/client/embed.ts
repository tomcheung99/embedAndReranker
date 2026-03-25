// ============================================================
// Embed Client — Infinity / OpenAI-compatible Embedding
// ============================================================

import { HttpClient } from "./base.js";
import type { ClientConfig } from "../config.js";
import type { EmbedResult } from "../types.js";

/** Infinity / OpenAI embeddings request */
interface InfinityEmbedRequest {
  input: string | string[];
  model?: string;
}

/** Infinity / OpenAI embeddings response */
interface InfinityEmbedResponse {
  data: Array<{ embedding: number[]; index: number }>;
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

export class EmbedClient {
  private readonly http: HttpClient;
  private readonly url: string;

  constructor(config: ClientConfig) {
    this.http = new HttpClient(config);
    this.url = `${config.endpoints.embed.replace(/\/+$/, "")}/embeddings`;
  }

  /**
   * 取得 dense 向量。
   * 傳入單筆字串時回傳單筆結果；傳入陣列時回傳陣列。
   */
  async embed(text: string): Promise<EmbedResult>;
  async embed(texts: string[]): Promise<EmbedResult[]>;
  async embed(input: string | string[]): Promise<EmbedResult | EmbedResult[]> {
    const isSingle = typeof input === "string";
    const payload: InfinityEmbedRequest = { input };

    const res = await this.http.post<InfinityEmbedRequest, InfinityEmbedResponse>(
      this.url,
      payload,
    );

    const results: EmbedResult[] = res.data
      .sort((a, b) => a.index - b.index)
      .map((d) => ({ dense: d.embedding, sparse: {} }));

    if (isSingle) {
      const first = results[0];
      if (!first) throw new Error("Embed service returned empty results");
      return first;
    }
    return results;
  }

  /** 僅取得 dense 向量（節省傳輸量） */
  async embedDenseOnly(text: string): Promise<number[]> {
    const payload: InfinityEmbedRequest = { input: text };

    const res = await this.http.post<InfinityEmbedRequest, InfinityEmbedResponse>(
      this.url,
      payload,
    );

    const first = res.data[0];
    if (!first) throw new Error("Embed service returned empty results");
    return first.embedding;
  }
}
