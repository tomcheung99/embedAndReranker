// ============================================================
// /v1/embed Client — BGE-M3 Dense + Sparse Embedding
// ============================================================

import { HttpClient } from "./base.js";
import type { ClientConfig } from "../config.js";
import type { EmbedRequest, EmbedResponse, EmbedResult } from "../types.js";

export class EmbedClient {
  private readonly http: HttpClient;
  private readonly url: string;

  constructor(config: ClientConfig) {
    this.http = new HttpClient(config);
    this.url = `${config.endpoints.embed.replace(/\/+$/, "")}/v1/embed`;
  }

  /**
   * 取得 dense + sparse 向量。
   * 傳入單筆字串時回傳單筆結果；傳入陣列時回傳陣列。
   */
  async embed(text: string): Promise<EmbedResult>;
  async embed(texts: string[]): Promise<EmbedResult[]>;
  async embed(input: string | string[]): Promise<EmbedResult | EmbedResult[]> {
    const isSingle = typeof input === "string";
    const payload: EmbedRequest = {
      text: input,
      return_dense: true,
      return_sparse: true,
    };

    const res = await this.http.post<EmbedRequest, EmbedResponse>(
      this.url,
      payload,
    );

    if (isSingle) {
      const first = res.results[0];
      if (!first) throw new Error("Embed service returned empty results");
      return first;
    }
    return res.results;
  }

  /** 僅取得 dense 向量（節省傳輸量） */
  async embedDenseOnly(text: string): Promise<number[]> {
    const payload: EmbedRequest = {
      text,
      return_dense: true,
      return_sparse: false,
    };

    const res = await this.http.post<EmbedRequest, EmbedResponse>(
      this.url,
      payload,
    );

    const first = res.results[0];
    if (!first) throw new Error("Embed service returned empty results");
    return first.dense;
  }
}
