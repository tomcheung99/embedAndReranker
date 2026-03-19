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

interface HeapEntry<T> {
  item: T;
  priority: number;
  /** 插入序號，同 priority 時保持 FIFO */
  seq: number;
}

export class PriorityQueue<T> {
  private heap: HeapEntry<T>[] = [];
  private seq = 0;

  get size(): number {
    return this.heap.length;
  }

  get isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /** 正常排隊，priority 越小越優先。預設 priority = 10 */
  enqueue(item: T, priority = 10): void {
    this.heap.push({ item, priority, seq: this.seq++ });
    this.bubbleUp(this.heap.length - 1);
  }

  /** 插隊：以 priority = 0 插入 */
  enqueueUrgent(item: T): void {
    this.enqueue(item, 0);
  }

  /** 取出最高優先的項目 */
  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0]!;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top.item;
  }

  /** 查看隊首但不移除 */
  peek(): T | undefined {
    return this.heap[0]?.item;
  }

  /** 取得所有排隊中的項目（快照，不影響佇列） */
  snapshot(): Array<{ item: T; priority: number }> {
    return this.heap
      .slice()
      .sort((a, b) => a.priority - b.priority || a.seq - b.seq)
      .map((e) => ({ item: e.item, priority: e.priority }));
  }

  // ── Heap Operations ─────────────────────────────────────
  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.higher(i, parent)) {
        this.swap(i, parent);
        i = parent;
      } else break;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.higher(left, smallest)) smallest = left;
      if (right < n && this.higher(right, smallest)) smallest = right;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  /** a 是否比 b 優先（priority 小優先，相同則 seq 小優先） */
  private higher(a: number, b: number): boolean {
    const ea = this.heap[a]!;
    const eb = this.heap[b]!;
    return ea.priority < eb.priority || (ea.priority === eb.priority && ea.seq < eb.seq);
  }

  private swap(a: number, b: number): void {
    [this.heap[a], this.heap[b]] = [this.heap[b]!, this.heap[a]!];
  }
}
