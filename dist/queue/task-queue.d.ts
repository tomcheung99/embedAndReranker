export interface TaskHandle<T> {
    /** 任務 ID */
    id: string;
    /** await 此 promise 取得結果 */
    promise: Promise<T>;
}
export interface QueueStats {
    /** 排隊等待中的任務數 */
    pending: number;
    /** 正在執行中的任務數 */
    running: number;
    /** 最大並發數 */
    concurrency: number;
}
export declare class TaskQueue {
    private readonly queue;
    private running;
    private readonly concurrency;
    /**
     * @param concurrency 同時執行任務數上限（預設 1，序列化執行）
     */
    constructor(concurrency?: number);
    /** 正常排隊。priority 預設 10，數值越小越優先 */
    submit<T>(execute: () => Promise<T>, priority?: number): TaskHandle<T>;
    /** 插隊（priority = 0） */
    submitUrgent<T>(execute: () => Promise<T>): TaskHandle<T>;
    /** 取得佇列狀態 */
    stats(): QueueStats;
    private drain;
    private runTask;
}
//# sourceMappingURL=task-queue.d.ts.map