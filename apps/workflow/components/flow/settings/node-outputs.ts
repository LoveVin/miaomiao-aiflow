import type { Edge } from '@xyflow/react'

import type { FlowInput, FlowNode, NodeKind } from '@/types/workflow'

export interface NodeOutputVariable {
    name: string
    label: string
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any'
    description?: string
}

export interface AvailableNodeOutput {
    nodeId: string
    nodeType: NodeKind
    nodeLabel: string
    outputs: NodeOutputVariable[]
}

function getStartOutputs(inputs?: FlowInput[]) {
    return (inputs || []).map(input => ({
        name: input.name,
        label: input.name,
        type: input.type,
        description: input.description,
    }))
}

export function getNodeTypeOutputs(nodeType: NodeKind, nodeData?: FlowNode): NodeOutputVariable[] {
    switch (nodeType) {
        case 'start':
            return getStartOutputs(nodeData?.data.config?.inputs)
        case 'model':
            return [
                { name: 'output', label: '输出内容', type: 'string', description: '模型生成的文本内容' },
                { name: 'tokens', label: 'Token 数', type: 'number', description: '消耗的 token 数量' },
            ]
        case 'http':
            return [
                { name: 'data', label: '响应数据', type: 'any', description: 'HTTP 响应的 body 数据' },
                { name: 'status', label: '状态码', type: 'number', description: 'HTTP 响应状态码' },
                { name: 'headers', label: '响应头', type: 'object', description: 'HTTP 响应头' },
                { name: 'success', label: '是否成功', type: 'boolean', description: '请求是否成功' },
                { name: 'error', label: '错误信息', type: 'string', description: '请求失败时的错误信息' },
            ]
        case 'condition':
            return [
                { name: 'matchedIntent', label: '匹配意图', type: 'string', description: '匹配到的意图名称' },
                { name: 'confidence', label: '置信度', type: 'number', description: '匹配的置信度' },
            ]
        case 'knowledge':
            return [
                { name: 'output', label: '输出内容', type: 'string', description: '检索结果' },
                { name: 'results', label: '结果数组', type: 'array', description: '检索结果数组' },
                { name: 'count', label: '结果数量', type: 'number', description: '检索到的结果数量' },
            ]
        case 'output':
            return []
        default:
            return []
    }
}

export function getNodeTypeLabel(nodeType: NodeKind) {
    const labels: Record<NodeKind, string> = {
        start: '开始',
        output: '结束',
        model: '大模型',
        knowledge: '知识库',
        http: 'HTTP 请求',
        condition: '条件',
    }
    return labels[nodeType] || nodeType
}

export function findUpstreamNodes(currentNodeId: string, nodes: FlowNode[], edges: Edge[]) {
    const reverseEdgeMap = new Map<string, string[]>()
    edges.forEach(edge => {
        reverseEdgeMap.set(edge.target, [...(reverseEdgeMap.get(edge.target) || []), edge.source])
    })

    const visited = new Set<string>()
    const upstreamIds = new Set<string>()
    const visit = (nodeId: string) => {
        if (visited.has(nodeId)) return
        visited.add(nodeId)
        for (const sourceId of reverseEdgeMap.get(nodeId) || []) {
            upstreamIds.add(sourceId)
            visit(sourceId)
        }
    }
    visit(currentNodeId)

    const nodeMap = new Map(nodes.map(node => [node.id, node]))
    return Array.from(upstreamIds)
        .map(nodeId => nodeMap.get(nodeId))
        .filter(node => Boolean(node)) as FlowNode[]
}

export function getAvailableNodeOutputs(currentNodeId: string, nodes: FlowNode[], edges: Edge[]) {
    return findUpstreamNodes(currentNodeId, nodes, edges)
        .filter(node => node.type !== 'output')
        .map(node => ({
            nodeId: node.id,
            nodeType: node.type as NodeKind,
            nodeLabel: node.data.label || getNodeTypeLabel(node.type as NodeKind),
            outputs: getNodeTypeOutputs(node.type as NodeKind, node),
        }))
        .filter(item => item.outputs.length > 0)
}

export function formatVariableExpression(nodeId: string, variableName: string) {
    return `\${${nodeId}.${variableName}}`
}

export function parseVariableExpression(expression: string) {
    const match = expression.match(/\$\{([^.]+)\.([^}]+)\}/)
    return match ? { nodeId: match[1]!, variableName: match[2]! } : null
}
