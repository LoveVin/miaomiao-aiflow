import { createWorkflowEngine, type NodeExecutionResult, type WorkflowNode } from '@miaomiao-aiflow/ai-engine'

import { prisma } from '@/lib/prisma'
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

function tokenize(text: string) {
    return Array.from(new Set(text.toLowerCase().match(/[\p{Script=Han}]+|[a-z0-9]+/gu) ?? []))
}

function scoreChunk(query: string, content: string) {
    const normalizedQuery = query.toLowerCase().trim()
    const normalizedContent = content.toLowerCase()
    if (!normalizedQuery || !normalizedContent) return 0
    if (normalizedContent.includes(normalizedQuery)) return 1

    const queryTokens = tokenize(normalizedQuery)
    if (!queryTokens.length) return 0
    const contentTokens = new Set(tokenize(normalizedContent))
    const matched = queryTokens.filter(token => [...contentTokens].some(item => item.includes(token))).length
    return matched / queryTokens.length
}

async function retrieveKnowledge(options: { query: string; knowledgeBaseIds: string[]; topK: number; threshold?: number }) {
    const knowledgeBases = await prisma.knowledgeBase.findMany({
        where: { id: { in: options.knowledgeBaseIds } },
        include: {
            documents: {
                select: { id: true, name: true, content: true },
            },
        },
    })

    return knowledgeBases
        .flatMap(knowledgeBase =>
            knowledgeBase.documents.flatMap(
                document =>
                    (document.content ?? '').match(/[\s\S]{1,500}/g)?.map((content, chunkIndex) => {
                        const score = scoreChunk(options.query, content)
                        return {
                            chunkId: `${document.id}_${chunkIndex}`,
                            content,
                            chunkIndex,
                            documentId: document.id,
                            knowledgeBaseId: knowledgeBase.id,
                            score,
                            metadata: { documentName: document.name },
                        }
                    }) ?? []
            )
        )
        .filter(item => item.score >= (options.threshold ?? 0))
        .sort((left, right) => right.score - left.score)
        .slice(0, options.topK)
}

export async function runWorkflow(nodes: FlowNode[], edges: FlowEdge[], input: Record<string, string>) {
    const startedAt = performance.now()
    const nodeById = new Map(nodes.map(node => [node.id, node]))
    const traces = new Map<string, NodeTrace>()
    const engine = createWorkflowEngine({
        ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
        knowledgeRetrievalProvider: retrieveKnowledge,
    })
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
