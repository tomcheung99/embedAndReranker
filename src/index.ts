// ============================================================
// embedAndReranker — 公開 API
// ============================================================

// Config
export { type ClientConfig, type ServiceEndpoints, resolveConfig } from "./config.js";

// Types — Internal backend types
export type {
  EmbedRequest,
  EmbedResult,
  EmbedResponse,
  RerankBackendRequest,
  RerankBackendDocument,
  RerankBackendResult,
  RerankBackendResponse,
} from "./types.js";

// Types — OpenAI-compatible API
export type {
  OpenAIEmbeddingRequest,
  OpenAIEmbeddingData,
  OpenAIEmbeddingResponse,
} from "./types.js";

// Types — Cohere/Jina-compatible API
export type {
  RerankAPIRequest,
  RerankAPIResult,
  RerankAPIResponse,
} from "./types.js";

// Low-level clients
export { HttpClient, ServiceError } from "./client/base.js";
export { EmbedClient } from "./client/embed.js";
export { RerankClient } from "./client/rerank.js";

// Queue system
export { PriorityQueue } from "./queue/priority-queue.js";
export { TaskQueue, type TaskHandle, type QueueStats } from "./queue/task-queue.js";

// Server config
export { loadServerConfig, type ServerConfig } from "./server/config.js";
