// ============================================================
// HTTP Router — 輕量路由（零依賴）
// ============================================================
export class Router {
    routes = [];
    post(path, handler) {
        this.routes.push({ method: "POST", path, handler });
    }
    get(path, handler) {
        this.routes.push({ method: "GET", path, handler });
    }
    put(path, handler) {
        this.routes.push({ method: "PUT", path, handler });
    }
    async handle(req, res) {
        const method = req.method ?? "GET";
        const url = req.url ?? "/";
        // 健康檢查
        if (url === "/health" && method === "GET") {
            json(res, 200, { status: "ok" });
            return;
        }
        const route = this.routes.find((r) => r.method === method && r.path === url);
        if (!route) {
            json(res, 404, { error: "Not Found" });
            return;
        }
        try {
            const body = method === "GET" ? null : await parseBody(req);
            await route.handler(req, res, body);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[${method} ${url}] Error:`, message);
            json(res, 500, { error: message });
        }
    }
}
/** 回傳 JSON */
export function json(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
}
/** 解析 request body（限制 10 MB） */
function parseBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        const MAX = 10 * 1024 * 1024; // 10 MB
        req.on("data", (chunk) => {
            size += chunk.length;
            if (size > MAX) {
                req.destroy();
                reject(new Error("Request body too large"));
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => {
            try {
                const raw = Buffer.concat(chunks).toString("utf-8");
                resolve(raw ? JSON.parse(raw) : null);
            }
            catch {
                reject(new Error("Invalid JSON body"));
            }
        });
        req.on("error", reject);
    });
}
//# sourceMappingURL=router.js.map