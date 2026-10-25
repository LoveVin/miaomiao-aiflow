import type { DemoExecution, FlowEdge, FlowNode } from '@/types/workflow'

const supportedKinds = ['start', 'output', 'llm', 'knowledge', 'http', 'condition'] as const

const interpolate = (text: string, values: Record<string, string>, nodeOutputs: Map<string, Record<string, string>>) => {
    const withNodeOutputs = text.replace(/\$\{([^.}]+)\.([^}]+)\}/g, (match, nodeId: string, variableName: string) => {
        const value = nodeOutputs.get(nodeId)?.[variableName]
        return value === undefined ? match : value
    })
    return withNodeOutputs.replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key: string) => values[key] ?? match)
}

function simulateWorkflow(nodes: FlowNode[], edges: FlowEdge[], input: Record<string, string>): Pick<DemoExecution, 'output' | 'steps'> {
    const start = nodes.filter(node => node.type === 'start')
    if (start.length !== 1) throw new Error('请保留一个开始节点。')
    const inputs = start[0]!.data.config.inputs ?? []
    if (inputs.some(item => !item.name.trim()) || new Set(inputs.map(item => item.name)).size !== inputs.length)
        throw new Error('开始节点参数名不能为空或重复。')
    for (const item of inputs) {
        const value = input[item.name]?.trim() ?? ''
        if (item.required && !value) throw new Error(`请填写必填参数：${item.name}`)
        if (value && item.type === 'number' && !Number.isFinite(Number(value))) throw new Error(`${item.name} 必须为数字。`)
        if (value && item.type === 'boolean' && !['true', 'false'].includes(value)) throw new Error(`${item.name} 请填写 true 或 false。`)
    }
    for (const node of nodes) {
        if (!supportedKinds.some(item => item === node.type)) throw new Error('存在不支持的节点类型，请重新编排工作流。')
    }
    for (const edge of edges) {
        const source = nodes.find(node => node.id === edge.source)
        const target = nodes.find(node => node.id === edge.target)
        if (!source || !target || source.type === 'output' || target.type === 'start') throw new Error('存在无效连线，请检查节点连接。')
        if (source.type === 'condition') {
            const conditionHandles = source.data.config.intents?.length
                ? source.data.config.intents.map((_, index) => `intent-${index}`)
                : ['true', 'false']
            if (!conditionHandles.includes(edge.sourceHandle ?? '')) throw new Error('条件分支连线使用了无效的连接点。')
        }
    }
    const reachable = new Set([start[0]!.id])
    const queue = [start[0]!.id]
    while (queue.length) {
        const id = queue.shift()!
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
    const nodeOutputs = new Map<string, Record<string, string>>()
    const active = new Set([start[0]!.id])
    const steps: DemoExecution['steps'] = []
    let output = ''
    let ended = false
    for (const node of ordered) {
        if (!active.has(node.id)) continue
        const config = node.data.config
        const nodeStartedAt = performance.now()
        const stepInput =
            node.type === 'start' ? Object.fromEntries(inputs.map(item => [item.name, values[item.name] ?? ''])) : { ...values }
        let detail = '已读取输入参数'
        let branch: string | undefined
        let stepOutputs: Record<string, string> = values.content ? { content: values.content } : {}
        if (node.type === 'start') {
            stepOutputs = Object.fromEntries(inputs.map(item => [item.name, values[item.name] ?? '']))
        }
        if (node.type === 'llm') {
            const prompt = config.userPrompt || config.prompt || ''
            values.content = `[本地模拟 · 非 AI 生成]\n${interpolate(prompt, values, nodeOutputs)}`
            detail = `已替换提示词变量；未调用 ${config.model ?? '模型'}`
            stepOutputs = { content: values.content }
        }
        if (node.type === 'knowledge') {
            values.content = '[本地模拟 · 知识召回内容]'
            detail = `已准备 ${config.retrievalMode ?? 'vector'} 检索请求；未执行真实知识检索`
            stepOutputs = { content: values.content }
        }
        if (node.type === 'http') {
            detail = `仅演示 ${config.method ?? 'GET'} ${interpolate(config.url ?? '', values, nodeOutputs)}；请求体：${
                interpolate(config.body ?? '', values, nodeOutputs) || '无'
            }；未发出真实请求`
            stepOutputs = { message: '[本地模拟 · 未发出请求]' }
        }
        if (node.type === 'condition') {
            if (config.intents?.length) {
                const matchedIndex = config.intents.findIndex(intent => intent.name && JSON.stringify(values).includes(intent.name))
                if (matchedIndex >= 0) {
                    branch = `intent-${matchedIndex}`
                    detail = `识别意图：${config.intents[matchedIndex]!.name}；仅执行对应分支`
                } else {
                    detail = '未识别到意图；本地模拟不激活后续分支'
                }
                stepOutputs = { result: detail }
            } else {
                const field = config.field?.trim() ?? ''
                if (!field || !Object.hasOwn(values, field)) throw new Error(`条件分支比较字段不存在：${field || '未配置'}`)
                const left = values[field]!
                const right = interpolate(config.value ?? '', values, nodeOutputs)
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
                stepOutputs = { result: detail }
            }
            if (!edges.some(edge => edge.source === node.id && edge.sourceHandle === branch))
                throw new Error(`条件分支 ${branch ?? '输出'} 尚未连接。`)
        }
        if (node.type === 'output') {
            if (config.outputs?.length) {
                const renderedOutputs = Object.fromEntries(
                    config.outputs.map(item => [item.name, interpolate(item.value, values, nodeOutputs)])
                )
                output =
                    config.outputFormat === 'json' ? JSON.stringify(renderedOutputs, null, 2) : JSON.stringify(renderedOutputs, null, 2)
                detail = '已在本地渲染结束节点输出参数'
                stepOutputs = renderedOutputs
            } else {
                const result = interpolate(config.template ?? '{{content}}', values, nodeOutputs)
                output = config.format === 'json' ? JSON.stringify({ content: result }, null, 2) : result
                detail = '已在本地渲染结束节点模板'
                stepOutputs = { content: result }
            }
            ended = true
        }
        steps.push({
            id: node.id,
            label: node.data.label,
            detail,
            status: 'success',
            duration: performance.now() - nodeStartedAt,
            nodeType: node.type,
            inputs: stepInput,
            outputs: stepOutputs,
        })
        nodeOutputs.set(node.id, stepOutputs)
        for (const edge of edges) {
            if (edge.source === node.id && (branch === undefined || edge.sourceHandle === branch)) active.add(edge.target)
        }
    }
    if (!ended) throw new Error('当前分支未连接到结束节点。')
    return { output, steps }
}

export function runWorkflow(nodes: FlowNode[], edges: FlowEdge[], input: Record<string, string>) {
    const startedAt = performance.now()
    try {
        const result = simulateWorkflow(nodes, edges, input)
        return {
            status: 'SUCCESS' as const,
            duration: performance.now() - startedAt,
            outputs: result.output,
            nodeTraces: result.steps,
            error: null,
        }
    } catch (error) {
        return {
            status: 'ERROR' as const,
            duration: performance.now() - startedAt,
            outputs: error instanceof Error ? error.message : '工作流执行失败',
            nodeTraces: [],
            error: error instanceof Error ? error.message : '工作流执行失败',
        }
    }
}
