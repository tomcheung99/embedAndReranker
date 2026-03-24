// ============================================================
// 基礎 HTTP Client — 封裝 fetch + 重試 + 超時 + 指數退避
// ============================================================

import { resolveConfig, type ClientConfig } from "../config.js";
import { logDebug } from "../logger.js";

export class HttpClient {
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseMs: number;
  private readonly headers: Record<string, string>;

  constructor(config: ClientConfig) {
    const resolved = resolveConfig(config);
    this.timeoutMs = resolved.timeoutMs;
    this.maxRetries = resolved.maxRetries;
    this.retryBaseMs = resolved.retryBaseMs;
    this.headers = resolved.headers;
  }

  async post<TReq, TRes>(url: string, body: TReq): Promise<TRes> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = this.retryBaseMs * 2 ** (attempt - 1);
        logDebug(`backend retry: url=${url}, attempt=${attempt}/${this.maxRetries}, delay=${delay}ms`);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      const start = Date.now();

      try {
        logDebug(`backend request: POST ${url} (attempt ${attempt + 1}/${this.maxRetries + 1})`);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.headers,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          logDebug(`backend error: POST ${url} -> ${res.status} (${Date.now() - start}ms)`);
          throw new ServiceError(
            `HTTP ${res.status} from ${url}: ${text}`,
            res.status,
          );
        }

        logDebug(`backend response: POST ${url} -> ${res.status} (${Date.now() - start}ms)`);
        return (await res.json()) as TRes;
      } catch (err) {
        lastError = errorWithCause(err);

        // 不重試 4xx 客戶端錯誤（除了 429 Too Many Requests）
        if (
          err instanceof ServiceError &&
          err.status >= 400 &&
          err.status < 500 &&
          err.status !== 429
        ) {
          throw err;
        }
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError ?? new Error(`Request to ${url} failed after retries`);
  }
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/**
 * 將 Error.cause 鏈展開，附加到訊息中以便除錯
 * 例如 "fetch failed" → "fetch failed: connect ECONNREFUSED 127.0.0.1:8000"
 */
function errorWithCause(err: unknown): Error {
  if (!(err instanceof Error)) return new Error(String(err));
  if (!err.cause) return err;

  const detail = describeCause(err.cause);
  if (!detail) return err;

  return new Error(`${err.message}: ${detail}`);
}

/** 從 Error.cause（含 AggregateError）中提取可讀描述 */
function describeCause(cause: unknown): string {
  if (!(cause instanceof Error)) return cause ? String(cause) : "";

  // AggregateError（Node.js fetch ECONNREFUSED 等）會把細節放在 .errors 陣列
  if (cause instanceof AggregateError && cause.errors.length > 0) {
    return cause.errors.map((e) => e.message || String(e)).join(", ");
  }

  // 一般 Error：優先用 message，沒有的話用 code
  if (cause.message) return cause.message;
  const code = (cause as NodeJS.ErrnoException).code;
  if (code) return code;
  return String(cause);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
