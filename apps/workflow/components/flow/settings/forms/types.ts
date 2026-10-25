import type { ComponentType } from 'react'

import type { FlowEdge, FlowNode } from '@/types/workflow'

export interface FlowContext {
    nodes: FlowNode[]
    edges: FlowEdge[]
}

export interface NodeSettingsFormProps<T> {
    node: FlowNode
    onSave: (config: Partial<T>) => void
    flowContext?: FlowContext
}

export type NodeSettingsFormComponent<T = unknown> = ComponentType<NodeSettingsFormProps<T>>
