// ============================================================
// 基礎 HTTP Client — 封裝 fetch + 重試 + 超時 + 指數退避
// ============================================================

import { resolveConfig, type ClientConfig } from "../config.js";

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
        await sleep(delay);
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
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
          throw new ServiceError(
            `HTTP ${res.status} from ${url}: ${text}`,
            res.status,
          );
        }

        return (await res.json()) as TRes;
      } catch (err) {
        lastError =
          err instanceof Error ? err : new Error(String(err));

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
