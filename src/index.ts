// ============================================================
// embedAndReranker — 公開 API
// ============================================================

// Config
export { type ClientConfig, type ServiceEndpoints, resolveConfig } from "./config.js";

// Types
export type {
  SparseVector,
  EmbedRequest,
  EmbedResult,
  EmbedResponse,
  RetrieveRequest,
  RetrievedDoc,
  RetrieveResponse,
  ColbertRequest,
  ColbertCandidate,
  ColbertResult,
  ColbertResponse,
  RerankRequest,
  RerankDocument,
  RerankResult,
  RerankResponse,
  PipelineOptions,
  PipelineResult,
} from "./types.js";

// Low-level clients
export { HttpClient, ServiceError } from "./client/base.js";
export { EmbedClient } from "./client/embed.js";
export { RetrieveClient } from "./client/retrieve.js";
export { ColbertClient } from "./client/colbert.js";
export { RerankClient } from "./client/rerank.js";

// High-level providers (drop-in replacements)
export { RemoteEmbeddingProvider, type EmbeddingOutput } from "./providers/embedding.js";
export { RemoteRerankerProvider, type RerankableDoc } from "./providers/reranker.js";

// Pipeline orchestrator
export { RetrievalPipeline } from "./pipeline/retrieval.js";

// Queue system
export { PriorityQueue } from "./queue/priority-queue.js";
export { TaskQueue, type TaskHandle, type QueueStats } from "./queue/task-queue.js";

// Server config
export { loadServerConfig, type ServerConfig, type TopKDefaults, type TopKOverrides } from "./server/config.js";
