'use client'

import { createContext, useContext } from 'react'

import type { FlowEdge, FlowNode, NodeKind } from '@/types/workflow'

export interface FlowEditorContextValue {
    onAddNode?: (type: NodeKind, position?: { x: number; y: number }) => void
    onDeleteNode?: (id: string) => void
    hasStartNode?: boolean
    nodes?: FlowNode[]
    edges?: FlowEdge[]
}
export const FlowEditorContext = createContext<FlowEditorContextValue>({})
export function useFlowEditorContext() {
    return useContext(FlowEditorContext)
}
