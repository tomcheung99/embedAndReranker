// ============================================================
// /v1/rerank Client — Cross-Encoder 最終精排
// ============================================================

import { HttpClient } from "./base.js";
import type { ClientConfig } from "../config.js";
import type {
  RerankRequest,
  RerankResponse,
  RerankDocument,
  RerankResult,
} from "../types.js";

export class RerankClient {
  private readonly http: HttpClient;
  private readonly url: string;

  constructor(config: ClientConfig) {
    this.http = new HttpClient(config);
    this.url = `${config.endpoints.rerank.replace(/\/+$/, "")}/v1/rerank`;
  }

  /**
   * Cross-Encoder 精排。
   * **注意**：此階段計算量最大，只傳入 Top-10 ~ Top-20 候選。
   */
  async rerank(
    query: string,
    documents: RerankDocument[],
    topK?: number,
  ): Promise<RerankResult[]> {
    const payload: RerankRequest = {
      query,
      documents,
      ...(topK !== undefined && { top_k: topK }),
    };

    const res = await this.http.post<RerankRequest, RerankResponse>(
      this.url,
      payload,
    );

    return res.results;
  }
}
