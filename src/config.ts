// ============================================================
// 服務端點組態
// ============================================================

export interface ServiceEndpoints {
  /** Embedding 服務根位址，例如 http://gpu-host:8000 */
  embed: string;
  /** 混合檢索 / Vector Gateway 端點 */
  retrieve: string;
  /** ColBERT 向量重排端點 */
  colbert: string;
  /** Cross-Encoder 最終重排端點 */
  rerank: string;
}

export interface ClientConfig {
  /** 各微服務端點 */
  endpoints: ServiceEndpoints;
  /** 全域請求超時（ms），預設 30_000 */
  timeoutMs?: number;
  /** 重試次數（預設 2） */
  maxRetries?: number;
  /** 重試間隔基數（ms，指數退避，預設 500） */
  retryBaseMs?: number;
  /** 自訂 headers（如 API key） */
  headers?: Record<string, string>;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_MS = 500;

export function resolveConfig(partial: ClientConfig): Required<ClientConfig> {
  return {
    endpoints: partial.endpoints,
    timeoutMs: partial.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxRetries: partial.maxRetries ?? DEFAULT_MAX_RETRIES,
    retryBaseMs: partial.retryBaseMs ?? DEFAULT_RETRY_BASE_MS,
    headers: partial.headers ?? {},
  };
}
