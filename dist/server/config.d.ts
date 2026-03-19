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
export declare function loadServerConfig(): ServerConfig;
//# sourceMappingURL=config.d.ts.map