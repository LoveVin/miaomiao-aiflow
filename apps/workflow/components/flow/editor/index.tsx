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
import { Check, MousePointer2, Play, Plus, Sparkles, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApplicationPages } from '@/components/flow/editor/application-pages'
import { FlowEditorContext } from '@/components/flow/editor/context'
import { FlowEditorHeader } from '@/components/flow/editor/header'
import { NodeConfigPanel } from '@/components/flow/editor/node-config'
import { ICON_MAP } from '@/components/flow/icon-map'
import { nodeTypes } from '@/components/flow/nodes'
import { PortalButton, SearchField } from '@/components/shared'
import type { App } from '@/mocks/apps'
import {
    createWorkflowApplication,
    defaultWorkflowConfigs as defaultConfigs,
    defaultWorkflowEdges as defaultEdges,
    defaultWorkflowInput,
    defaultWorkflowNodes as defaultNodes,
    runMockWorkflow,
    workflowApplications,
    workflowNodeLibrary as library,
} from '@/mocks/workflow'
import type { DemoExecution, EditorTab, FlowEdge, FlowEditorProps, FlowNode, NodeKind } from '@/types/workflow'

const edgeOptions = { type: 'default', style: { stroke: '#a69bc6', strokeWidth: 2 } }
const panelClass =
    'z-3 flex min-h-0 w-[330px] shrink-0 flex-col border-l border-[#e6e8f1] bg-white max-[1100px]:w-[300px] max-[800px]:absolute max-[800px]:top-[108px] max-[800px]:right-0 max-[800px]:bottom-0 max-[800px]:w-[min(310px,80vw)] max-[800px]:shadow-[-10px_0_30px_#34365b10]'
const iconButtonClass =
    'grid size-[25px] shrink-0 place-items-center rounded-[5px] border-0 bg-transparent text-[#a5a7b7] hover:bg-[#f3f1fd] hover:text-[#6658bd]'
const emptyClass = 'flex flex-col items-center gap-[15px] px-[14px] py-10 text-center text-[#a6a9bd]'
const fieldControlClass =
    'w-full min-h-[65px] resize-y rounded-[7px] border border-[#e0e3ee] bg-white px-[10px] py-[9px] text-[11px] leading-[1.7] text-[#60657b] outline-none focus:border-[#a293eb] focus:shadow-[0_0_0_3px_#f2efff]'
const nodeIconColors: Record<NodeKind, string> = {
    start: 'bg-[#e9f7ef] text-[#53a383]',
    model: 'bg-[#efebff] text-[#7b61d6]',
    knowledge: 'bg-[#eaf2fe] text-[#588ace]',
    http: 'bg-[#eaf2fe] text-[#5186cb]',
    condition: 'bg-[#fff4df] text-[#bd8735]',
    output: 'bg-[#eaf1fe] text-[#5c88cf]',
}

function EditorInner({ appId, appName, initialNodes, initialEdges }: FlowEditorProps) {
    const [nodes, setNodes] = useState<FlowNode[]>(initialNodes ?? defaultNodes)
    const [edges, setEdges] = useState<FlowEdge[]>(initialEdges ?? (initialNodes ? [] : defaultEdges))
    const [name, setName] = useState(appName)
    const [appIcon, setAppIcon] = useState<Pick<App, 'icon' | 'color'> | null>(null)
    const [loaded, setLoaded] = useState(false)
    const [storageBlocked, setStorageBlocked] = useState(false)
    const [dirty, setDirty] = useState(false)
    const [savedAt, setSavedAt] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [tab, setTab] = useState<EditorTab>('edit')
    const [testOpen, setTestOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [message, setMessage] = useState('')
    const [input, setInput] = useState<Record<string, string>>(defaultWorkflowInput)
    const [executions, setExecutions] = useState<DemoExecution[]>([])
    const { screenToFlowPosition } = useReactFlow<FlowNode, FlowEdge>()
    const storageKey = `miaomiao.workflow.v1.${appId}`
    useEffect(() => {
        const timer = window.setTimeout(() => {
            try {
                const apps: App[] = JSON.parse(localStorage.getItem('miaomiao.apps.v1') ?? '[]')
                const app = apps.find(item => String(item.id) === appId)
                if (app?.name) setName(app.name)
                if (app) setAppIcon({ icon: app.icon, color: app.color })
                const raw = localStorage.getItem(storageKey)
                if (raw) {
                    const saved = JSON.parse(raw) as { version: number; nodes: FlowNode[]; edges: FlowEdge[]; savedAt: string }
                    if (
                        saved.version === 1 &&
                        Array.isArray(saved.nodes) &&
                        Array.isArray(saved.edges) &&
                        saved.nodes.every(
                            node =>
                                node &&
                                typeof node.id === 'string' &&
                                library.some(item => item.kind === node.type) &&
                                Number.isFinite(node.position?.x) &&
                                Number.isFinite(node.position?.y) &&
                                typeof node.data?.label === 'string' &&
                                node.data.config &&
                                typeof node.data.config === 'object' &&
                                (!node.data.config.inputs ||
                                    (Array.isArray(node.data.config.inputs) &&
                                        node.data.config.inputs.every(
                                            item =>
                                                item &&
                                                typeof item.id === 'string' &&
                                                typeof item.name === 'string' &&
                                                ['string', 'number', 'boolean'].includes(item.type)
                                        )))
                        ) &&
                        saved.edges.every(
                            edge =>
                                edge &&
                                typeof edge.id === 'string' &&
                                saved.nodes.some(node => node.id === edge.source) &&
                                saved.nodes.some(node => node.id === edge.target)
                        )
                    ) {
                        setNodes(
                            saved.nodes.map(node => ({
                                ...node,
                                data: {
                                    ...node.data,
                                    label:
                                        node.type === 'output' && ['输出结果', '输出'].includes(node.data.label)
                                            ? '结束节点'
                                            : node.data.label,
                                },
                            }))
                        )
                        setEdges(saved.edges)
                        setSavedAt(saved.savedAt)
                    } else {
                        setStorageBlocked(true)
                        setMessage(
                            '本地工作流包含不支持的节点类型或无效数据。原始存储未修改，当前显示初始画布并已阻止覆盖保存；请备份并移除旧数据后重新打开。'
                        )
                    }
                }
            } catch {
                setStorageBlocked(true)
                setMessage('无法读取本地存储。为保护原始数据，已阻止覆盖保存；当前更改仅在本次会话中编辑。')
            }
            setLoaded(true)
        }, 0)
        return () => window.clearTimeout(timer)
    }, [appId, storageKey])
    const selected = nodes.find(node => node.id === selectedId)
    const startInputs = nodes.find(node => node.type === 'start')?.data.config.inputs ?? []
    const hasStartNode = nodes.some(node => node.type === 'start')
    const onDeleteNode = useCallback((id: string) => {
        setNodes(old => old.filter(node => node.id !== id))
        setEdges(old => old.filter(edge => edge.source !== id && edge.target !== id))
        setSelectedId(old => (old === id ? null : old))
        setDirty(true)
    }, [])
    const onAddNode = useCallback(
        (kind: NodeKind, position?: { x: number; y: number }) => {
            if (kind === 'start' && hasStartNode) {
                setMessage('工作流只能有一个开始节点。')
                return
            }
            const id = `${kind}-${crypto.randomUUID()}`
            const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
            setNodes(old => [
                ...old,
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
            setDirty(true)
        },
        [hasStartNode, screenToFlowPosition]
    )
    const context = useMemo(() => ({ nodes, hasStartNode, onAddNode, onDeleteNode }), [nodes, hasStartNode, onAddNode, onDeleteNode])
    const onNodesChange = useCallback((changes: NodeChange<FlowNode>[]) => {
        setNodes(old => applyNodeChanges(changes, old))
        if (changes.some(change => change.type !== 'select' && change.type !== 'dimensions')) setDirty(true)
    }, [])
    const onEdgesChange = useCallback((changes: EdgeChange<FlowEdge>[]) => {
        setEdges(old => applyEdgeChanges(changes, old))
        if (changes.some(change => change.type !== 'select')) setDirty(true)
    }, [])
    const onConnect = useCallback((connection: Connection) => {
        setEdges(old => addEdge(connection, old))
        setDirty(true)
    }, [])
    const save = () => {
        if (!loaded) return false
        if (storageBlocked) {
            setMessage('本地旧数据未加载，已阻止覆盖保存。请先备份并移除当前应用的旧工作流数据，再重新打开。')
            return false
        }
        try {
            const time = new Date().toISOString()
            localStorage.setItem(
                storageKey,
                JSON.stringify({
                    version: 1,
                    nodes: nodes.map(({ selected: _selected, dragging: _dragging, ...node }) => node),
                    edges: edges.map(({ selected: _selected, ...edge }) => edge),
                    savedAt: time,
                })
            )
            setSavedAt(time)
            setDirty(false)
            return true
        } catch {
            setMessage('保存失败：浏览器存储不可用或空间不足。')
            return false
        }
    }
    const publish = () => {
        if (!save()) return
        try {
            const storedApps = localStorage.getItem('miaomiao.apps.v1')
            const apps: { id: string; name: string; status: string; [key: string]: unknown }[] = storedApps
                ? JSON.parse(storedApps)
                : workflowApplications
            const existing = apps.some(app => String(app.id) === appId)
            const next = existing
                ? apps.map(app => (String(app.id) === appId ? { ...app, status: '已发布', time: '刚刚' } : app))
                : [...apps, createWorkflowApplication(appId, name)]
            localStorage.setItem('miaomiao.apps.v1', JSON.stringify(next))
            setMessage('本地发布成功：应用状态已更新。未部署云端服务或开放 API。')
        } catch {
            setMessage('工作流已保存，但应用状态更新失败，请检查浏览器存储。')
        }
    }
    const run = async () => {
        const execution = await runMockWorkflow({ nodes, edges, input })
        setExecutions(old => [execution, ...old])
    }
    const latest = executions[0]
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
                onSave={() => {
                    if (save()) setMessage('工作流已保存到当前浏览器。')
                }}
                onTestRun={showTest}
                onPublish={publish}
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
                                        <Plus size={13} className="text-[#b8bac9] max-[800px]:hidden" />
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
                                    return Boolean(
                                        source &&
                                        target &&
                                        source.id !== target.id &&
                                        source.type !== 'output' &&
                                        target.type !== 'start' &&
                                        (source.type !== 'condition' || ['true', 'false'].includes(connection.sourceHandle ?? ''))
                                    )
                                }}
                                proOptions={{ hideAttribution: true }}
                            >
                                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d9d9e6" bgColor="#f7f8fc" />
                                <Controls position="bottom-right" />
                            </ReactFlow>
                        ) : (
                            <div className={emptyClass}>正在读取工作流…</div>
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
                            node={selected}
                            onUpdate={(label, config) => {
                                setNodes(old =>
                                    old.map(node => (node.id === selected.id ? { ...node, data: { ...node.data, label, config } } : node))
                                )
                                setDirty(true)
                            }}
                            onClose={() => setSelectedId(null)}
                            onDelete={() => onDeleteNode(selected.id)}
                        />
                    ) : null}
                    {testOpen && (
                        <aside className={panelClass}>
                            <div className="flex min-h-[61px] items-center justify-between border-b border-[#edeef5] px-[18px]">
                                <div className="flex items-center gap-[10px]">
                                    <span className="size-[7px] rounded-full bg-[#70ba98] shadow-[0_0_0_3px_#eaf8f0]" />
                                    <strong className="text-[12px]">运行测试</strong>
                                </div>
                                <button className={iconButtonClass} aria-label="关闭面板" onClick={() => onTabChange('edit')}>
                                    <X size={17} />
                                </button>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[19px]">
                                <p className="mt-0 mb-5 rounded-lg border border-[#eee8fb] bg-[#f5f2fd] p-[10px] text-[10px] leading-[1.8] text-[#8f81b0]">
                                    本地模拟 · 不调用真实 AI、知识库或 HTTP 服务；条件分支按配置选择执行路径。
                                </p>
                                <form
                                    onSubmit={event => {
                                        event.preventDefault()
                                        void run()
                                    }}
                                >
                                    {startInputs.map(item => (
                                        <label
                                            className="mb-[18px] flex flex-col gap-2 text-[10px] font-[550] text-[#63687d]"
                                            key={item.id}
                                        >
                                            <span>
                                                {item.name}
                                                {item.required ? ' *' : ''}
                                                <small className="font-normal text-[#a3a7b8]"> {item.type}</small>
                                            </span>
                                            <textarea
                                                className={fieldControlClass}
                                                rows={item.name === 'selling_points' ? 3 : 2}
                                                value={input[item.name] ?? ''}
                                                placeholder={item.type === 'boolean' ? 'true / false' : `输入 ${item.name}`}
                                                onChange={event => setInput(old => ({ ...old, [item.name]: event.target.value }))}
                                            />
                                        </label>
                                    ))}
                                    <PortalButton className="w-full border-[#292b40]! bg-[#292b40]! text-white!" type="submit">
                                        <Play size={14} />
                                        开始本地模拟
                                    </PortalButton>
                                </form>
                                {latest ? (
                                    <div className="mt-6 border-t border-[#edeef4] pt-[18px]">
                                        <h3 className="mt-0 mb-[14px] flex items-center gap-[7px] text-[11px] text-[#8b74c8]">
                                            <Sparkles size={15} />
                                            {latest.success ? '模拟完成' : '模拟未通过'}
                                        </h3>
                                        <pre className="rounded-lg bg-[#f7f7fc] p-3 font-[inherit] text-[10px] leading-[1.9] whitespace-pre-wrap text-[#7f8199] [overflow-wrap:anywhere]">
                                            {latest.output || '输出为空'}
                                        </pre>
                                        <small className="text-[9px] text-[#acafbf]">
                                            本地耗时 {latest.duration.toFixed(2)} ms · 未消耗 Tokens
                                        </small>
                                        {latest.steps.map(step => (
                                            <div className="mt-4 flex items-start gap-2 text-[#76b39b]" key={step.id}>
                                                <Check size={13} />
                                                <span className="flex flex-col gap-[5px]">
                                                    <strong className="text-[10px] font-medium text-[#898da0]">{step.label}</strong>
                                                    <small className="text-[9px] leading-[1.7] text-[#a2a5b6]">{step.detail}</small>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={emptyClass}>
                                        <Play size={25} className="text-[#afa3d9]" />
                                        <strong className="text-[12px] font-[550] text-[#797e94]">等待运行</strong>
                                        <p className="m-0 text-[11px] leading-[1.9]">填写输入，预览当前流程的本地模拟结果。</p>
                                    </div>
                                )}
                            </div>
                        </aside>
                    )}
                </div>
            </FlowEditorContext.Provider>
            {message && (
                <div
                    className="fixed top-[82px] right-[22px] z-40 flex max-w-[410px] items-center gap-[10px] rounded-[10px] border border-[#e4e1ef] bg-white p-[14px] text-[11px] leading-[1.7] shadow-[0_10px_35px_#39345d1a]"
                    role="status"
                >
                    <Check size={17} className="shrink-0 text-[#6eaf94]" />
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
