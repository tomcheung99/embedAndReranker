// ============================================================
// Task Queue — 排隊 + 插隊 + 並發控制
// ============================================================
//
// 將 PriorityQueue 與 async 任務執行結合：
//   - 控制同時執行的任務數量（concurrency）
//   - 支援正常排隊 / 插隊
//   - 每筆任務回傳 Promise，提交者可 await 結果
//   - 提供佇列狀態查詢
// ============================================================
import { PriorityQueue } from "./priority-queue.js";
let taskCounter = 0;
function nextTaskId() {
    return `task-${Date.now()}-${++taskCounter}`;
}
export class TaskQueue {
    queue = new PriorityQueue();
    running = 0;
    concurrency;
    /**
     * @param concurrency 同時執行任務數上限（預設 1，序列化執行）
     */
    constructor(concurrency = 1) {
        this.concurrency = Math.max(1, concurrency);
    }
    /** 正常排隊。priority 預設 10，數值越小越優先 */
    submit(execute, priority = 10) {
        const id = nextTaskId();
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        const task = {
            id,
            execute: execute,
            resolve: resolve,
            reject,
            priority,
            enqueuedAt: Date.now(),
        };
        this.queue.enqueue(task, priority);
        this.drain();
        return { id, promise };
    }
    /** 插隊（priority = 0） */
    submitUrgent(execute) {
        return this.submit(execute, 0);
    }
    /** 取得佇列狀態 */
    stats() {
        return {
            pending: this.queue.size,
            running: this.running,
            concurrency: this.concurrency,
        };
    }
    // ── 內部排程 ─────────────────────────────────────────────
    drain() {
        while (this.running < this.concurrency && !this.queue.isEmpty) {
            const task = this.queue.dequeue();
            if (!task)
                break;
            this.running++;
            this.runTask(task);
        }
    }
    runTask(task) {
        task
            .execute()
            .then((result) => task.resolve(result))
            .catch((err) => task.reject(err))
            .finally(() => {
            this.running--;
            this.drain();
        });
    }
}
//# sourceMappingURL=task-queue.js.map