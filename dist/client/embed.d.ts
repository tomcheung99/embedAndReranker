import type { ClientConfig } from "../config.js";
import type { EmbedResult } from "../types.js";
export declare class EmbedClient {
    private readonly http;
    private readonly url;
    constructor(config: ClientConfig);
    /**
     * 取得 dense + sparse 向量。
     * 傳入單筆字串時回傳單筆結果；傳入陣列時回傳陣列。
     */
    embed(text: string): Promise<EmbedResult>;
    embed(texts: string[]): Promise<EmbedResult[]>;
    /** 僅取得 dense 向量（節省傳輸量） */
    embedDenseOnly(text: string): Promise<number[]>;
}
//# sourceMappingURL=embed.d.ts.map