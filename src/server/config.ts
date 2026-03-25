// ============================================================
// Server Config — 環境變數
// ============================================================

import type { LogLevel } from "../logger.js";

export interface ServerConfig {
  /** 監聽埠號 */
  port: number;
  /** 任務佇列並發數 */
  concurrency: number;
  /** Embedding 微服務端點 */
  embedUrl: string;
  /** Reranker 微服務端點 */
  rerankUrl: string;
  /** HTTP 超時（ms） */
  timeoutMs: number;
  /** 重試次數 */
  maxRetries: number;
  /** Embedding 批次大小上限（防止 OOM） */
  maxBatchSize: number;
  /** Rerank 文件數上限（防止 OOM） */
  maxDocuments: number;
  /** 預設 embedding model 名稱（用於 API 回應） */
  defaultEmbedModel: string;
  /** 預設 reranker model 名稱（用於 API 回應） */
  defaultRerankModel: string;
  /** 日誌等級（debug | info） */
  logLevel: LogLevel;
}

export function loadServerConfig(): ServerConfig {
  return {
    port: intEnv("APP_PORT", 3000),
    concurrency: intEnv("CONCURRENCY", 2),
    embedUrl: strEnv("EMBED_URL", "http://localhost:8000"),
    rerankUrl: strEnv("RERANK_URL", "http://localhost:8002"),
    timeoutMs: intEnv("TIMEOUT_MS", 30000),
    maxRetries: intEnv("MAX_RETRIES", 2),
    maxBatchSize: intEnv("MAX_BATCH_SIZE", 64),
    maxDocuments: intEnv("MAX_DOCUMENTS", 1024),
    defaultEmbedModel: strEnv("DEFAULT_EMBED_MODEL", "BAAI/bge-m3"),
    defaultRerankModel: strEnv("DEFAULT_RERANK_MODEL", "BAAI/bge-reranker-v2-m3"),
    logLevel: logLevelEnv("LOG_LEVEL", "info"),
  };
}

function intEnv(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

function strEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function logLevelEnv(key: string, fallback: LogLevel): LogLevel {
  const v = process.env[key]?.toLowerCase();
  if (v === "debug" || v === "info") return v;
  return fallback;
}
