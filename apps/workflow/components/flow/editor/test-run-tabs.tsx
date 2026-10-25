'use client'

import * as Tabs from '@radix-ui/react-tabs'
import { ChevronDown, CircleAlert, CircleCheck, Clock, Copy, Hash, Play, Zap } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { getNodeColor, ICON_MAP } from '@/components/flow/icon-map'
import { PortalButton } from '@/components/shared'
import type { DemoExecution, FlowInput, NodeKind, NodeTraceStatus } from '@/types/workflow'

const fieldControlClass =
    'w-full min-h-[65px] resize-y rounded-[7px] border border-[#e0e3ee] bg-white px-[10px] py-[9px] text-[12px] leading-[1.7] text-[#60657b] outline-none focus:border-[#a293eb] focus:shadow-[0_0_0_3px_#f2efff]'
const sectionTitleClass = 'm-0 mb-2 text-[13px] font-[650] text-[#4d5164]'
const codeBlockClass =
    'm-0 overflow-x-auto rounded-[10px] bg-[#f7f7fc] p-3 font-[inherit] text-[12px] leading-[1.9] whitespace-pre-wrap text-[#7f8199] [overflow-wrap:anywhere]'

function formatDuration(duration: number) {
    if (duration < 1000) return `${duration.toFixed(2)} ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(2)} s`
    return `${Math.floor(duration / 60000)}m ${((duration % 60000) / 1000).toFixed(1)}s`
}

function formatDateTime(time: string) {
    return new Date(time).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

function CollapsibleCard({
    open,
    onOpenChange,
    title,
    meta,
    children,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: ReactNode
    meta?: ReactNode
    children: ReactNode
}) {
    return (
        <div className="overflow-hidden rounded-[10px] border border-[#edeef5]">
            <button
                className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-white px-3 py-3 text-left transition-colors hover:bg-[#f9f8ff]"
                type="button"
                onClick={() => onOpenChange(!open)}
            >
                <span className="min-w-0 flex-1 text-[12px] font-[650] text-[#4d5164]">{title}</span>
                <span className="flex shrink-0 items-center gap-2 text-[11px] text-[#9a9db0]">
                    {meta}
                    <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>
            {open ? <div className="border-t border-solid border-[#edeef5] bg-[#fbfbfd] p-3">{children}</div> : null}
        </div>
    )
}

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false)

    return (
        <button
            aria-label="复制内容"
            className="absolute right-2 top-2 grid size-7 cursor-pointer place-items-center rounded-[5px] border-0 bg-white text-[#a5a7b7] opacity-0 shadow-[0_2px_8px_#3d3a5b12] transition-opacity hover:text-[#6658bd] group-hover:opacity-100"
            type="button"
            onClick={() => {
                void navigator.clipboard.writeText(value)
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1500)
            }}
        >
            {copied ? <CircleCheck size={14} className="text-[#6eaf94]" /> : <Copy size={14} />}
        </button>
    )
}

function JsonCollapsibleCard({ title, value, emptyText }: { title: string; value: Record<string, string>; emptyText: string }) {
    const [open, setOpen] = useState(false)
    const formatted = Object.keys(value).length ? JSON.stringify(value, null, 2) : ''

    return (
        <CollapsibleCard open={open} onOpenChange={setOpen} title={title}>
            {formatted ? (
                <div className="group relative">
                    <pre className={`${codeBlockClass} max-h-[280px] overflow-auto bg-white`}>{formatted}</pre>
                    <CopyButton value={formatted} />
                </div>
            ) : (
                <p className="m-0 text-[12px] text-[#9a9db0]">{emptyText}</p>
            )}
        </CollapsibleCard>
    )
}

function OutputCollapsibleCard({ output }: { output: string }) {
    const [open, setOpen] = useState(false)

    return (
        <CollapsibleCard open={open} onOpenChange={setOpen} title="输出结果">
            {output ? (
                <div className="group relative">
                    <pre className={`${codeBlockClass} max-h-[280px] overflow-auto bg-white`}>{output}</pre>
                    <CopyButton value={output} />
                </div>
            ) : (
                <p className="m-0 text-[12px] text-[#9a9db0]">输出为空</p>
            )}
        </CollapsibleCard>
    )
}

function TraceItem({ step, index, success }: { step: DemoExecution['steps'][number]; index: number; success: boolean }) {
    const [open, setOpen] = useState(false)
    const status: NodeTraceStatus = step.status ?? (success ? 'success' : 'error')
    const hasDetails =
        Boolean(step.error) ||
        (step.inputs && Object.keys(step.inputs).length > 0) ||
        (step.outputs && Object.keys(step.outputs).length > 0)
    const nodeType: NodeKind = step.nodeType ?? 'start'
    const NodeTypeIcon = ICON_MAP[nodeType]

    return (
        <li className="m-0 list-none p-0">
            <div className="overflow-hidden rounded-[6px] bg-white shadow-[0_4px_16px_#34365b0f]">
                <button
                    className="flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-white px-2 py-2 text-left transition-colors hover:bg-[#f9f8ff] disabled:cursor-default disabled:hover:bg-white"
                    disabled={!hasDetails}
                    type="button"
                    onClick={() => setOpen(!open)}
                >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className={`grid size-5 shrink-0 place-items-center rounded-[5px] text-white ${getNodeColor(nodeType)}`}>
                            <NodeTypeIcon size={12} />
                        </span>
                        <span className="truncate text-[13px] font-[550] text-[#4d5164]">{step.label}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-[11px] text-[#9a9db0]">
                        {step.duration !== undefined ? <span>{formatDuration(step.duration)}</span> : null}
                        {status === 'success' ? <CircleCheck size={12} className="text-[#6eaf94]" /> : null}
                        {status === 'error' ? <CircleAlert size={12} className="text-[#d18282]" /> : null}
                        {status === 'running' ? <Clock size={12} className="text-[#5b7ed8]" /> : null}
                        {status === 'pending' ? <Clock size={12} className="text-[#a2a6b9]" /> : null}
                        {hasDetails ? <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} /> : null}
                    </span>
                </button>
                {open && hasDetails ? (
                    <div className="flex flex-col gap-2 bg-[#fbfbfd] p-2">
                        {step.error ? (
                            <div>
                                <small className="text-[11px] font-[550] text-[#9a9db0]">错误</small>
                                <pre className={`${codeBlockClass} max-h-[150px] overflow-auto bg-[#fdf2f2] text-[#c94f5b]`}>
                                    {step.error}
                                </pre>
                            </div>
                        ) : null}
                        {step.inputs && Object.keys(step.inputs).length > 0 ? (
                            <div>
                                <small className="text-[11px] font-[550] text-[#9a9db0]">输入</small>
                                <pre className={`${codeBlockClass} max-h-[150px] overflow-auto bg-white`}>
                                    {JSON.stringify(step.inputs, null, 2)}
                                </pre>
                            </div>
                        ) : null}
                        {step.outputs && Object.keys(step.outputs).length > 0 ? (
                            <div>
                                <small className="text-[11px] font-[550] text-[#9a9db0]">输出</small>
                                <pre className={`${codeBlockClass} max-h-[150px] overflow-auto bg-white`}>
                                    {JSON.stringify(step.outputs, null, 2)}
                                </pre>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </li>
    )
}

export function TestRunTabs({
    execution,
    inputParams = [],
    values = {},
    onValuesChange,
    onRun,
    onReset,
    running = false,
    defaultTab = 'input',
}: {
    execution?: DemoExecution
    inputParams?: FlowInput[]
    values?: Record<string, string>
    onValuesChange?: (values: Record<string, string>) => void
    onRun?: () => Promise<boolean>
    onReset?: () => void
    running?: boolean
    defaultTab?: 'input' | 'result' | 'details' | 'trace'
}) {
    const [tab, setTab] = useState(defaultTab)

    const runTest = async () => {
        if (!onRun) return
        const success = await onRun()
        if (success) setTab('result')
    }

    const tabs = [
        onRun ? { id: 'input', label: '输入', disabled: false } : null,
        { id: 'result', label: '结果', disabled: !execution },
        { id: 'details', label: '详情', disabled: !execution },
        { id: 'trace', label: '追踪', disabled: !execution },
    ].filter(item => Boolean(item))

    return (
        <Tabs.Root value={tab} onValueChange={value => setTab(value as typeof defaultTab)} className="flex min-h-0 flex-1 flex-col">
            <Tabs.List
                className={`mx-[22px] mt-3 grid shrink-0 gap-1 rounded-[10px] bg-[#f5f6fa] p-1 ${onRun ? 'grid-cols-4' : 'grid-cols-3'}`}
            >
                {tabs.map(item => (
                    <Tabs.Trigger
                        key={item!.id}
                        value={item!.id}
                        disabled={item!.disabled}
                        className="h-8 rounded-[7px] border-0 bg-transparent px-2 text-[12px] font-[550] text-[#85889a] outline-none transition-colors data-[state=active]:bg-white data-[state=active]:text-[#5c5470] data-[state=active]:shadow-[0_2px_8px_#3d3a5b12] disabled:cursor-not-allowed disabled:text-[#c3c5d0]"
                    >
                        {item!.label}
                    </Tabs.Trigger>
                ))}
            </Tabs.List>
            <div className="min-h-0 flex-1 overflow-y-auto">
                {onRun ? (
                    <Tabs.Content value="input" className="m-0 px-[22px] py-[20px] outline-none">
                        <form
                            className="flex flex-col"
                            onSubmit={event => {
                                event.preventDefault()
                                void runTest()
                            }}
                        >
                            {inputParams.map(item => (
                                <label className="mb-[18px] flex flex-col gap-2 text-[12px] font-[550] text-[#63687d]" key={item.id}>
                                    <span>
                                        {item.name}
                                        {item.required ? ' *' : ''}
                                        <small className="text-[12px] font-normal text-[#a3a7b8]"> {item.type}</small>
                                    </span>
                                    <textarea
                                        className={fieldControlClass}
                                        rows={2}
                                        required={item.required}
                                        value={values[item.name] ?? ''}
                                        placeholder={
                                            item.type === 'boolean'
                                                ? 'true / false'
                                                : item.type === 'number'
                                                  ? '请输入数字'
                                                  : `请输入 ${item.name}`
                                        }
                                        onChange={event => onValuesChange?.({ ...values, [item.name]: event.target.value })}
                                    />
                                </label>
                            ))}
                            {inputParams.length === 0 && (
                                <p className="m-0 mb-4 rounded-[10px] bg-[#f7f7fc] p-3 text-[12px] leading-[1.8] text-[#9a9db0]">
                                    开始节点还没有输入参数。
                                </p>
                            )}
                            <div className="flex gap-2">
                                <PortalButton
                                    className="w-full border-[#292b40]! bg-[#292b40]! text-white!"
                                    type="submit"
                                    disabled={running}
                                >
                                    <Play size={14} />
                                    {running ? '运行中' : '开始测试'}
                                </PortalButton>
                                <PortalButton type="button" disabled={running} onClick={onReset}>
                                    重置
                                </PortalButton>
                            </div>
                        </form>
                    </Tabs.Content>
                ) : null}
                <Tabs.Content value="result" className="m-0 px-[22px] py-[20px] outline-none">
                    {execution ? (
                        <>
                            <div className="mb-4 flex items-center gap-2">
                                {execution.success ? (
                                    <CircleCheck size={16} className="text-[#6eaf94]" />
                                ) : (
                                    <CircleAlert size={16} className="text-[#d18282]" />
                                )}
                                <strong className="text-[13px] font-[650] text-[#4d5164]">
                                    {execution.success ? '执行成功' : '执行失败'}
                                </strong>
                            </div>
                            <OutputCollapsibleCard output={execution.output} />
                        </>
                    ) : null}
                </Tabs.Content>
                <Tabs.Content value="details" className="m-0 px-[22px] py-[20px] outline-none">
                    {execution ? (
                        <>
                            <section className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: CircleCheck, label: '状态', value: execution.success ? '成功' : '失败' },
                                    { icon: Clock, label: '耗时', value: formatDuration(execution.duration) },
                                    { icon: Zap, label: 'Token 消耗', value: '0' },
                                    { icon: Hash, label: '记录时间', value: formatDateTime(execution.time) },
                                ].map(item => {
                                    const Icon = item.icon
                                    return (
                                        <div className="rounded-[10px] border border-[#edeef5] p-3" key={item.label}>
                                            <div className="flex items-center gap-2 text-[#989bad]">
                                                <Icon size={14} />
                                                <span className="text-[12px]">{item.label}</span>
                                            </div>
                                            <p className="mt-2 mb-0 break-all text-[12px] font-[600] text-[#4d5164]">{item.value}</p>
                                        </div>
                                    )
                                })}
                            </section>
                            <section className="mt-5">
                                <h3 className={sectionTitleClass}>记录 ID</h3>
                                <p className="m-0 break-all rounded-[10px] bg-[#f7f7fc] p-3 text-[12px] text-[#7f8199]">{execution.id}</p>
                            </section>
                            <div className="mt-5 flex flex-col gap-3">
                                <JsonCollapsibleCard title="输入参数" value={execution.input} emptyText="无输入数据" />
                                <OutputCollapsibleCard output={execution.output} />
                            </div>
                        </>
                    ) : null}
                </Tabs.Content>
                <Tabs.Content value="trace" className="m-0 px-[22px] py-[20px] outline-none">
                    {execution ? (
                        execution.steps.length ? (
                            <>
                                <div className="mb-3 flex items-center gap-4 px-1 text-[12px] text-[#9a9db0]">
                                    <span>
                                        共 <strong className="text-[#4d5164]">{execution.steps.length}</strong> 个节点
                                    </span>
                                    {execution.success && (
                                        <span className="flex items-center gap-1 text-[#6eaf94]">
                                            <CircleCheck size={12} />
                                            {execution.steps.length}
                                        </span>
                                    )}
                                </div>
                                <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
                                    {execution.steps.map((step, index) => (
                                        <TraceItem key={`${step.id}-${index}`} index={index} step={step} success={execution.success} />
                                    ))}
                                </ol>
                            </>
                        ) : (
                            <p className="m-0 rounded-[10px] bg-[#f7f7fc] p-3 text-[12px] text-[#9a9db0]">当前记录没有节点追踪数据。</p>
                        )
                    ) : null}
                </Tabs.Content>
            </div>
        </Tabs.Root>
    )
}
