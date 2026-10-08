/**
 * 入口：组装团队并跑演示。
 * 默认 mock 模式（离线，零成本）；配好 .env 可切真实模型。
 */
import { Agent } from "./agent.js"
import { Supervisor } from "./supervisor.js"
import { llmFromEnv } from "./llm.js"
import { CS_AGENT_DEFS, csRouter, csHumanGate } from "./scenario.js"
import { loadEnv } from "./config.js"

loadEnv(".env")

const llm = llmFromEnv()
const agents = CS_AGENT_DEFS.map((def) => new Agent(def, llm))
const supervisor = new Supervisor(agents, csRouter, "advisor", csHumanGate)

const demoTasks = [
  "这个产品多少钱？支持包邮吗？",
  "我想预约明天下午三点到店，帮我登记一下",
  "我要退货，东西有点问题",
  "我们公司要谈对公合同，金额比较大",
]

console.log("=== AgentWorks Agent Team 演示（mock 模式） ===\n")
console.log("团队成员:", supervisor.listAgents().join(", "), "\n")

for (const task of demoTasks) {
  const { route, result, needsHuman } = await supervisor.handle(task)
  console.log(`用户: ${task}`)
  console.log(`  → 路由到: [${route}] ${needsHuman ? "⚠️ 触发人工介入" : ""}`)
  console.log(`  → 回复: ${result.raw}`)
  console.log()
}

console.log("=== 演示完成 ===")
console.log("接真实模型：复制 .env.example 为 .env，设 AGENT_LLM=real 并填 Key")
