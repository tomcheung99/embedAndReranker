import type { ClientConfig } from "../config.js";
import type { RetrievedDoc, SparseVector } from "../types.js";
export declare class RetrieveClient {
    private readonly http;
    private readonly url;
    constructor(config: ClientConfig);
    /**
     * 混合檢索：同時利用 dense 向量與 sparse 權重進行 Hybrid Search。
     * 後端資料庫負責 RRF 或其他融合演算法。
     */
    retrieve(params: {
        queryVector: number[];
        sparseWeights?: SparseVector;
        topK?: number;
        collection?: string;
        filter?: Record<string, unknown>;
    }): Promise<RetrievedDoc[]>;
}
//# sourceMappingURL=retrieve.d.ts.map