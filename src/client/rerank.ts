// ============================================================
// /v1/rerank Client — Cross-Encoder 精排
// ============================================================

import { HttpClient } from "./base.js";
import type { ClientConfig } from "../config.js";
import type {
  RerankBackendRequest,
  RerankBackendResponse,
  RerankBackendDocument,
  RerankBackendResult,
} from "../types.js";

export class RerankClient {
  private readonly http: HttpClient;
  private readonly url: string;

  constructor(config: ClientConfig) {
    this.http = new HttpClient(config);
    this.url = `${config.endpoints.rerank.replace(/\/+$/, "")}/v1/rerank`;
  }

  async rerank(
    query: string,
    documents: RerankBackendDocument[],
    topK?: number,
  ): Promise<RerankBackendResult[]> {
    const payload: RerankBackendRequest = {
      query,
      documents,
      ...(topK !== undefined && { top_k: topK }),
    };

    const res = await this.http.post<RerankBackendRequest, RerankBackendResponse>(
      this.url,
      payload,
    );

    return res.results;
  }
}
