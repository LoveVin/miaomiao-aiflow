import type { NodeConfig, NodeKind } from '@/types/workflow'

export const workflowNodeLibrary: { kind: NodeKind; label: string; description: string }[] = [
    { kind: 'start', label: '开始节点', description: '设置流程输入参数' },
    { kind: 'output', label: '结束节点', description: '返回工作流的运行结果' },
    { kind: 'model', label: '大模型节点', description: '调用 AI 模型生成内容' },
    { kind: 'knowledge', label: '知识库节点', description: '从知识库召回内容' },
    { kind: 'http', label: 'HTTP节点', description: '配置 HTTP 请求' },
    { kind: 'condition', label: '条件分支', description: '根据比较结果选择分支' },
]

export const workflowModels = ['Miao-4 Turbo', 'Miao-4 Mini', 'DeepSeek V3']

export const defaultWorkflowConfigs: Record<NodeKind, NodeConfig> = {
    start: {
        inputs: [
            { id: 'product', name: 'product_name', type: 'string', required: true },
            { id: 'points', name: 'selling_points', type: 'string', required: true },
        ],
    },
    model: {
        model: workflowModels[0],
        systemPrompt: '你是一名资深的小红书内容创作者。请根据用户提供的产品名称和核心卖点，生成一篇真实、有感染力的种草文案。',
        prompt: '产品名称：{{product_name}}\n核心卖点：{{selling_points}}',
        temperature: 0.7,
        maxTokens: '2048',
    },
    knowledge: { knowledge: '', prompt: '{{product_name}}', topK: '3' },
    http: { method: 'GET', url: 'https://example.com/api', body: '' },
    condition: { field: 'product_name', operator: 'equals', value: '便携式咖啡机' },
    output: { format: 'text', template: '{{content}}', stream: true },
}
