import type { ClientConfig } from "../config.js";
import type { RerankDocument, RerankResult } from "../types.js";
export declare class RerankClient {
    private readonly http;
    private readonly url;
    constructor(config: ClientConfig);
    /**
     * Cross-Encoder 精排。
     * **注意**：此階段計算量最大，只傳入 Top-10 ~ Top-20 候選。
     */
    rerank(query: string, documents: RerankDocument[], topK?: number): Promise<RerankResult[]>;
}
//# sourceMappingURL=rerank.d.ts.map