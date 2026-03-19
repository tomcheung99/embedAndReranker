// ============================================================
// Priority Queue — 排隊 + 插隊機制
// ============================================================
//
// 基於 min-heap 的優先佇列，priority 數值越小越優先。
// 支援：
//   - enqueue(item, priority)  正常排隊
//   - enqueueUrgent(item)      插隊（priority = 0）
//   - dequeue()                取出最高優先任務
//   - peek()                   查看隊首但不取出
// ============================================================
export class PriorityQueue {
    heap = [];
    seq = 0;
    get size() {
        return this.heap.length;
    }
    get isEmpty() {
        return this.heap.length === 0;
    }
    /** 正常排隊，priority 越小越優先。預設 priority = 10 */
    enqueue(item, priority = 10) {
        this.heap.push({ item, priority, seq: this.seq++ });
        this.bubbleUp(this.heap.length - 1);
    }
    /** 插隊：以 priority = 0 插入 */
    enqueueUrgent(item) {
        this.enqueue(item, 0);
    }
    /** 取出最高優先的項目 */
    dequeue() {
        if (this.heap.length === 0)
            return undefined;
        const top = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.sinkDown(0);
        }
        return top.item;
    }
    /** 查看隊首但不移除 */
    peek() {
        return this.heap[0]?.item;
    }
    /** 取得所有排隊中的項目（快照，不影響佇列） */
    snapshot() {
        return this.heap
            .slice()
            .sort((a, b) => a.priority - b.priority || a.seq - b.seq)
            .map((e) => ({ item: e.item, priority: e.priority }));
    }
    // ── Heap Operations ─────────────────────────────────────
    bubbleUp(i) {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.higher(i, parent)) {
                this.swap(i, parent);
                i = parent;
            }
            else
                break;
        }
    }
    sinkDown(i) {
        const n = this.heap.length;
        while (true) {
            let smallest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;
            if (left < n && this.higher(left, smallest))
                smallest = left;
            if (right < n && this.higher(right, smallest))
                smallest = right;
            if (smallest === i)
                break;
            this.swap(i, smallest);
            i = smallest;
        }
    }
    /** a 是否比 b 優先（priority 小優先，相同則 seq 小優先） */
    higher(a, b) {
        const ea = this.heap[a];
        const eb = this.heap[b];
        return ea.priority < eb.priority || (ea.priority === eb.priority && ea.seq < eb.seq);
    }
    swap(a, b) {
        [this.heap[a], this.heap[b]] = [this.heap[b], this.heap[a]];
    }
}
//# sourceMappingURL=priority-queue.js.map