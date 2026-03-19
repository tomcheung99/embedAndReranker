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
export declare function resolveConfig(partial: ClientConfig): Required<ClientConfig>;
//# sourceMappingURL=config.d.ts.map