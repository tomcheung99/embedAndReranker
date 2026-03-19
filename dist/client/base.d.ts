import { type ClientConfig } from "../config.js";
export declare class HttpClient {
    private readonly timeoutMs;
    private readonly maxRetries;
    private readonly retryBaseMs;
    private readonly headers;
    constructor(config: ClientConfig);
    post<TReq, TRes>(url: string, body: TReq): Promise<TRes>;
}
export declare class ServiceError extends Error {
    readonly status: number;
    constructor(message: string, status: number);
}
//# sourceMappingURL=base.d.ts.map