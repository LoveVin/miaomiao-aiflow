import type { NodeConfig, NodeKind } from '@/types/workflow'

export const workflowNodeLibrary: { kind: NodeKind; label: string; description: string }[] = [
    { kind: 'start', label: '开始节点', description: '设置流程输入参数' },
    { kind: 'output', label: '结束节点', description: '返回工作流的运行结果' },
    { kind: 'llm', label: '大模型节点', description: '调用 AI 模型生成内容' },
    { kind: 'knowledge', label: '知识库节点', description: '从知识库召回内容' },
    { kind: 'http', label: 'HTTP节点', description: '配置 HTTP 请求' },
    { kind: 'condition', label: '条件分支', description: '根据比较结果选择分支' },
]

export const workflowModels = ['qwen3.5:0.8b', 'qwen3-vl:2b']

export const defaultWorkflowConfigs: Record<NodeKind, NodeConfig> = {
    start: {
        inputs: [],
    },
    llm: {
        model: workflowModels[0],
        systemPrompt: '你是一名资深的小红书内容创作者。请根据用户提供的产品名称和核心卖点，生成一篇真实、有感染力的种草文案。',
        prompt: '产品名称：{{product_name}}\n核心卖点：{{selling_points}}',
        temperature: 0.7,
        maxTokens: 2048,
    },
    knowledge: { knowledgeBaseIds: [], query: '{{product_name}}', retrievalMode: 'vector', topK: 5, threshold: 0.2, outputFormat: 'text' },
    http: {
        method: 'GET',
        url: 'https://example.com/api',
        headers: [],
        params: [],
        bodyType: 'json',
        body: '',
        formData: [],
        timeout: 30000,
    },
    condition: { model: workflowModels[0], intents: [{ name: '示例意图', description: '根据用户输入识别目标分支' }] },
    output: { outputs: [] },
}
