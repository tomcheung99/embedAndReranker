// ============================================================
// /v1/colbert Client — ColBERT 向量重排（過濾漏斗）
// ============================================================
import { HttpClient } from "./base.js";
export class ColbertClient {
    http;
    url;
    constructor(config) {
        this.http = new HttpClient(config);
        this.url = `${config.endpoints.colbert.replace(/\/+$/, "")}/v1/colbert`;
    }
    /**
     * 使用 ColBERT late-interaction 對候選文件重排。
     * 適合在大量候選（50+）中篩選出較精確的 top_k。
     */
    async rerank(query, candidates, topK) {
        const payload = {
            query,
            candidates,
            ...(topK !== undefined && { top_k: topK }),
        };
        const res = await this.http.post(this.url, payload);
        return res.reranked_docs;
    }
}
//# sourceMappingURL=colbert.js.map