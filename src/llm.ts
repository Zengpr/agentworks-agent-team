/**
 * LLM 兼容层：
 * - OpenAICompatLLM：适配任何 OpenAI 兼容端点（DeepSeek / OpenAI / Ollama / 私有化）
 * - MockLLM：确定性响应（测试与离线演示用，零成本）
 * - llmFromEnv：按环境变量自动选择
 */
import type { LLM, Message } from "./types.js"

export interface OpenAICompatOptions {
  baseURL: string
  apiKey: string
  model: string
  timeoutMs?: number
}

/** OpenAI 兼容适配器 —— 一套代码接 DeepSeek/OpenAI/Ollama/任意端点 */
export class OpenAICompatLLM implements LLM {
  private baseURL: string
  private apiKey: string
  private model: string
  private timeoutMs: number

  constructor(opts: OpenAICompatOptions) {
    // 去掉末尾斜杠，避免 /v1/chat/completions 拼出 // 双斜杠
    this.baseURL = opts.baseURL.replace(/\/+$/, "")
    this.apiKey = opts.apiKey
    this.model = opts.model
    this.timeoutMs = opts.timeoutMs ?? 30_000
  }

  async complete(messages: Message[]): Promise<string> {
    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, messages }),
      signal: AbortSignal.timeout(this.timeoutMs),
    })
    if (!res.ok) {
      throw new Error(`LLM 请求失败（HTTP ${res.status}）：请检查 AGENT_BASE_URL / AGENT_API_KEY / AGENT_MODEL`)
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content ?? ""
    if (!content) throw new Error("LLM 返回空内容")
    return content
  }
}

/** 确定性 Mock：测试与离线演示专用，零 API 成本 */
export class MockLLM implements LLM {
  constructor(
    private responses: Record<string, string>,
    private fallback = "（mock 响应：未匹配到场景）"
  ) {}

  async complete(messages: Message[]): Promise<string> {
    const system = messages.find((m) => m.role === "system")?.content ?? ""
    const lastUser =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? ""
    const key = Object.keys(this.responses).find(
      (k) => system.includes(k) || lastUser.includes(k)
    )
    return key ? this.responses[key] : this.fallback
  }
}

/** 按环境变量创建 LLM：AGENT_LLM=mock → MockLLM；否则 OpenAI 兼容 */
export function llmFromEnv(env: NodeJS.ProcessEnv = process.env): LLM {
  const mode = env.AGENT_LLM ?? "mock"
  if (mode === "mock") return new MockLLM(mockScenarioResponses)
  const baseURL = env.AGENT_BASE_URL
  const apiKey = env.AGENT_API_KEY
  const model = env.AGENT_MODEL
  if (!baseURL || !apiKey || !model) {
    throw new Error(
      "real 模式需要配置 AGENT_BASE_URL / AGENT_API_KEY / AGENT_MODEL（见 .env.example）"
    )
  }
  return new OpenAICompatLLM({ baseURL, apiKey, model })
}

/** 演示场景的 mock 应答表（key 匹配系统提示词中的角色名） */
export const mockScenarioResponses: Record<string, string> = {
  "咨询专员":
    "【咨询专员】这款产品原价 299 元，现在活动价 199 元，支持 7 天无理由退换。包邮到家，需要我帮您下单吗？",
  "预约专员":
    "【预约专员】已为您登记预约：明天下午 3 点，工位已锁定。到店前 30 分钟会短信提醒您，如需改期请回复“改期”。",
  "回访专员":
    "【回访专员】您的退换货申请已受理，物流将在 24 小时内上门取件。退款原路返回，预计 3-5 个工作日到账。",
}
