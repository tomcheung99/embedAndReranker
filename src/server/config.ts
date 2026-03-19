// ============================================================
// Server Config — 環境變數 + API 可調參數
// ============================================================

export interface ServerConfig {
  /** 監聽埠號 */
  port: number;
  /** 任務佇列並發數 */
  concurrency: number;
  /** 各微服務端點 */
  embedUrl: string;
  retrieveUrl: string;
  colbertUrl: string;
  rerankUrl: string;
  /** HTTP 超時（ms） */
  timeoutMs: number;
  /** 重試次數 */
  maxRetries: number;
  /** 預設 Top-K 設定（可透過 API 覆寫） */
  defaults: TopKDefaults;
}

export interface TopKDefaults {
  retrieveTopK: number;
  colbertTopK: number;
  rerankTopK: number;
}

/** API 請求中可覆寫的 top_k */
export interface TopKOverrides {
  retrieve_top_k?: number;
  colbert_top_k?: number;
  rerank_top_k?: number;
}

export function loadServerConfig(): ServerConfig {
  return {
    port: intEnv("PORT", 3000),
    concurrency: intEnv("CONCURRENCY", 2),
    embedUrl: strEnv("EMBED_URL", "http://localhost:8000"),
    retrieveUrl: strEnv("RETRIEVE_URL", "http://localhost:8100"),
    colbertUrl: strEnv("COLBERT_URL", "http://localhost:8001"),
    rerankUrl: strEnv("RERANK_URL", "http://localhost:8002"),
    timeoutMs: intEnv("TIMEOUT_MS", 30000),
    maxRetries: intEnv("MAX_RETRIES", 2),
    defaults: {
      retrieveTopK: intEnv("DEFAULT_RETRIEVE_TOP_K", 50),
      colbertTopK: intEnv("DEFAULT_COLBERT_TOP_K", 20),
      rerankTopK: intEnv("DEFAULT_RERANK_TOP_K", 10),
    },
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
