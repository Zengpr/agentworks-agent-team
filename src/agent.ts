/**
 * Agent：一个角色 = 一个执行单元。
 * 输入任务 → 组装上下文 → 调 LLM → 产出结构化结果。
 */
import type { AgentDef, AgentResult, LLM, Message, Task } from "./types.js"

export class Agent {
  private _def: AgentDef

  constructor(
    def: AgentDef,
    private llm: LLM
  ) {
    this._def = def
  }

  get name(): string {
    return this._def.name
  }

  get def(): AgentDef {
    return this._def
  }

  async run(task: Task): Promise<AgentResult> {
    const contextText = task.context
      ? `\n\n背景信息：${JSON.stringify(task.context)}`
      : ""
    const messages: Message[] = [
      { role: "system", content: this._def.systemPrompt },
      { role: "user", content: task.request + contextText },
    ]
    const raw = await this.llm.complete(messages)
    return {
      agent: this.def.name,
      summary: raw.slice(0, 200),
      raw,
    }
  }
}
