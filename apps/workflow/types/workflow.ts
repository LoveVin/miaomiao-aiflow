import type { Edge, Node } from '@xyflow/react'

export type NodeKind = 'start' | 'output' | 'model' | 'knowledge' | 'http' | 'condition'
export interface FlowInput {
    id: string
    name: string
    type: 'string' | 'number' | 'boolean'
    required: boolean
}
export interface NodeConfig {
    inputs?: FlowInput[]
    model?: string
    systemPrompt?: string
    prompt?: string
    temperature?: number
    maxTokens?: string
    knowledge?: string
    topK?: string
    method?: string
    url?: string
    body?: string
    field?: string
    operator?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan'
    value?: string
    format?: string
    template?: string
    stream?: boolean
}
export type FlowNodeData = { label: string; config: NodeConfig } & Record<string, unknown>
export type FlowNode = Node<FlowNodeData, NodeKind>
export type FlowEdge = Edge

export interface FlowEditorProps {
    appId: string
    appName: string
    initialNodes?: FlowNode[]
    initialEdges?: FlowEdge[]
}
export type EditorMode = 'edit' | 'detail'
export type EditorTab = 'edit' | 'logs' | 'monitor' | 'api'
export interface FlowEditorHeaderProps {
    appName: string
    appIcon?: string
    appColor?: string
    hasUnsavedChanges: boolean
    lastSavedAt: string | null
    tab: EditorTab
    onTabChange: (tab: EditorTab) => void
    onSave: () => void
    onTestRun: () => void
    onPublish: () => void
}
export interface DemoExecution {
    id: string
    time: string
    duration: number
    success: boolean
    input: Record<string, string>
    output: string
    steps: { id: string; label: string; detail: string }[]
}
