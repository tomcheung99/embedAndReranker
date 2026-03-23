// ============================================================
// 型別定義 — OpenAI-compatible Embedding + Rerank API
// ============================================================

// ── 內部：後端 BGE-M3 Embedding 服務 ────────────────────────

export interface EmbedRequest {
  text: string | string[];
  return_dense?: boolean;
  return_sparse?: boolean;
}

export interface EmbedResult {
  dense: number[];
  sparse: Record<string, number>;
}

export interface EmbedResponse {
  results: EmbedResult[];
}

// ── 內部：後端 BGE-Reranker 服務 ────────────────────────────

export interface RerankBackendRequest {
  query: string;
  documents: RerankBackendDocument[];
  top_k?: number;
}

export interface RerankBackendDocument {
  doc_id: string | number;
  content: string;
}

export interface RerankBackendResult {
  doc_id: string | number;
  content: string;
  score: number;
}

export interface RerankBackendResponse {
  results: RerankBackendResult[];
}

// ── 公開 API：OpenAI-compatible /v1/embeddings ──────────────

export interface OpenAIEmbeddingRequest {
  input: string | string[];
  model?: string;
  encoding_format?: "float" | "base64";
}

export interface OpenAIEmbeddingData {
  object: "embedding";
  embedding: number[];
  index: number;
}

export interface OpenAIEmbeddingResponse {
  object: "list";
  data: OpenAIEmbeddingData[];
  model: string;
  usage: { prompt_tokens: number; total_tokens: number };
}

// ── 公開 API：Cohere/Jina-compatible /v1/rerank ─────────────

export interface RerankAPIRequest {
  model?: string;
  query: string;
  documents: string[] | Array<{ text: string }>;
  top_n?: number;
  return_documents?: boolean;
}

export interface RerankAPIResult {
  index: number;
  relevance_score: number;
  document?: { text: string };
}

export interface RerankAPIResponse {
  model: string;
  results: RerankAPIResult[];
  usage: { total_tokens: number };
}
