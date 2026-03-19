import type { ClientConfig } from "../config.js";
import type { ColbertCandidate, ColbertResult } from "../types.js";
export declare class ColbertClient {
    private readonly http;
    private readonly url;
    constructor(config: ClientConfig);
    /**
     * 使用 ColBERT late-interaction 對候選文件重排。
     * 適合在大量候選（50+）中篩選出較精確的 top_k。
     */
    rerank(query: string, candidates: ColbertCandidate[], topK?: number): Promise<ColbertResult[]>;
}
//# sourceMappingURL=colbert.d.ts.map