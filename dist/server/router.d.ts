import type { IncomingMessage, ServerResponse } from "node:http";
type Handler = (req: IncomingMessage, res: ServerResponse, body: unknown) => Promise<void>;
export declare class Router {
    private routes;
    post(path: string, handler: Handler): void;
    get(path: string, handler: Handler): void;
    put(path: string, handler: Handler): void;
    handle(req: IncomingMessage, res: ServerResponse): Promise<void>;
}
/** 回傳 JSON */
export declare function json(res: ServerResponse, status: number, data: unknown): void;
export {};
//# sourceMappingURL=router.d.ts.map