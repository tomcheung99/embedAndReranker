export declare class PriorityQueue<T> {
    private heap;
    private seq;
    get size(): number;
    get isEmpty(): boolean;
    /** 正常排隊，priority 越小越優先。預設 priority = 10 */
    enqueue(item: T, priority?: number): void;
    /** 插隊：以 priority = 0 插入 */
    enqueueUrgent(item: T): void;
    /** 取出最高優先的項目 */
    dequeue(): T | undefined;
    /** 查看隊首但不移除 */
    peek(): T | undefined;
    /** 取得所有排隊中的項目（快照，不影響佇列） */
    snapshot(): Array<{
        item: T;
        priority: number;
    }>;
    private bubbleUp;
    private sinkDown;
    /** a 是否比 b 優先（priority 小優先，相同則 seq 小優先） */
    private higher;
    private swap;
}
//# sourceMappingURL=priority-queue.d.ts.map