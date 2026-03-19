// ============================================================
// /v1/embed Client — BGE-M3 Dense + Sparse Embedding
// ============================================================
import { HttpClient } from "./base.js";
export class EmbedClient {
    http;
    url;
    constructor(config) {
        this.http = new HttpClient(config);
        this.url = `${config.endpoints.embed.replace(/\/+$/, "")}/v1/embed`;
    }
    async embed(input) {
        const isSingle = typeof input === "string";
        const payload = {
            text: input,
            return_dense: true,
            return_sparse: true,
        };
        const res = await this.http.post(this.url, payload);
        if (isSingle) {
            const first = res.results[0];
            if (!first)
                throw new Error("Embed service returned empty results");
            return first;
        }
        return res.results;
    }
    /** 僅取得 dense 向量（節省傳輸量） */
    async embedDenseOnly(text) {
        const payload = {
            text,
            return_dense: true,
            return_sparse: false,
        };
        const res = await this.http.post(this.url, payload);
        const first = res.results[0];
        if (!first)
            throw new Error("Embed service returned empty results");
        return first.dense;
    }
}
//# sourceMappingURL=embed.js.map