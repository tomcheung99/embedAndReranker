// ============================================================
// /v1/retrieve Client — 混合檢索 / Vector Gateway
// ============================================================

import { HttpClient } from "./base.js";
import type { ClientConfig } from "../config.js";
import type {
  RetrieveRequest,
  RetrieveResponse,
  RetrievedDoc,
  SparseVector,
} from "../types.js";

export class RetrieveClient {
  private readonly http: HttpClient;
  private readonly url: string;

  constructor(config: ClientConfig) {
    this.http = new HttpClient(config);
    this.url = `${config.endpoints.retrieve.replace(/\/+$/, "")}/v1/retrieve`;
  }

  /**
   * 混合檢索：同時利用 dense 向量與 sparse 權重進行 Hybrid Search。
   * 後端資料庫負責 RRF 或其他融合演算法。
   */
  async retrieve(params: {
    queryVector: number[];
    sparseWeights?: SparseVector;
    topK?: number;
    collection?: string;
    filter?: Record<string, unknown>;
  }): Promise<RetrievedDoc[]> {
    const payload: RetrieveRequest = {
      query_vector: params.queryVector,
      top_k: params.topK ?? 50,
      ...(params.sparseWeights !== undefined && { sparse_weights: params.sparseWeights }),
      ...(params.collection !== undefined && { collection: params.collection }),
      ...(params.filter !== undefined && { filter: params.filter }),
    };

    const res = await this.http.post<RetrieveRequest, RetrieveResponse>(
      this.url,
      payload,
    );

    return res.docs;
  }
}
