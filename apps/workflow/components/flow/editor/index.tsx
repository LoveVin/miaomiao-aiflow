'use client'

import '@xyflow/react/dist/style.css'
import './editor.css'

import {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    BackgroundVariant,
    type Connection,
    Controls,
    type EdgeChange,
    type NodeChange,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react'
import { Check, CircleAlert, MousePointer2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ApplicationPages } from '@/components/flow/editor/application-pages'
import { FlowEditorContext } from '@/components/flow/editor/context'
import { ExecutionDetailDrawer } from '@/components/flow/editor/execution-history'
import { FlowEditorHeader } from '@/components/flow/editor/header'
import { NodeConfigPanel } from '@/components/flow/editor/node-config'
import { TestRunDrawer } from '@/components/flow/editor/test-run-drawer'
import { ICON_MAP } from '@/components/flow/icon-map'
import { nodeTypes } from '@/components/flow/nodes'
import { PortalButton, SearchField } from '@/components/shared'
import { appService } from '@/lib/services/app-service'
import { workflowService } from '@/lib/services/workflow-service'
import { defaultWorkflowConfigs as defaultConfigs, workflowNodeLibrary as library } from '@/lib/workflow-presets'
import type { DemoExecution, EditorTab, FlowEdge, FlowEditorProps, FlowNode, NodeKind } from '@/types/workflow'

const edgeOptions = { type: 'default', style: { stroke: '#a69bc6', strokeWidth: 2 } }
const iconButtonClass =
    'grid size-[25px] shrink-0 place-items-center rounded-[5px] border-0 bg-transparent text-[#a5a7b7] hover:bg-[#f3f1fd] hover:text-[#6658bd]'
const nodeIconColors: Record<NodeKind, string> = {
    start: 'bg-[#e9f7ef] text-[#53a383]',
    llm: 'bg-[#efebff] text-[#7b61d6]',
    knowledge: 'bg-[#eaf2fe] text-[#588ace]',
    http: 'bg-[#eaf2fe] text-[#5186cb]',
    condition: 'bg-[#fff4df] text-[#bd8735]',
    output: 'bg-[#eaf1fe] text-[#5c88cf]',
}
const AUTO_SAVE_DELAY = 2000

function getNextNodeId(kind: NodeKind, nodes: FlowNode[]) {
    const nodePattern = new RegExp(`^${kind}-(\\d+)$`)
    const maxSequence = nodes.reduce((max, node) => {
        const sequence = nodePattern.exec(node.id)?.[1]
        return sequence ? Math.max(max, Number(sequence)) : max
    }, 0)

    return `${kind}-${maxSequence + 1}`
}

function normalizeWorkflowIds(nodes: FlowNode[], edges: FlowEdge[]) {
    const nodeIdMap = new Map<string, string>()
    const nextSequences = new Map<NodeKind, number>()
    const mapNodeId = (nodeId: string) => nodeIdMap.get(nodeId) || nodeId
    const normalizeVariableReferences = <T,>(value: T): T => {
        if (typeof value === 'string')
            return value.replace(
                /\$\{([^.]+)\.([^}]+)\}/g,
                (_, nodeId: string, variableName: string) => `\${${mapNodeId(nodeId)}.${variableName}}`
            ) as T
        if (Array.isArray(value)) return value.map(item => normalizeVariableReferences(item)) as T
        if (value && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeVariableReferences(item)])) as T
        }
        return value
    }
    const normalizedNodes = nodes.map(node => {
        const kind = ((node.type as string) === 'model' ? 'llm' : node.type) as NodeKind
        const nextSequence = (nextSequences.get(kind) || 0) + 1
        nextSequences.set(kind, nextSequence)
        const nextId = `${kind}-${nextSequence}`
        if (nextId !== node.id) nodeIdMap.set(node.id, nextId)
        return { ...node, id: nextId, type: kind, data: { ...node.data, config: normalizeVariableReferences(node.data.config) } }
    })

    return {
        nodes: normalizedNodes,
        edges: edges.map(edge => ({ ...edge, id: mapNodeId(edge.id), source: mapNodeId(edge.source), target: mapNodeId(edge.target) })),
    }
}

function EditorInner({ appId, appName, initialNodes, initialEdges }: FlowEditorProps) {
    const [nodes, setNodes] = useState<FlowNode[]>(initialNodes ?? [])
    const [edges, setEdges] = useState<FlowEdge[]>(initialEdges ?? [])
    const [name, setName] = useState(appName)
    const [appIcon, setAppIcon] = useState<{ icon: string; color: string } | null>(null)
    const [loaded, setLoaded] = useState(false)
    const [storageBlocked, setStorageBlocked] = useState(false)
    const [dirty, setDirty] = useState(false)
    const [savedAt, setSavedAt] = useState<string | null>(null)
    const [publishing, setPublishing] = useState(false)
    const [isPublished, setIsPublished] = useState(false)
    const [publishedAt, setPublishedAt] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [tab, setTab] = useState<EditorTab>('edit')
    const [testOpen, setTestOpen] = useState(false)
    const [running, setRunning] = useState(false)
    const [search, setSearch] = useState('')
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState<'success' | 'error'>('success')
    const [input, setInput] = useState<Record<string, string>>({})
    const [executions, setExecutions] = useState<DemoExecution[]>([])
    const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)
    const [executionDetailOpen, setExecutionDetailOpen] = useState(false)
    const { screenToFlowPosition } = useReactFlow<FlowNode, FlowEdge>()
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const nodesRef = useRef(nodes)
    const edgesRef = useRef(edges)
    const nameRef = useRef(name)

    useEffect(() => {
        nodesRef.current = nodes
    }, [nodes])
    useEffect(() => {
        edgesRef.current = edges
    }, [edges])
    useEffect(() => {
        nameRef.current = name
    }, [name])
    useEffect(() => {
        if (!message) return
        const timer = window.setTimeout(() => setMessage(''), 2200)
        return () => window.clearTimeout(timer)
    }, [message])
    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
        }
    }, [])
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const app = await appService.getList().then(result => result.items.find(item => item.id === appId))
                if (cancelled) return
                if (app) {
                    setName(app.name)
                    setAppIcon({ icon: app.icon, color: app.color })
                    setIsPublished(app.isPublished)
                    setPublishedAt(app.publishedAt)
                }
                const workflow = await workflowService.get(appId)
                if (cancelled) return
                const normalizedWorkflow = normalizeWorkflowIds(workflow.nodes as FlowNode[], workflow.edges as FlowEdge[])
                setNodes(normalizedWorkflow.nodes)
                setEdges(normalizedWorkflow.edges)
                setSavedAt(workflow.updatedAt)
                const runs = await workflowService.getExecutions(appId)
                if (cancelled) return
                setExecutions(runs.items)
                setLoaded(true)
            } catch (error) {
                if (!cancelled) {
                    setMessage(error instanceof Error ? error.message : '加载工作流失败')
                    setMessageType('error')
                    setLoaded(true)
                }
            }
        })()
        return () => {
            cancelled = true
        }
    }, [appId])
    const selected = nodes.find(node => node.id === selectedId)
    const startInputs = nodes.find(node => node.type === 'start')?.data.config.inputs ?? []
    const hasStartNode = nodes.some(node => node.type === 'start')
    const save = useCallback(
        async ({ silent = false }: { silent?: boolean } = {}): Promise<boolean> => {
            if (!loaded) return false
            try {
                const result = await workflowService.save(appId, {
                    name: nameRef.current,
                    nodes: nodesRef.current.map(({ selected: _selected, dragging: _dragging, ...node }) => node),
                    edges: edgesRef.current.map(({ selected: _selected, ...edge }) => edge),
                })
                setSavedAt(result.updatedAt)
                setDirty(false)
                if (!silent) {
                    setMessage('保存成功')
                    setMessageType('success')
                }
                return true
            } catch (error) {
                setMessage(error instanceof Error ? error.message : '保存失败')
                setMessageType('error')
                return false
            }
        },
        [appId, loaded]
    )
    const triggerAutoSave = useCallback(() => {
        setDirty(true)
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = setTimeout(() => {
            void save({ silent: true })
        }, AUTO_SAVE_DELAY)
    }, [save])
    const onDeleteNode = useCallback(
        (id: string) => {
            setNodes(old => old.filter(node => node.id !== id))
            setEdges(old => old.filter(edge => edge.source !== id && edge.target !== id))
            setSelectedId(old => (old === id ? null : old))
            triggerAutoSave()
        },
        [triggerAutoSave]
    )
    const onAddNode = useCallback(
        (kind: NodeKind, position?: { x: number; y: number }) => {
            if (kind === 'start' && hasStartNode) {
                setMessage('工作流只能有一个开始节点。')
                setMessageType('error')
                return
            }
            const id = getNextNodeId(kind, nodesRef.current)
            const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
            setNodes(currentNodes => [
                ...currentNodes,
                {
                    id,
                    type: kind,
                    position: position ?? center,
                    data: { label: library.find(item => item.kind === kind)!.label, config: structuredClone(defaultConfigs[kind]) },
                },
            ])
            setSelectedId(id)
            setTab('edit')
            setTestOpen(false)
            triggerAutoSave()
        },
        [hasStartNode, screenToFlowPosition, triggerAutoSave]
    )
    const context = useMemo(
        () => ({ nodes, edges, hasStartNode, onAddNode, onDeleteNode }),
        [nodes, edges, hasStartNode, onAddNode, onDeleteNode]
    )
    const onNodesChange = useCallback(
        (changes: NodeChange<FlowNode>[]) => {
            setNodes(old => applyNodeChanges(changes, old))
            if (changes.some(change => change.type !== 'select' && change.type !== 'dimensions')) triggerAutoSave()
        },
        [triggerAutoSave]
    )
    const onEdgesChange = useCallback(
        (changes: EdgeChange<FlowEdge>[]) => {
            setEdges(old => applyEdgeChanges(changes, old))
            if (changes.some(change => change.type !== 'select')) triggerAutoSave()
        },
        [triggerAutoSave]
    )
    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges(old => addEdge(connection, old))
            triggerAutoSave()
        },
        [triggerAutoSave]
    )
    const publish = async () => {
        setPublishing(true)
        if (!(await save({ silent: true }))) {
            setPublishing(false)
            return
        }
        try {
            const result = await workflowService.publish(appId)
            setIsPublished(true)
            setPublishedAt(new Date().toISOString())
            setMessage(`发布成功，当前版本 V${result.version}`)
            setMessageType('success')
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '发布失败')
            setMessageType('error')
        } finally {
            setPublishing(false)
        }
    }
    const unpublish = async () => {
        setPublishing(true)
        try {
            await workflowService.unpublish(appId)
            setIsPublished(false)
            setPublishedAt(null)
            setMessage('已取消发布')
            setMessageType('success')
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '取消发布失败')
            setMessageType('error')
        } finally {
            setPublishing(false)
        }
    }
    const run = async (): Promise<boolean> => {
        setRunning(true)
        try {
            const execution = await workflowService.run(appId, input)
            setExecutions(old => [execution, ...old])
            setSelectedExecutionId(execution.id)
            setSavedAt(execution.time)
            return true
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '工作流执行失败')
            setMessageType('error')
            return false
        } finally {
            setRunning(false)
        }
    }
    const latest = executions[0]
    const selectedExecution = executions.find(item => item.id === selectedExecutionId)
    const selectExecution = (id: string) => {
        setSelectedExecutionId(id)
        setExecutionDetailOpen(true)
        setSelectedId(null)
        setTestOpen(false)
    }
    const showTest = () => {
        setTab('edit')
        setSelectedId(null)
        setTestOpen(true)
    }
    const onTabChange = (next: EditorTab) => {
        setTab(next)
        setTestOpen(false)
        setSelectedId(null)
    }
    return (
        <div className="wf-editor flex h-dvh min-h-[540px] flex-col overflow-hidden bg-[#f7f8fc] text-[12px] text-[#30334a]">
            <FlowEditorHeader
                appName={name}
                appIcon={appIcon?.icon}
                appColor={appIcon?.color}
                hasUnsavedChanges={dirty}
                lastSavedAt={savedAt}
                tab={tab}
                onTabChange={onTabChange}
                onSave={() => void save()}
                onTestRun={showTest}
                onPublish={publish}
                onUnpublish={unpublish}
                executions={executions}
                onSelectExecution={selectExecution}
                publishing={publishing}
                isPublished={isPublished}
                publishedAt={publishedAt}
            />
            <FlowEditorContext.Provider value={context}>
                {tab !== 'edit' && <ApplicationPages tab={tab} executions={executions} appId={appId} appName={name} />}
                <div className={`min-h-0 flex-1 ${tab !== 'edit' ? 'hidden' : 'flex'}`}>
                    <aside className="flex w-[216px] shrink-0 flex-col overflow-y-auto border-r border-[#e7e9f1] bg-white px-[13px] py-[22px] max-[1100px]:w-[190px] max-[800px]:w-[156px] max-[800px]:px-2 max-[800px]:py-[18px] [&_.portal-search]:mb-[14px] [&_.portal-search]:h-[34px] [&_.portal-search]:w-full [&_.portal-search]:border [&_.portal-search]:border-transparent [&_.portal-search]:bg-[#f6f7fb]">
                        <div className="mx-[9px] mb-[18px] flex items-center gap-2">
                            <h2 className="m-0 text-[13px] font-[650]">节点</h2>
                            <span className="rounded-[5px] bg-[#f0f1f7] px-[5px] py-px text-[10px] text-[#989bad]">{library.length}</span>
                        </div>
                        <SearchField value={search} onChange={setSearch} placeholder="搜索节点" />
                        {library
                            .filter(item => `${item.label}${item.description}`.includes(search))
                            .map(item => {
                                const Icon = ICON_MAP[item.kind]
                                return (
                                    <button
                                        className="flex w-full items-center gap-[10px] rounded-lg border border-transparent bg-transparent px-2 py-[11px] text-left hover:border-[#eeecfc] hover:bg-[#f7f6fe] max-[800px]:gap-[6px] max-[800px]:px-[3px] max-[800px]:py-[10px]"
                                        key={item.kind}
                                        disabled={!loaded || (item.kind === 'start' && hasStartNode)}
                                        draggable={loaded && !(item.kind === 'start' && hasStartNode)}
                                        onDragStart={event => {
                                            event.dataTransfer.setData('application/miaomiao-node', item.kind)
                                            event.dataTransfer.effectAllowed = 'move'
                                        }}
                                        onClick={() => onAddNode(item.kind)}
                                    >
                                        <span
                                            className={`grid size-[30px] shrink-0 place-items-center rounded-lg ${nodeIconColors[item.kind]}`}
                                        >
                                            <Icon size={16} />
                                        </span>
                                        <span className="flex flex-1 flex-col gap-[5px]">
                                            <strong className="text-[11px] font-semibold text-[#555a70]">{item.label}</strong>
                                            <small className="text-[9px] text-[#a4a8b7] max-[800px]:text-[8px]">{item.description}</small>
                                        </span>
                                    </button>
                                )
                            })}
                        <div className="mx-[5px] mt-auto border-t border-[#eeeff5] px-[10px] pt-[23px] pb-1 text-[#a5a9bc]">
                            <MousePointer2 size={17} className="mb-[10px] text-[#a497df]" />
                            <strong className="block text-[10px] font-medium text-[#8c90a8]">让灵感自由连接</strong>
                            <p className="mt-2 text-[9px] leading-[1.9]">点击或拖入节点，通过连接点编排你的 AI 工作流。</p>
                        </div>
                    </aside>
                    <main
                        className="relative min-w-0 flex-1"
                        onDragOver={event => {
                            event.preventDefault()
                            event.dataTransfer.dropEffect = 'move'
                        }}
                        onDrop={event => {
                            event.preventDefault()
                            const kind = event.dataTransfer.getData('application/miaomiao-node') as NodeKind
                            if (loaded && library.some(item => item.kind === kind))
                                onAddNode(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
                        }}
                    >
                        {loaded ? (
                            <ReactFlow<FlowNode, FlowEdge>
                                nodes={nodes}
                                edges={edges}
                                nodeTypes={nodeTypes}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onNodeClick={(_, node) => {
                                    setSelectedId(node.id)
                                    setTab('edit')
                                    setTestOpen(false)
                                }}
                                onPaneClick={() => setSelectedId(null)}
                                defaultEdgeOptions={edgeOptions}
                                fitView
                                fitViewOptions={{ padding: 0.22, maxZoom: 1 }}
                                minZoom={0.3}
                                maxZoom={1.8}
                                deleteKeyCode={['Backspace', 'Delete']}
                                isValidConnection={connection => {
                                    const source = nodes.find(node => node.id === connection.source)
                                    const target = nodes.find(node => node.id === connection.target)
                                    const conditionHandlePattern = /^intent-\d+$/
                                    const hasConditionHandle =
                                        source?.type !== 'condition' ||
                                        (conditionHandlePattern.test(connection.sourceHandle ?? '') &&
                                            Number((connection.sourceHandle ?? '').split('-')[1]) <
                                                (source.data.config.intents?.length ?? 0))
                                    return Boolean(
                                        source &&
                                        target &&
                                        source.id !== target.id &&
                                        source.type !== 'output' &&
                                        target.type !== 'start' &&
                                        hasConditionHandle
                                    )
                                }}
                                proOptions={{ hideAttribution: true }}
                            >
                                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d9d9e6" bgColor="#f7f8fc" />
                                <Controls position="bottom-right" />
                            </ReactFlow>
                        ) : (
                            <div className="grid h-full place-items-center text-[#a6a9bd]">正在读取工作流…</div>
                        )}
                        <div className="pointer-events-none absolute top-5 left-[23px] flex items-center gap-2 text-[10px] text-[#7c8197]">
                            <span className="size-[6px] rounded-full bg-[#9a8fd8]" />
                            工作流编排
                            <span className="ml-1 border-l border-[#dfe1ec] pl-[10px] text-[9px] text-[#a7aabd]">
                                {nodes.length} 节点 · {edges.length} 连接
                            </span>
                        </div>
                        <div className="pointer-events-none absolute bottom-[25px] left-6 text-[9px] text-[#a1a6ba] max-[1100px]:max-w-[220px] max-[1100px]:leading-[1.8] max-[800px]:hidden">
                            拖动节点调整位置 · 拖动连接点连线 · 选中后 Delete 删除
                        </div>
                    </main>
                    {tab === 'edit' && selected && !testOpen ? (
                        <NodeConfigPanel
                            key={selected.id}
                            node={selected}
                            onUpdate={(label, config) => {
                                setNodes(old =>
                                    old.map(node => (node.id === selected.id ? { ...node, data: { ...node.data, label, config } } : node))
                                )
                                if (selected.type === 'condition') {
                                    const validHandles = new Set((config.intents ?? []).map((_, index) => `intent-${index}`))
                                    setEdges(old =>
                                        old.filter(edge => edge.source !== selected.id || validHandles.has(edge.sourceHandle ?? ''))
                                    )
                                }
                                triggerAutoSave()
                            }}
                            onClose={() => setSelectedId(null)}
                            onDelete={() => onDeleteNode(selected.id)}
                        />
                    ) : null}
                </div>
            </FlowEditorContext.Provider>
            <TestRunDrawer
                open={testOpen}
                onOpenChange={setTestOpen}
                inputParams={startInputs}
                values={input}
                onValuesChange={setInput}
                onRun={run}
                onReset={() => setInput({})}
                running={running}
                execution={latest}
            />
            <ExecutionDetailDrawer open={executionDetailOpen} onOpenChange={setExecutionDetailOpen} execution={selectedExecution} />
            {message && (
                <div
                    className="fixed top-[82px] right-[22px] z-[60] flex max-w-[410px] items-center gap-[10px] rounded-[10px] border border-[#e4e1ef] bg-white p-[14px] text-[12px] leading-[1.7] shadow-[0_10px_35px_#39345d1a]"
                    role="status"
                >
                    {messageType === 'error' ? (
                        <CircleAlert size={17} className="shrink-0 text-[#d18282]" />
                    ) : (
                        <Check size={17} className="shrink-0 text-[#6eaf94]" />
                    )}
                    <span>{message}</span>
                    <button className={iconButtonClass} aria-label="关闭提示" onClick={() => setMessage('')}>
                        <X size={15} />
                    </button>
                </div>
            )}
        </div>
    )
}

export function FlowEditor(props: FlowEditorProps) {
    return (
        <ReactFlowProvider>
            <EditorInner {...props} />
        </ReactFlowProvider>
    )
}
