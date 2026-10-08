import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { Agent } from "../src/agent.js"
import { Supervisor } from "../src/supervisor.js"
import { MockLLM, llmFromEnv, OpenAICompatLLM } from "../src/llm.js"
import { CS_AGENT_DEFS, csRouter, csHumanGate } from "../src/scenario.js"
import type { LLM } from "../src/types.js"

function buildTeam() {
  const llm = new MockLLM({
    advisor: "【咨询专员】mock 回答产品问题",
    booking: "【预约专员】mock 回答预约问题",
    followup: "【回访专员】mock 回答售后问题",
  })
  const agents = CS_AGENT_DEFS.map((def) => new Agent(def, llm))
  const supervisor = new Supervisor(agents, csRouter, "advisor", csHumanGate)
  return { llm, agents, supervisor }
}

describe("Agent", () => {
  it("执行任务并返回所属 Agent 名", async () => {
    const { agents } = buildTeam()
    const advisor = agents.find((a) => a.name === "advisor")!
    const result = await advisor.run({ request: "这个多少钱？" })
    assert.equal(result.agent, "advisor")
    assert.ok(result.raw.length > 0)
  })

  it("任务携带上下文时透传给 LLM", async () => {
    let receivedContext = ""
    const llm: LLM = {
      complete: async (messages) => {
        receivedContext = messages.find((m) => m.role === "user")?.content ?? ""
        return "ok"
      },
    }
    const agent = new Agent(CS_AGENT_DEFS[0], llm)
    await agent.run({ request: "查库存", context: { sku: "A-100" } })
    assert.ok(receivedContext.includes("A-100"))
  })
})

describe("Supervisor 路由", () => {
  it("价格咨询路由到 advisor", async () => {
    const { supervisor } = buildTeam()
    const { route } = await supervisor.handle("这个产品多少钱？包邮吗？")
    assert.equal(route, "advisor")
  })

  it("预约请求路由到 booking", async () => {
    const { supervisor } = buildTeam()
    const { route } = await supervisor.handle("我想预约明天下午三点")
    assert.equal(route, "booking")
  })

  it("退货请求路由到 followup", async () => {
    const { supervisor } = buildTeam()
    const { route } = await supervisor.handle("我要退货")
    assert.equal(route, "followup")
  })

  it("未知请求兜底到 advisor", async () => {
    const { supervisor } = buildTeam()
    const { route } = await supervisor.handle("今天天气怎么样")
    assert.equal(route, "advisor")
  })

  it("命中人工介入门控时标记 needsHuman", async () => {
    const { supervisor } = buildTeam()
    const { needsHuman } = await supervisor.handle("我们要谈对公合同，金额超过1万")
    assert.equal(needsHuman, true)
  })

  it("正常请求不触发人工介入", async () => {
    const { supervisor } = buildTeam()
    const { needsHuman } = await supervisor.handle("这个多少钱？")
    assert.equal(needsHuman, false)
  })
})

describe("路由规则", () => {
  it("csRouter 关键词覆盖三类意图", () => {
    assert.equal(csRouter("多少钱"), "advisor")
    assert.equal(csRouter("预约到店"), "booking")
    assert.equal(csRouter("投诉退款"), "followup")
  })

  it("csHumanGate 只对大额/对公触发", () => {
    assert.equal(csHumanGate("对公合同 50000"), true)
    assert.equal(csHumanGate("包邮吗"), false)
  })
})

describe("LLM 层", () => {
  it("MockLLM 按系统提示词命中场景", async () => {
    const llm = new MockLLM({
      advisor: "产品回答",
      booking: "预约回答",
    })
    const r1 = await llm.complete([
      { role: "system", content: "你是 advisor 咨询专员" },
      { role: "user", content: "多少钱" },
    ])
    const r2 = await llm.complete([
      { role: "system", content: "你是 booking 预约专员" },
      { role: "user", content: "预约" },
    ])
    assert.equal(r1, "产品回答")
    assert.equal(r2, "预约回答")
  })

  it("llmFromEnv 默认返回 MockLLM（零成本安全）", () => {
    const llm = llmFromEnv({} as NodeJS.ProcessEnv)
    assert.ok(llm instanceof MockLLM)
  })

  it("llmFromEnv real 模式缺配置时报错", () => {
    assert.throws(() =>
      llmFromEnv({ AGENT_LLM: "real" } as NodeJS.ProcessEnv)
    )
  })

  it("OpenAICompatLLM 拼接 baseURL 不产生双斜杠", () => {
    const llm = new OpenAICompatLLM({
      baseURL: "https://api.deepseek.com/v1/",
      apiKey: "x",
      model: "deepseek-chat",
    })
    // 通过私有字段验证（TS 允许同文件类型访问）
    const base = (llm as unknown as { baseURL: string }).baseURL
    assert.equal(base.endsWith("/"), false)
  })
})
