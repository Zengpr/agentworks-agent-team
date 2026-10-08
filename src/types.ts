/**
 * 核心类型定义 —— 多 Agent 协作的通用协议
 */
export interface Message {
  role: "system" | "user" | "assistant"
  content: string
}

/** LLM 抽象：所有模型（OpenAI/DeepSeek/Ollama/本地）统一走这一个接口 */
export interface LLM {
  complete(messages: Message[]): Promise<string>
}

/** Agent 定义：一个角色 = 一个系统提示词 + 一组能力描述 */
export interface AgentDef {
  name: string
  role: string
  capabilities: string[]
  systemPrompt: string
}

export interface Task {
  request: string
  context?: Record<string, unknown>
}

export interface AgentResult {
  agent: string
  summary: string
  raw: string
  /** 需要人工介入时置 true（如大额交易、复杂投诉） */
  needsHuman?: boolean
}

/** 路由函数：把用户请求分派给对应 Agent（可规则 / 可 LLM，可插拔） */
export interface Router {
  (request: string): string
}
