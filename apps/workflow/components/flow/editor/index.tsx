'use client'

import '@xyflow/react/dist/base.css'

import { Background, Connection, Controls, Edge, MiniMap, Node, NodeChange, ReactFlow, ReactFlowProvider } from '@xyflow/react'
import { useCallback, useMemo, useState } from 'react'

import { FlowEditorContext } from '@/components/flow/editor/context'
import { FlowEditorHeader } from '@/components/flow/editor/header'
import { nodeTypes } from '@/components/flow/nodes'
import { EditorMode, FlowEditorProps } from '@/types/workflow'

// 默认初始节点，用于新工作流，只包含开始节点
const defaultNodes: Node[] = [
    {
        id: 'start-1',
        type: 'start',
        position: { x: 350, y: 250 },
        data: {
            label: '开始',
            config: {
                inputs: [],
            },
        },
    },
]

// 默认初始边
const defaultEdges: Edge[] = []

function EditorInner({ appId, appName, initialNodes = [], initialEdges = [] }: FlowEditorProps) {
    const [nodes, setNodes] = useState<Node[]>(initialNodes.length > 0 ? (initialNodes as Node[]) : defaultNodes)
    const [edges, setEdges] = useState<Edge[]>(initialEdges.length > 0 ? (initialEdges as Edge[]) : defaultEdges)
    const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)

    const mode: EditorMode = useMemo(() => {
        if (selectedExecutionId) return 'detail'
        return 'edit'
    }, [selectedExecutionId])

    const onAddNode = (node: Node) => {
        setNodes([...nodes, node])
    }

    const hasStartNode = useMemo(() => {
        return nodes.some(node => node.type === 'start')
    }, [nodes])

    const fitViewOptions = useMemo(() => ({ padding: 0.2, includeHiddenNodes: true }), [])

    // 触发自动保存（防抖）
    const triggerAutoSave = useCallback(() => {
        console.log('trigger auto save')
    }, [])

    // 节点变化时回调
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
            console.log('node change', changes)
        },
        [nodes, triggerAutoSave]
    )

    // 边变化时回调
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            console.log('edge change', changes)
        },
        [triggerAutoSave]
    )

    //  节点点击时回调
    const onNodeClick = useCallback(
        (_: any, node: Node) => {
            if (mode === 'edit') {
                setSelectedNode(node)
            }
        },
        [mode]
    )

    // 选择节点时回调
    const onSelectionChange = useCallback(
        ({ nodes }: { nodes: Node[] }) => {
            if (mode === 'edit') {
                setSelectedNode(nodes[0])
            }
        },
        [mode]
    )

    // 连接时回调
    const onConnect = useCallback(
        (connection: Connection) => {
            console.log('connect', connection)
        },
        [nodes, triggerAutoSave]
    )

    return (
        <div className="h-dvh relative flex flex-col">
            <FlowEditorHeader />
            <div className="flex-1 min-h-0">
                <FlowEditorContext.Provider value={{ onAddNode, hasStartNode, nodes }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onConnect={onConnect}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        onSelectionChange={onSelectionChange}
                        fitView
                        fitViewOptions={fitViewOptions}
                        proOptions={{
                            hideAttribution: true,
                        }}
                    >
                        <Background bgColor="#f4f6fb" />
                        <MiniMap
                            pannable
                            zoomable
                            style={{
                                right: 420,
                                width: 120,
                                height: 80,
                            }}
                        />
                        <Controls />
                    </ReactFlow>
                </FlowEditorContext.Provider>
            </div>
        </div>
    )
}

export function FlowEditor({ appId, appName, initialNodes, initialEdges }: FlowEditorProps) {
    return (
        <ReactFlowProvider>
            <EditorInner appId={appId} appName={appName} initialNodes={initialNodes} initialEdges={initialEdges}></EditorInner>
        </ReactFlowProvider>
    )
}
