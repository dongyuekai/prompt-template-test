import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { PipelinePromptTemplate, PromptTemplate } from '@langchain/core/prompts';


// 初始化模型
const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// A. 人设模块
export const personaPrompt = PromptTemplate.fromTemplate(
  `你是一名资深工程团队负责人，写作风格：{tone}。
你擅长把枯燥的技术细节写得既专业又有温度。\n`
);

// B. 背景模块
export const contextPrompt = PromptTemplate.fromTemplate(
  `公司：{company_name}
部门：{team_name}
直接汇报对象：{manager_name}
本周时间范围：{week_range}
本周部门核心目标：{team_goal}\n`
);

// C. 任务模块
const taskPrompt = PromptTemplate.fromTemplate(
  `以下是本周团队的开发活动（Git / Jira 汇总）：
{dev_activities}

请你从这些原始数据中提炼出：
1. 本周整体成就亮点
2. 潜在风险和技术债
3. 下周重点计划建议\n`
);

// D. 格式模块
const formatPrompt = PromptTemplate.fromTemplate(
  `请用 Markdown 输出周报，结构包含：
1. 本周概览（2-3 句话的 Summary）
2. 详细拆分（按模块或项目分段）
3. 关键指标表格，表头为：模块 | 亮点 | 风险 | 下周计划

注意：
- 尽量引用一些具体数据（如提交次数、完成的任务编号）
- 语气专业，但可以偶尔带一点轻松的口吻，符合 {company_values}。
`
);

// E. 最终组合 Prompt（把上面几个模块拼在一起）
const finalWeeklyPrompt = PromptTemplate.fromTemplate(
  `{persona_block}
{context_block}
{task_block}
{format_block}

现在请生成本周的最终周报：`
);

const pipelinePrompt = new PipelinePromptTemplate({
  pipelinePrompts: [
    { name: 'persona_block', prompt: personaPrompt },
    { name: 'context_block', prompt: contextPrompt },
    { name: 'task_block', prompt: taskPrompt },
    { name: 'format_block', prompt: formatPrompt },
  ],
  finalPrompt: finalWeeklyPrompt,
  inputVariables: [
    'tone',
    'company_name',
    'team_name',
    'manager_name',
    'week_range',
    'team_goal',
    'dev_activities',
    'company_values',
  ]
})
const pipelineFormatted = await pipelinePrompt.format({
  tone: '专业但不失人情味',
  company_name: '星航科技',
  team_name: '数据智能平台组',
  manager_name: '刘总',
  week_range: '2025-03-10 ~ 2025-03-16',
  team_goal: '完成用户画像服务的灰度上线，并验证核心指标是否达标。',
  dev_activities:
    '- 阿兵：完成用户画像服务的 Canary 发布与回滚脚本优化，提交 27 次，相关任务：DATA-321 / DATA-335\n' +
    '- 小李：接入埋点数据，打通埋点 → Kafka → DWD → 画像服务的全链路，提交 22 次\n' +
    '- 小赵：完善画像服务的告警与Dashboard，新增 8 个告警规则，提交 15 次\n' +
    '- 小周：配合产品输出 A/B 实验报表，支持 3 条对外汇报用数据',
  company_values: '创新、协作、客户至上',
})

console.log('PipelinePromptTemplate 组合后的 Prompt：');
console.log(pipelineFormatted)


