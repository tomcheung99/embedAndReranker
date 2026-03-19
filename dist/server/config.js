// ============================================================
// Server Config — 環境變數 + API 可調參數
// ============================================================
export function loadServerConfig() {
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
function intEnv(key, fallback) {
    const v = process.env[key];
    if (v === undefined || v === "")
        return fallback;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? fallback : n;
}
function strEnv(key, fallback) {
    return process.env[key] ?? fallback;
}
//# sourceMappingURL=config.js.map