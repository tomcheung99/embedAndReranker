// ============================================================
// 服務端點組態
// ============================================================
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_MS = 500;
export function resolveConfig(partial) {
    return {
        endpoints: partial.endpoints,
        timeoutMs: partial.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxRetries: partial.maxRetries ?? DEFAULT_MAX_RETRIES,
        retryBaseMs: partial.retryBaseMs ?? DEFAULT_RETRY_BASE_MS,
        headers: partial.headers ?? {},
    };
}
//# sourceMappingURL=config.js.map