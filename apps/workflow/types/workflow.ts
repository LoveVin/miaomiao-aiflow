import type { Edge, Node } from '@xyflow/react'

export type NodeKind = 'start' | 'output' | 'llm' | 'knowledge' | 'http' | 'condition'

export type ParamType = 'string' | 'number' | 'boolean' | 'array' | 'object'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
export type HttpBodyType = 'none' | 'form-data' | 'x-www-form-urlencoded' | 'json' | 'raw' | 'binary'
export type KnowledgeRetrievalMode = 'vector' | 'fulltext' | 'hybrid'
export type KnowledgeOutputFormat = 'text' | 'json'

export interface FlowInput {
    id?: string
    name: string
    type: ParamType
    defaultValue?: string
    required?: boolean
    description?: string
}
export interface Intent {
    name: string
    description?: string
}
export interface KeyValuePair {
    key: string
    value: string
}
export interface OutputParam {
    name: string
    value: string
    description?: string
}
export interface NodeConfig {
    inputs?: FlowInput[]
    intents?: Intent[]
    model?: string
    systemPrompt?: string
    userPrompt?: string
    assistantPrompt?: string
    prompt?: string
    temperature?: number
    maxTokens?: number
    method?: HttpMethod
    url?: string
    headers?: KeyValuePair[]
    params?: KeyValuePair[]
    bodyType?: HttpBodyType
    body?: string
    formData?: KeyValuePair[]
    timeout?: number
    followRedirects?: boolean
    knowledgeBaseIds?: string[]
    query?: string
    retrievalMode?: KnowledgeRetrievalMode
    topK?: number
    threshold?: number
    outputFormat?: KnowledgeOutputFormat
    outputs?: OutputParam[]
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
    onUnpublish: () => void
    executions: DemoExecution[]
    onSelectExecution: (id: string) => void
    publishing: boolean
    isPublished: boolean
    publishedAt: string | null
}
export interface DemoExecution {
    id: string
    time: string
    completedAt?: string
    duration: number
    success: boolean
    error?: string | null
    input: Record<string, string>
    output: string
    steps: NodeTrace[]
}

export interface NodeTrace {
    id: string
    nodeType?: NodeKind
    label: string
    detail: string
    status?: 'pending' | 'running' | 'success' | 'error'
    duration?: number
    inputs?: Record<string, string>
    outputs?: Record<string, string>
    error?: string
}

export type NodeTraceStatus = NonNullable<NodeTrace['status']>
