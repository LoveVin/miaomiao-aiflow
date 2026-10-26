import { createWorkflowEngine, type NodeExecutionResult, type WorkflowNode } from '@miaomiao-aiflow/ai-engine'

import type { FlowEdge, FlowNode, NodeTrace } from '@/types/workflow'

const serialize = (value: unknown): string => {
    if (typeof value === 'string') return value
    if (value === undefined || value === null) return ''
    return JSON.stringify(value)
}

function toEngineNode(node: FlowNode): WorkflowNode {
    const { config } = node.data
    if (node.type === 'output') {
        const outputs = config.outputs?.length
            ? config.outputs.map(item => ({ ...item, type: 'string' }))
            : [{ name: 'content', value: config.template ?? '${llm-1.output}', type: 'string' }]
        return { id: node.id, type: 'end', data: { label: node.data.label, config: { ...config, outputs } } }
    }
    const engineConfig = node.type === 'llm' ? { ...config, userPrompt: config.userPrompt ?? config.prompt } : config
    return { id: node.id, type: node.type, data: { label: node.data.label, config: engineConfig as Record<string, unknown> } }
}

function getNodeDetail(node: FlowNode, result: NodeExecutionResult) {
    if (!result.success) return result.error?.message ?? '节点执行失败'
    if (node.type === 'llm') return `已调用 ${node.data.config.model ?? '配置的模型'}`
    if (node.type === 'condition') return `已完成条件判断${result.matchedBranch ? `，分支：${result.matchedBranch}` : ''}`
    if (node.type === 'http') return '已发出 HTTP 请求'
    if (node.type === 'knowledge') return '已执行知识检索'
    if (node.type === 'output') return '已生成工作流输出'
    return '已读取输入参数'
}

export async function runWorkflow(nodes: FlowNode[], edges: FlowEdge[], input: Record<string, string>) {
    const startedAt = performance.now()
    const nodeById = new Map(nodes.map(node => [node.id, node]))
    const traces = new Map<string, NodeTrace>()
    const engine = createWorkflowEngine({ ollamaBaseUrl: process.env.OLLAMA_BASE_URL })
    const result = await engine.execute(
        {
            id: 'workflow',
            name: 'workflow',
            nodes: nodes.map(toEngineNode),
            edges: edges.map(edge => ({
                id: edge.id,
                source: edge.source,
                sourceHandle: edge.sourceHandle ?? undefined,
                target: edge.target,
            })),
        },
        input,
        {
            onNodeStart: (id, _type, name) => {
                const node = nodeById.get(id)
                traces.set(id, {
                    id,
                    label: name,
                    nodeType: node?.type,
                    detail: '正在执行',
                    status: 'running',
                })
            },
            onNodeEnd: (id, execution) => {
                const node = nodeById.get(id)
                const previous = traces.get(id)
                traces.set(id, {
                    id,
                    label: previous?.label ?? node?.data.label ?? id,
                    nodeType: node?.type,
                    detail: node ? getNodeDetail(node, execution) : '节点已执行',
                    status: execution.success ? 'success' : 'error',
                    duration: execution.duration,
                    inputs: Object.fromEntries(Object.entries(execution.inputs ?? {}).map(([key, value]) => [key, serialize(value)])),
                    outputs: Object.fromEntries(Object.entries(execution.outputs).map(([key, value]) => [key, serialize(value)])),
                    error: execution.error?.message,
                })
            },
        }
    )

    const steps = [...traces.values()]
    const output = result.success ? JSON.stringify(result.outputs, null, 2) : (result.error?.message ?? '工作流执行失败')
    return {
        status: result.success ? ('SUCCESS' as const) : ('ERROR' as const),
        duration: result.duration ?? performance.now() - startedAt,
        outputs: output,
        nodeTraces: steps,
        error: result.success ? null : (result.error?.message ?? '工作流执行失败'),
    }
}
