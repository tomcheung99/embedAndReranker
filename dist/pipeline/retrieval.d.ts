import type { ClientConfig } from "../config.js";
import type { PipelineOptions, PipelineResult } from "../types.js";
export declare class RetrievalPipeline {
    private readonly embed;
    private readonly retrieve;
    private readonly colbert;
    private readonly rerank;
    constructor(config: ClientConfig);
    /**
     * 執行完整的檢索 → 重排管線。
     *
     * ```
     * ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
     * │  Embed   │───▶│ Retrieve  │───▶│ ColBERT  │───▶│  Rerank  │
     * │ (BGE-M3) │    │ (Hybrid)  │    │ (filter) │    │ (CE)     │
     * └──────────┘    └───────────┘    └──────────┘    └──────────┘
     *   dense+sparse    top_k=50        top_k=20        top_k=10
     * ```
     */
    run(query: string, options?: PipelineOptions): Promise<PipelineResult>;
}
//# sourceMappingURL=retrieval.d.ts.map