/**
 * 演示场景：智能客服团队（咨询/预约/回访 三 Worker + Supervisor）
 * 对应实战案例：AI 客服 Agent（8k-30k 开发费 + 月维护）。
 * 换行业 = 换 AgentDef + 换路由规则，核心骨架零改动。
 */
import type { AgentDef, Router } from "./types.js"

/** 三个 Worker 的定义 —— 这就是"分工"的配置化表达 */
export const CS_AGENT_DEFS: AgentDef[] = [
  {
    name: "advisor",
    role: "咨询专员",
    capabilities: ["产品介绍", "价格咨询", "物流/发货问题"],
    systemPrompt:
      "你是电商客服的咨询专员。回答产品、价格、物流类问题，简洁友好，不说超范围的话。",
  },
  {
    name: "booking",
    role: "预约专员",
    capabilities: ["到店预约", "排期登记", "改期提醒"],
    systemPrompt:
      "你是客服团队的预约专员。负责登记预约信息、确认时间、提醒改期。输出确认信息。",
  },
  {
    name: "followup",
    role: "回访专员",
    capabilities: ["售后处理", "退换货", "投诉跟进"],
    systemPrompt:
      "你是客服团队的回访专员。处理退换货申请、售后跟进，安抚客户并给出明确的处理流程。",
  },
]

/** 意图路由：按关键词分派（生产环境可换成 LLM 分类器，接口不变） */
export const csRouter: Router = (request: string) => {
  if (/预约|订座|排期|到店|时间/.test(request)) return "booking"
  if (/售后|退|投诉|回访|维修|跟进/.test(request)) return "followup"
  return "advisor"
}

/** 人工介入门控：大额交易/复杂场景转人工 */
export const csHumanGate = (request: string): boolean => {
  if (/1万|10000|大额|合同|对公/.test(request)) return true
  return false
}
