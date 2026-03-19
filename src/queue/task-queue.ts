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

/** 排隊中的任務 */
interface QueuedTask<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
  priority: number;
  enqueuedAt: number;
}

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

let taskCounter = 0;
function nextTaskId(): string {
  return `task-${Date.now()}-${++taskCounter}`;
}

export class TaskQueue {
  private readonly queue = new PriorityQueue<QueuedTask<unknown>>();
  private running = 0;
  private readonly concurrency: number;

  /**
   * @param concurrency 同時執行任務數上限（預設 1，序列化執行）
   */
  constructor(concurrency = 1) {
    this.concurrency = Math.max(1, concurrency);
  }

  /** 正常排隊。priority 預設 10，數值越小越優先 */
  submit<T>(execute: () => Promise<T>, priority = 10): TaskHandle<T> {
    const id = nextTaskId();
    let resolve!: (value: T) => void;
    let reject!: (err: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const task: QueuedTask<unknown> = {
      id,
      execute: execute as () => Promise<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
      priority,
      enqueuedAt: Date.now(),
    };

    this.queue.enqueue(task, priority);
    this.drain();

    return { id, promise };
  }

  /** 插隊（priority = 0） */
  submitUrgent<T>(execute: () => Promise<T>): TaskHandle<T> {
    return this.submit(execute, 0);
  }

  /** 取得佇列狀態 */
  stats(): QueueStats {
    return {
      pending: this.queue.size,
      running: this.running,
      concurrency: this.concurrency,
    };
  }

  // ── 內部排程 ─────────────────────────────────────────────
  private drain(): void {
    while (this.running < this.concurrency && !this.queue.isEmpty) {
      const task = this.queue.dequeue();
      if (!task) break;
      this.running++;
      this.runTask(task);
    }
  }

  private runTask(task: QueuedTask<unknown>): void {
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
