// 流程节点
export interface FlowNode {
    id: string
    type: string
    position: { x: number; y: number }
    data?: Record<string, unknown>
}

// 流程边
export interface FlowEdge {
    id: string
    source: string
    sourceHandle?: string
    target: string
    [key: string]: unknown
}

// 流程编辑器属性
export interface FlowEditorProps {
    appId: string
    appName: string
    initialNodes?: FlowNode[]
    initialEdges?: FlowEdge[]
}

// 流程编辑器模式
export type EditorMode = 'edit' | 'detail'
export interface FlowEditorHeaderProps {
    appName?: string
    appId?: string
    mode?: EditorMode
    hasUnsavedChanges?: boolean
    isSaving?: boolean
    lastSavedAt?: string | null
    onSave?: () => void
    onTestRun?: () => void
    onExitTestRun?: () => void
    onSelectExecution?: (executionId: string) => void
}
