// ============================================================
// /v1/rerank Client — Cross-Encoder 最終精排
// ============================================================
import { HttpClient } from "./base.js";
export class RerankClient {
    http;
    url;
    constructor(config) {
        this.http = new HttpClient(config);
        this.url = `${config.endpoints.rerank.replace(/\/+$/, "")}/v1/rerank`;
    }
    /**
     * Cross-Encoder 精排。
     * **注意**：此階段計算量最大，只傳入 Top-10 ~ Top-20 候選。
     */
    async rerank(query, documents, topK) {
        const payload = {
            query,
            documents,
            ...(topK !== undefined && { top_k: topK }),
        };
        const res = await this.http.post(this.url, payload);
        return res.results;
    }
}
//# sourceMappingURL=rerank.js.map