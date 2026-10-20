import type { DemoExecution, FlowEdge, FlowNode, NodeConfig, NodeKind } from '@/types/workflow'

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
export const defaultWorkflowNodes: FlowNode[] = [
    { id: 'start-1', type: 'start', position: { x: 70, y: 270 }, data: { label: '开始节点', config: defaultWorkflowConfigs.start } },
    { id: 'model-1', type: 'model', position: { x: 400, y: 160 }, data: { label: '大模型节点', config: defaultWorkflowConfigs.model } },
    { id: 'output-1', type: 'output', position: { x: 730, y: 310 }, data: { label: '结束节点', config: defaultWorkflowConfigs.output } },
]
export const defaultWorkflowEdges: FlowEdge[] = [
    { id: 'start-model', source: 'start-1', target: 'model-1' },
    { id: 'model-output', source: 'model-1', target: 'output-1' },
]
export const defaultWorkflowInput: Record<string, string> = {
    product_name: '便携式咖啡机',
    selling_points: '小巧便携，3秒加热，支持冷萃',
}
export const workflowApplications = [
    {
        id: '1',
        name: '小红书爆款文案助手',
        desc: '输入产品卖点，自动生成种草文案与热门标题',
        icon: '文',
        color: 'coral',
        status: '已发布',
        time: '10 分钟前',
        owner: 'mine',
    },
    {
        id: '2',
        name: '智能客服助手',
        desc: '基于企业知识库，精准回答客户常见问题',
        icon: '客',
        color: 'violet',
        status: '草稿',
        time: '昨天',
        owner: 'mine',
    },
    {
        id: '3',
        name: '每日资讯摘要',
        desc: '聚合行业资讯，每天生成一份精炼早报',
        icon: '讯',
        color: 'blue',
        status: '已发布',
        time: '3 天前',
        owner: 'shared',
    },
]
export function getWorkflowAppName(id: string) {
    return workflowApplications.find(app => app.id === id)?.name ?? '未命名应用'
}
export function createWorkflowApplication(id: string, name: string) {
    return { id, name, status: '已发布', time: '刚刚', desc: '本地演示工作流', icon: name.slice(0, 1), color: 'violet', owner: 'mine' }
}
const interpolate = (text: string, values: Record<string, string>) =>
    text.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key: string) => values[key] ?? match)

function simulateWorkflow(nodes: FlowNode[], edges: FlowEdge[], input: Record<string, string>): Pick<DemoExecution, 'output' | 'steps'> {
    const start = nodes.filter(node => node.type === 'start')
    if (start.length !== 1) throw new Error('请保留一个开始节点。')
    const inputs = start[0].data.config.inputs ?? []
    if (inputs.some(item => !item.name.trim()) || new Set(inputs.map(item => item.name)).size !== inputs.length)
        throw new Error('开始节点参数名不能为空或重复。')
    for (const item of inputs) {
        const value = input[item.name]?.trim() ?? ''
        if (item.required && !value) throw new Error(`请填写必填参数：${item.name}`)
        if (value && item.type === 'number' && !Number.isFinite(Number(value))) throw new Error(`${item.name} 必须为数字。`)
        if (value && item.type === 'boolean' && !['true', 'false'].includes(value)) throw new Error(`${item.name} 请填写 true 或 false。`)
    }
    for (const node of nodes) {
        if (!workflowNodeLibrary.some(item => item.kind === node.type)) throw new Error('存在不支持的节点类型，请重新编排工作流。')
    }
    for (const edge of edges) {
        const source = nodes.find(node => node.id === edge.source)
        const target = nodes.find(node => node.id === edge.target)
        if (!source || !target || source.type === 'output' || target.type === 'start') throw new Error('存在无效连线，请检查节点连接。')
        if (source.type === 'condition' && !['true', 'false'].includes(edge.sourceHandle ?? ''))
            throw new Error('条件分支连线必须使用 true 或 false 连接点。')
    }
    const reachable = new Set([start[0].id])
    const queue = [start[0].id]
    while (queue.length) {
        const id = queue.shift()
        edges
            .filter(edge => edge.source === id)
            .forEach(edge => {
                if (!reachable.has(edge.target)) {
                    reachable.add(edge.target)
                    queue.push(edge.target)
                }
            })
    }
    if (reachable.size !== nodes.length) throw new Error('存在未连接到开始节点的节点，请先完成连线。')
    const degrees = new Map(nodes.map(node => [node.id, edges.filter(edge => edge.target === node.id).length]))
    const ready = nodes.filter(node => degrees.get(node.id) === 0)
    const ordered: FlowNode[] = []
    while (ready.length) {
        const node = ready.shift()!
        ordered.push(node)
        edges
            .filter(edge => edge.source === node.id)
            .forEach(edge => {
                const degree = (degrees.get(edge.target) ?? 0) - 1
                degrees.set(edge.target, degree)
                if (degree === 0) {
                    const target = nodes.find(item => item.id === edge.target)
                    if (target) ready.push(target)
                }
            })
    }
    if (ordered.length !== nodes.length) throw new Error('工作流中存在循环连线，无法模拟。')
    if (!ordered.some(node => node.type === 'output')) throw new Error('请添加并连接结束节点。')
    const values: Record<string, string> = { ...input, content: '' }
    const active = new Set([start[0].id])
    const steps: DemoExecution['steps'] = []
    let output = ''
    let ended = false
    for (const node of ordered) {
        if (!active.has(node.id)) continue
        const config = node.data.config
        let detail = '已读取输入参数'
        let branch: string | undefined
        if (node.type === 'model') {
            values.content = `[本地模拟 · 非 AI 生成]\n${interpolate(config.prompt ?? '', values)}`
            detail = `已替换提示词变量；未调用 ${config.model ?? '模型'}`
        }
        if (node.type === 'knowledge') detail = '跳过真实知识检索；未生成召回内容'
        if (node.type === 'http') {
            detail = `仅演示 ${config.method ?? 'GET'} ${interpolate(config.url ?? '', values)}；请求体：${interpolate(config.body ?? '', values) || '无'}；未发出真实请求`
        }
        if (node.type === 'condition') {
            const field = config.field?.trim() ?? ''
            if (!field || !Object.hasOwn(values, field)) throw new Error(`条件分支比较字段不存在：${field || '未配置'}`)
            const left = values[field]
            const right = interpolate(config.value ?? '', values)
            let result: boolean
            switch (config.operator) {
                case 'equals':
                    result = left === right
                    break
                case 'notEquals':
                    result = left !== right
                    break
                case 'contains':
                    result = left.includes(right)
                    break
                case 'greaterThan':
                case 'lessThan': {
                    if (!left.trim() || !right.trim() || !Number.isFinite(Number(left)) || !Number.isFinite(Number(right)))
                        throw new Error('条件分支的大小比较需要两个有效数字。')
                    result = config.operator === 'greaterThan' ? Number(left) > Number(right) : Number(left) < Number(right)
                    break
                }
                default:
                    throw new Error('请选择条件分支比较运算符。')
            }
            branch = String(result)
            detail = `比较 ${field}，结果为 ${branch}；仅执行 ${branch} 分支`
            if (!edges.some(edge => edge.source === node.id && edge.sourceHandle === branch))
                throw new Error(`条件分支 ${branch} 尚未连接。`)
        }
        if (node.type === 'output') {
            const result = interpolate(config.template ?? '{{content}}', values)
            output = config.format === 'json' ? JSON.stringify({ content: result }, null, 2) : result
            detail = '已在本地渲染结束节点模板'
            ended = true
        }
        steps.push({ id: node.id, label: node.data.label, detail })
        for (const edge of edges) {
            if (edge.source === node.id && (branch === undefined || edge.sourceHandle === branch)) active.add(edge.target)
        }
    }
    if (!ended) throw new Error('当前分支未连接到结束节点。')
    return { output, steps }
}

export async function runMockWorkflow({
    nodes,
    edges,
    input,
}: {
    nodes: FlowNode[]
    edges: FlowEdge[]
    input: Record<string, string>
}): Promise<DemoExecution> {
    const start = performance.now()
    let result: Pick<DemoExecution, 'output' | 'steps' | 'success'>
    try {
        result = { ...simulateWorkflow(nodes, edges, input), success: true }
    } catch (error) {
        result = { output: error instanceof Error ? error.message : '本地模拟失败', steps: [], success: false }
    }
    return { id: crypto.randomUUID(), time: new Date().toISOString(), duration: performance.now() - start, input: { ...input }, ...result }
}
