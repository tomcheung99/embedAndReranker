// ============================================================
// Rerank Client — Infinity / Jina-compatible Reranking
// ============================================================

import { HttpClient } from "./base.js";
import type { ClientConfig } from "../config.js";
import type {
  RerankBackendDocument,
  RerankBackendResult,
} from "../types.js";

/** Infinity / Jina rerank request */
interface InfinityRerankRequest {
  query: string;
  documents: string[];
  model: string;
  top_n?: number;
}

/** Infinity / Jina rerank result */
interface InfinityRerankResult {
  index: number;
  relevance_score: number;
  document?: { text: string };
}

/** Infinity / Jina rerank response */
interface InfinityRerankResponse {
  results: InfinityRerankResult[];
}

export class RerankClient {
  private readonly http: HttpClient;
  private readonly url: string;

  private readonly defaultModel: string;

  constructor(config: ClientConfig, defaultModel = "BAAI/bge-reranker-v2-m3") {
    this.http = new HttpClient(config);
    this.url = `${config.endpoints.rerank.replace(/\/+$/, "")}/rerank`;
    this.defaultModel = defaultModel;
  }

  async rerank(
    query: string,
    documents: RerankBackendDocument[],
    topK?: number,
    model?: string,
  ): Promise<RerankBackendResult[]> {
    const payload: InfinityRerankRequest = {
      query,
      documents: documents.map((d) => d.content),
      model: model ?? this.defaultModel,
      ...(topK !== undefined && { top_n: topK }),
    };

    const res = await this.http.post<InfinityRerankRequest, InfinityRerankResponse>(
      this.url,
      payload,
    );

    return res.results.map((r) => ({
      doc_id: r.index,
      content: r.document?.text ?? documents[r.index]?.content ?? "",
      score: r.relevance_score,
    }));
  }
}
