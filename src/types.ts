// ============================================================
// 共用型別定義 — BGE-M3 + BGE-Reranker-V2-m3 微服務介面
// ============================================================

/** 稀疏向量：token-id → weight */
export type SparseVector = Record<string, number>;

// ── /v1/embed ───────────────────────────────────────────────
export interface EmbedRequest {
  /** 單筆文字或批次文字 */
  text: string | string[];
  /** 是否回傳 dense 向量（預設 true） */
  return_dense?: boolean;
  /** 是否回傳 sparse 向量（預設 true） */
  return_sparse?: boolean;
}

export interface EmbedResult {
  dense: number[];
  sparse: SparseVector;
}

export interface EmbedResponse {
  results: EmbedResult[];
}

// ── /v1/retrieve ────────────────────────────────────────────
export interface RetrieveRequest {
  /** Dense query 向量 */
  query_vector: number[];
  /** Sparse 權重（可選） */
  sparse_weights?: SparseVector;
  /** 回傳候選數量上限 */
  top_k: number;
  /** 指定向量資料庫集合名稱 */
  collection?: string;
  /** 額外過濾條件（依後端 DB 規格） */
  filter?: Record<string, unknown>;
}

export interface RetrievedDoc {
  id: string | number;
  content: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface RetrieveResponse {
  docs: RetrievedDoc[];
}

// ── /v1/colbert ─────────────────────────────────────────────
export interface ColbertRequest {
  query: string;
  candidates: ColbertCandidate[];
  top_k?: number;
}

export interface ColbertCandidate {
  id: string | number;
  content: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface ColbertResult {
  id: string | number;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface ColbertResponse {
  reranked_docs: ColbertResult[];
}

// ── /v1/rerank ──────────────────────────────────────────────
export interface RerankRequest {
  query: string;
  documents: RerankDocument[];
  top_k?: number;
}

export interface RerankDocument {
  doc_id: string | number;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface RerankResult {
  doc_id: string | number;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface RerankResponse {
  results: RerankResult[];
}

// ── Pipeline 統合 ───────────────────────────────────────────
export interface PipelineOptions {
  /** 混合檢索 top_k（預設 50） */
  retrieveTopK?: number;
  /** ColBERT 重排 top_k（預設 20） */
  colbertTopK?: number;
  /** Cross-Encoder 最終重排 top_k（預設 10） */
  rerankTopK?: number;
  /** 向量 DB collection 名稱 */
  collection?: string;
  /** 向量 DB 過濾條件 */
  filter?: Record<string, unknown>;
  /** 是否跳過 ColBERT 階段（預設 false） */
  skipColbert?: boolean;
}

export interface PipelineResult {
  /** 最終排序結果 */
  results: RerankResult[];
  /** 各階段耗時（ms） */
  timing: {
    embed: number;
    retrieve: number;
    colbert?: number;
    rerank: number;
    total: number;
  };
}
