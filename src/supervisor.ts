/**
 * Supervisor（监督者）：多 Agent 协作的调度中枢。
 * - 意图路由：把请求分派给正确的 Worker（规则/LLM 可插拔）
 * - 兜底路由：无法识别时交给 fallback Agent
 * - 扩展点：后续可加记忆、工具调用、多轮对话、人工介入门控
 */
import { Agent } from "./agent.js"
import type { AgentResult, Router } from "./types.js"

export interface SupervisedResult {
  route: string
  result: AgentResult
  needsHuman: boolean
}

export class Supervisor {
  private agents: Map<string, Agent>

  constructor(
    agents: Agent[],
    private router: Router,
    private fallbackAgent: string,
    /** 人工介入判断：命中关键字 → 标记转人工 */
    private humanGate: (request: string) => boolean = () => false
  ) {
    this.agents = new Map(agents.map((a) => [a.name, a]))
  }

  listAgents(): string[] {
    return [...this.agents.keys()]
  }

  async handle(request: string): Promise<SupervisedResult> {
    const target = this.router(request)
    const agent = this.agents.get(target) ?? this.agents.get(this.fallbackAgent)

    if (!agent) {
      throw new Error(`找不到 Agent：${target}，且兜底 ${this.fallbackAgent} 不存在`)
    }

    const result = await agent.run({ request })
    const needsHuman = this.humanGate(request)

    return {
      route: target,
      result,
      needsHuman,
    }
  }
}
