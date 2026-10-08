# agentworks-agent-team

**Multi-Agent Collaboration Template: Supervisor + Workers. Zero-dependency, testable, pluggable LLM layer.**
**多 Agent 协作模板：监督者路由 + 分工执行 + 人工介入门控。零依赖、可测试、LLM 层可插拔。**

> Built by AgentWorks · 一人公司 + Agent 团队。
> 这套骨架支撑我们的企业 Agent 部署服务（10k-50k ¥ / 项目，含月度维护）。

---

## Why / 为什么做这个

企业客户要的不是单个聊天机器人，而是**能分工协作、有人工介入、可维护的 Agent 团队**（参考实战：1 人 + 5 Worker Agent 团队 = 月净利 12 万）。本模板把"多 Agent 协作"这件事做成**可复用骨架**：

- 换行业 = 换 `AgentDef` + 换路由规则，**核心骨架零改动**
- LLM 层抽象：一套代码接 DeepSeek / OpenAI / Ollama / 任何 OpenAI 兼容端点
- 零运行时依赖：不依赖 LangChain/LangGraph，自己就是编排层

## Features / 特性

- ✅ **Supervisor 路由**：意图分派（规则/LLM 可插拔）+ 未知请求兜底
- ✅ **分工执行**：Worker = 角色定义（系统提示词 + 能力清单）
- ✅ **人工介入门控**：大额/复杂场景自动标记转人工
- ✅ **上下文透传**：任务可携带业务上下文
- ✅ **LLM 兼容层**：OpenAICompatLLM + MockLLM（离线确定性测试）
- ✅ **零成本可测**：14 项单元测试，不烧 API 钱

## Quick Start / 快速开始

```bash
npm install
npm test          # 14 项单元测试（mock，零成本）
npm run demo      # 运行智能客服团队演示（mock 模式）
```

### 接真实模型（DeepSeek 示例）

```bash
cp .env.example .env
# 编辑 .env：
#   AGENT_LLM=real
#   AGENT_BASE_URL=https://api.deepseek.com/v1
#   AGENT_API_KEY=sk-xxx
#   AGENT_MODEL=deepseek-chat
npm run demo
```

## Demo / 演示输出（mock 模式）

```
团队成员: advisor, booking, followup

用户: 这个产品多少钱？支持包邮吗？
  → 路由到: [advisor]
  → 回复: 【咨询专员】这款产品原价 299 元，现在活动价 199 元…

用户: 我想预约明天下午三点到店
  → 路由到: [booking]
  → 回复: 【预约专员】已为您登记预约：明天下午 3 点…

用户: 我要退货，东西有点问题
  → 路由到: [followup]
  → 回复: 【回访专员】您的退换货申请已受理…

用户: 我们公司要谈对公合同，金额比较大
  → 路由到: [advisor] ⚠️ 触发人工介入
```

## Architecture / 架构

```
src/
├── types.ts      # 核心协议：Message / LLM / AgentDef / Router
├── llm.ts        # LLM 兼容层：OpenAI 适配器 + Mock + 环境变量工厂
├── agent.ts      # Worker：一个角色 = 一个执行单元
├── supervisor.ts # 监督者：路由 + 兜底 + 人工介入门控
├── scenario.ts   # 演示场景配置（换行业只需改这里）
└── index.ts      # 入口：组装团队 + 跑演示
```

## Add a new scenario / 接入新行业（换行业 3 步）

```typescript
// 1. 定义角色（src/scenario.ts 或新文件）
const SALES_AGENT_DEFS: AgentDef[] = [
  {
    name: "quote",
    role: "报价专员",
    capabilities: ["询价", "报价单生成"],
    systemPrompt: "你是报价专员，负责根据客户需求生成报价…",
  },
  // …更多 Worker
]

// 2. 定义路由规则
const salesRouter: Router = (request) =>
  /报价|询价/.test(request) ? "quote" : "advisor"

// 3. 组装（核心骨架零改动）
const team = SALES_AGENT_DEFS.map((def) => new Agent(def, llm))
const supervisor = new Supervisor(team, salesRouter, "quote")
```

## Extensions / 扩展点（路线图）

- [ ] 工具调用（Tool Registry）：Agent 可调用 MCP 工具 / 业务 API
- [ ] 多轮对话与记忆（会话状态）
- [ ] 并行执行：一个任务分发多个 Worker 同时干
- [ ] LangGraph 适配层（客户点名要 LangGraph 时对接）

## License

MIT

---

## 关于 AgentWorks

一人公司 + Agent 团队：创始人负责决策与交付，AI agent 团队并行作战。

**可承接**：
- 企业 AI Agent 部署（10k-50k ¥，含月维护）
- 业务 API → MCP 定制（3k-8k ¥）
- 自动化工作流搭建（300-3k ¥）

联系方式：GitHub Issues
