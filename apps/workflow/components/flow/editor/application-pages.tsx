'use client'

import * as Menu from '@radix-ui/react-dropdown-menu'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, Clock3, KeyRound, MoreHorizontal, Plus, Search, Sparkles, Workflow } from 'lucide-react'
import { type ReactNode, useEffect, useId, useMemo, useState } from 'react'

import { PortalButton, PortalDialog } from '@/components/shared'
import { type ApiKeyInfo, apiKeyService } from '@/lib/services/api-key-service'
import { executionService } from '@/lib/services/execution-service'
import type { ApplicationDemoKey, ApplicationLogRecord } from '@/types/application'
import type { DemoExecution } from '@/types/workflow'

type ApplicationPagesProps = {
    tab: 'logs' | 'monitor' | 'api'
    executions: DemoExecution[]
    appId: string
    appName: string
}
const ranges = [
    { value: '1', label: '过去 24 小时' },
    { value: '7', label: '过去 7 天' },
    { value: '30', label: '过去 30 天' },
    { value: 'all', label: '全部时间' },
]
const pageClass =
    'h-[calc(100vh-62px)] min-w-0 flex-1 overflow-y-auto px-[34px] pt-[30px] pb-[45px] font-[inherit] text-[#262939] max-[760px]:px-[18px] max-[760px]:pt-[22px] max-[760px]:pb-[35px] [&_button]:cursor-pointer [&_button]:font-[inherit] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-[#7165e8] [&_button:focus-visible]:outline-offset-[3px]'
const titleClass =
    'mb-[25px] flex items-start justify-between gap-4 max-[760px]:flex-wrap [&_h1]:m-0 [&_h1]:mb-[5px] [&_h1]:text-[20px] [&_h1]:leading-[1.5] [&_h1]:font-bold [&_h1]:tracking-[-0.5px] [&_p]:m-0 [&_p]:text-[12px] [&_p]:text-[#85899a]'
const noticeClass = '-mt-[6px] mb-[14px] text-[12px] leading-[1.7] text-[#85899a]'
const popoverClass =
    'z-100 min-w-[140px] rounded-[9px] border border-[#e8e9f0] bg-white p-[5px] font-[inherit] text-[#55596b] shadow-[0_6px_28px_#28204918]'
const optionClass =
    'flex min-h-[30px] cursor-pointer items-center justify-between gap-[14px] rounded-[5px] px-[10px] py-[7px] text-[12px] outline-none select-none data-[highlighted]:bg-[#f1efff] data-[highlighted]:text-[#6558e8] focus-visible:outline-2 focus-visible:outline-[#7165e8] focus-visible:outline-offset-[3px]'
const runRowClass =
    'grid min-h-[53px] w-full grid-cols-[1.35fr_0.95fr_0.8fr_1fr_1fr_0.8fr] items-center gap-[5px] border-0 border-b border-solid border-[#f0f1f4] bg-white px-[9px] py-0 text-left text-[12px] text-[#575b6d]'
const statusClass = 'flex items-center gap-[6px] font-bold [&_i]:size-[6px] [&_i]:rounded-full'
const successClass = `${statusClass} text-[#43a574] [&_i]:bg-[#56c887]`
const emptyClass = 'px-4 py-[35px] text-center text-[12px] text-[#85899a]'
const dialogClass =
    'max-h-[85vh] overflow-y-auto [&_h3]:mt-[14px] [&_h3]:mb-2 [&_h3]:text-[12px] [&_h3]:font-bold [&_pre]:max-h-[220px] [&_pre]:overflow-y-auto [&_pre]:rounded-[7px] [&_pre]:bg-[#f6f5fa] [&_pre]:p-3 [&_pre]:text-[12px] [&_pre]:whitespace-pre-wrap [&_pre]:[overflow-wrap:anywhere]'
const chartCardClass = 'rounded-xl border border-[#e8e9f0] bg-white p-[18px] pb-8'
const chartHeadingClass =
    'flex items-center justify-between gap-2 [&_h2]:m-0 [&_h2]:text-[12px] [&_h2]:font-bold [&_span]:text-[12px] [&_span]:text-[#9a9dab]'
const datesClass = 'mt-[7px] flex justify-between px-[3px] text-[12px] text-[#9da0ae]'
const rankRowClass =
    'grid min-h-[42px] grid-cols-[1fr_150px_150px_130px] items-center border-t border-[#eff0f4] text-[12px] text-[#5c6071] max-[1000px]:grid-cols-[1fr_100px_100px_110px] max-[760px]:grid-cols-[1fr_70px_75px_95px] [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-[9px]'
const keyRowClass =
    'grid min-h-[54px] grid-cols-[0.8fr_1.2fr_0.8fr_0.7fr_1fr_1fr_50px] items-center gap-[5px] border-b border-[#eff0f4] text-[12px] text-[#616576]'
const sectionTitleClass = '[&_h2]:m-0 [&_h2]:mb-[5px] [&_h2]:text-[14px] [&_h2]:font-bold [&>span]:text-[12px] [&>span]:text-[#9296a6]'
const copyButtonClass = 'border-0 bg-transparent text-[12px] text-[#7165dc]'
const metricIcons = { workflow: Workflow, sparkles: Sparkles, key: KeyRound, check: Check, clock: Clock3 }

function FilterSelect({
    value,
    onChange,
    options,
    label,
    icon,
}: {
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    label: string
    icon: ReactNode
}) {
    return (
        <Select.Root value={value} onValueChange={onChange}>
            <Select.Trigger
                className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[18px] border border-[#dfe1e9] bg-white px-3 text-[12px] whitespace-nowrap text-[#55596b] [&>span]:flex [&>span]:items-center"
                aria-label={label}
            >
                {icon}
                <Select.Value />
                <Select.Icon>
                    <ChevronDown size={12} />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content className={popoverClass} position="popper" sideOffset={5} collisionPadding={10}>
                    <Select.Viewport>
                        {options.map(option => (
                            <Select.Item key={option.value} value={option.value} className={optionClass}>
                                <Select.ItemText>{option.label}</Select.ItemText>
                                <Select.ItemIndicator>
                                    <Check size={12} />
                                </Select.ItemIndicator>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    )
}

function LogsPage({ executions }: { executions: DemoExecution[] }) {
    const [status, setStatus] = useState('all')
    const [range, setRange] = useState('7')
    const [query, setQuery] = useState('')
    const [selected, setSelected] = useState<ApplicationLogRecord | null>(null)
    const [now] = useState(Date.now)
    const logs = useMemo(
        () =>
            executions.map(record => ({
                ...record,
                demo: false,
                tokens: 0,
                user: '当前用户',
                source: '网页应用',
            })),
        [executions]
    )

    const filtered = logs.filter(record => {
        const inRange = range === 'all' || Date.parse(record.time) >= now - Number(range) * 86400000
        return (
            inRange &&
            (status === 'all' || (status === 'success' ? record.success : !record.success)) &&
            `${record.id} ${record.displayTime ?? record.time} ${record.user} ${record.source} ${record.demo ? '设计稿演示' : '本地执行'} ${record.output} ${JSON.stringify(record.input)}`
                .toLowerCase()
                .includes(query.toLowerCase())
        )
    })
    return (
        <main className={`${pageClass} bg-white`}>
            <div className={titleClass}>
                <div>
                    <h1>日志</h1>
                    <p>查看应用每一次运行的执行情况与详细信息。</p>
                </div>
            </div>
            <div className="mb-[18px] flex flex-wrap items-center gap-2">
                <FilterSelect
                    label="执行状态"
                    icon={<Workflow size={14} />}
                    value={status}
                    onChange={setStatus}
                    options={[
                        { value: 'all', label: '全部状态' },
                        { value: 'success', label: '执行成功' },
                        { value: 'failed', label: '执行失败' },
                    ]}
                />
                <FilterSelect label="日志时间范围" icon={<Clock3 size={14} />} value={range} onChange={setRange} options={ranges} />
                <label className="flex h-[34px] w-[220px] items-center gap-2 rounded-[18px] border border-[#dfe1e9] px-3 text-[#989baa] focus-within:border-[#7165e8]">
                    <Search size={15} />
                    <input
                        className="w-0 min-w-0 flex-1 border-0 bg-transparent text-[12px] text-[#414557] outline-none"
                        aria-label="搜索运行记录"
                        placeholder="搜索运行记录"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                    />
                </label>
            </div>
            <p className={noticeClass}>
                设计稿演示记录与真实本地执行记录合并展示；本地执行不调用模型，Tokens 消耗为 0。演示时间为设计稿文案，筛选按相对日期计算。
            </p>
            <section className="overflow-x-auto" aria-label="运行日志">
                <div className="min-w-[700px] border-t border-[#f0f1f4]">
                    <div className={`${runRowClass} min-h-[39px]! cursor-default bg-[#fafafe]! text-[#8c90a0]!`}>
                        <span>执行开始时间</span>
                        <span>状态</span>
                        <span>运行时间</span>
                        <span>Tokens 消耗</span>
                        <span>用户 / 账户</span>
                        <span>触发来源</span>
                    </div>
                    {filtered.map(record => (
                        <button className={`${runRowClass} hover:bg-[#fafaff]`} key={record.id} onClick={() => setSelected(record)}>
                            <span className="flex items-center gap-2 text-[#414557]">
                                <i className="size-[5px] shrink-0 rounded-full bg-[#6d80ed]" />
                                <span>
                                    {record.displayTime ?? new Date(record.time).toLocaleString('zh-CN')}
                                    <small className="mt-[3px] block text-[12px] text-[#9995ae]">
                                        {record.demo ? '设计稿演示记录' : '真实本地执行'}
                                    </small>
                                </span>
                            </span>
                            <span className={record.success ? successClass : `${statusClass} text-[#d35c67] [&_i]:bg-[#d35c67]`}>
                                <i />
                                {record.success ? 'SUCCESS' : 'FAILED'}
                            </span>
                            <span>{(record.duration / 1000).toFixed(2)}s</span>
                            <span>
                                {record.tokens}
                                {record.demo ? '（演示）' : ''}
                            </span>
                            <span>{record.user}</span>
                            <span className="flex w-fit items-center gap-[5px] rounded-[5px] bg-[#f0f4ff] px-[7px] py-1 whitespace-nowrap text-[#496fdd]">
                                <KeyRound size={13} />
                                {record.source}
                            </span>
                        </button>
                    ))}
                    {!filtered.length && <div className={emptyClass}>没有符合筛选条件的运行记录</div>}
                </div>
            </section>
            <PortalDialog
                open={!!selected}
                onOpenChange={open => {
                    if (!open) setSelected(null)
                }}
                title="日志详情"
                description={
                    selected?.demo
                        ? '设计稿演示记录，所有输入、输出和指标均为示例。'
                        : '真实本地试运行记录，未调用远程模型，Tokens 消耗为 0。'
                }
                className={dialogClass}
            >
                {selected && (
                    <>
                        <dl className="grid grid-cols-[95px_minmax(0,1fr)] gap-2 text-[12px] [&_dt]:text-[#85899a] [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere]">
                            <dt>执行 ID</dt>
                            <dd>{selected.id}</dd>
                            <dt>状态 / 耗时</dt>
                            <dd>
                                {selected.success ? '成功' : '失败'} / {(selected.duration / 1000).toFixed(2)}s
                            </dd>
                            <dt>Tokens 消耗</dt>
                            <dd>
                                {selected.tokens}
                                {selected.demo ? '（演示）' : '（本地执行）'}
                            </dd>
                        </dl>
                        <h3>输入</h3>
                        <pre>{JSON.stringify(selected.input, null, 2)}</pre>
                        <h3>输出</h3>
                        <pre>{selected.output || '暂无输出'}</pre>
                        <h3>执行步骤</h3>
                        {selected.steps.map((step, index) => (
                            <div className="border-b border-[#eff0f4] py-[9px] text-[12px]" key={`${step.id}-${index}`}>
                                <strong>{step.label}</strong>
                                <p className="my-[5px] whitespace-pre-wrap text-[#85899a]">{step.detail}</p>
                            </div>
                        ))}
                    </>
                )}
            </PortalDialog>
        </main>
    )
}

function MonitorPage({ executions }: { executions: DemoExecution[] }) {
    const [range, setRange] = useState('7')
    const gradient = useId().replace(/:/g, '')
    const [now] = useState(Date.now)
    const local = executions.filter(record => range === 'all' || Date.parse(record.time) >= now - days * 86400000)
    const days = range === 'all' ? 30 : Number(range)
    const successCount = local.filter(record => record.success).length
    const duration = local.length ? Math.round(local.reduce((total, record) => total + record.duration, 0) / local.length) : 0
    const stats = [
        { label: '总调用次数', value: local.length.toLocaleString('zh-CN'), note: '', icon: 'workflow' as const },
        {
            label: '成功率',
            value: `${local.length ? Math.round((successCount / local.length) * 100) : 0}%`,
            note: '',
            icon: 'check' as const,
        },
        { label: 'Token 消耗', value: '0', note: '', icon: 'sparkles' as const },
        { label: '平均耗时', value: `${duration} ms`, note: '', icon: 'clock' as const },
        { label: '活跃 Key', value: '查看 API 页', note: '', icon: 'key' as const },
    ]
    const pointCount = 8
    const line = Array.from({ length: pointCount }, (_, index) => {
        const start = now - ((pointCount - index - 1) / pointCount) * days * 86400000
        return local.filter(record => Date.parse(record.time) >= start - (days * 86400000) / pointCount && Date.parse(record.time) <= start)
            .length
    })
    const dates = Array.from({ length: pointCount }, (_, index) => {
        const date = new Date(now - ((pointCount - index - 1) / pointCount) * days * 86400000)
        return days === 1 ? `${date.getHours()}:00` : `${date.getMonth() + 1}/${date.getDate()}`
    })
    const maxCount = Math.max(1, ...line)
    const axis = [maxCount, Math.round(maxCount * 0.75), Math.round(maxCount * 0.5), Math.round(maxCount * 0.25)]
    const chartPath = line
        .map((count, index) => `${index === 0 ? 'M' : 'L'}${(600 / (pointCount - 1)) * index} ${220 - (count / maxCount) * 200}`)
        .join(' ')
    const bars = line.map(count => ({ input: count, output: 0 }))
    const ranking = [{ name: '网页应用', calls: local.length, tokens: '0', lastUsed: '实时统计' }]
    return (
        <main className={`${pageClass} bg-[#f7f8fc]`}>
            <div className={titleClass}>
                <div>
                    <h1>监测</h1>
                    <p>查看应用的使用情况和性能指标。</p>
                </div>
                <FilterSelect label="监测时间范围" icon={<Clock3 size={14} />} value={range} onChange={setRange} options={ranges} />
            </div>
            <p className={noticeClass}>
                以下统计卡、图表和 API 排行由当前应用执行记录实时统计。当前范围执行 {local.length} 次，成功{' '}
                {local.filter(record => record.success).length} 次，Tokens 消耗 0。
            </p>
            <div className="mb-4 grid grid-cols-5 gap-3 max-[1000px]:gap-2 max-[760px]:grid-cols-2">
                {stats.map(stat => {
                    const Icon = metricIcons[stat.icon]
                    return (
                        <article
                            className="min-h-[108px] rounded-xl border border-[#e8e9f0] bg-white p-4 shadow-[0_3px_10px_rgba(42,45,79,0.03)] max-[1000px]:p-3"
                            key={stat.label}
                        >
                            <div className="flex items-center justify-between gap-[5px]">
                                <span className="text-[12px] text-[#797d8f]">{stat.label}</span>
                                <i className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#efedff] text-[#6256da] not-italic">
                                    <Icon size={16} />
                                </i>
                            </div>
                            <strong className="mt-[10px] mb-[3px] block text-[20px] leading-[1.3]">{stat.value}</strong>
                            <small className="text-[12px] text-[#50a67c]">{stat.note}</small>
                        </article>
                    )
                })}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 max-[760px]:grid-cols-[minmax(0,1fr)]">
                <section className={chartCardClass}>
                    <div className={chartHeadingClass}>
                        <h2>调用趋势</h2>
                        <span>{days === 1 ? '按小时统计' : '按天统计'}</span>
                    </div>
                    <div className="relative mt-[14px] h-[230px] border-b border-[#e8e9ef] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_54px,#eff0f4_55px)] pl-7">
                        {axis.map((label, index) => (
                            <span className="absolute left-0 text-[12px] text-[#a3a6b4]" style={{ top: 2 + index * 55 }} key={index}>
                                {label}
                            </span>
                        ))}
                        <svg
                            className="mt-2 h-[190px] w-[calc(100%-28px)] overflow-visible"
                            viewBox="0 0 600 220"
                            preserveAspectRatio="none"
                            role="img"
                            aria-label="调用趋势折线图"
                        >
                            <defs>
                                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0" stopColor="#6558e8" stopOpacity=".22" />
                                    <stop offset="1" stopColor="#6558e8" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path fill={`url(#${gradient})`} d={`${chartPath} L600 220 L0 220Z`} />
                            <path className="fill-none stroke-[#6558e8] stroke-[2.5] [vector-effect:non-scaling-stroke]" d={chartPath} />
                        </svg>
                        <div className={`${datesClass} absolute right-0 -bottom-[21px] left-7`}>
                            {dates.map((date, index) => (
                                <span key={index}>{date}</span>
                            ))}
                        </div>
                    </div>
                </section>
                <section className={chartCardClass}>
                    <div className={chartHeadingClass}>
                        <h2>Token 消耗</h2>
                        <span>
                            <b className="inline-block size-[5px] bg-[#7165e8]" /> 输入 /{' '}
                            <b className="inline-block size-[5px] bg-[#b9b2f5]" /> 输出 · 演示
                        </span>
                    </div>
                    <div
                        className="mt-[14px] flex h-[216px] items-end justify-around gap-4 border-b border-[#e8e9ef] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_53px,#eff0f4_54px)] px-3 pt-[18px]"
                        role="img"
                        aria-label="输入输出 Token 消耗演示柱状图"
                    >
                        {bars.map((bar, index) => (
                            <div className="flex h-full flex-1 items-end justify-center gap-[3px]" key={index}>
                                <span className="w-[9px] rounded-t-[3px] bg-[#7165e8]" style={{ height: `${bar.input}%` }} />
                                <span className="w-[9px] rounded-t-[3px] bg-[#b9b2f5]" style={{ height: `${bar.output}%` }} />
                            </div>
                        ))}
                    </div>
                    <div className={datesClass}>
                        {dates.map((date, index) => (
                            <span key={index}>{date}</span>
                        ))}
                    </div>
                </section>
            </div>
            <section className="mt-4 rounded-xl border border-[#e8e9f0] bg-white p-[18px]">
                <div className={chartHeadingClass}>
                    <h2>API Key 使用排行</h2>
                    <span>{ranges.find(item => item.value === range)?.label} · 设计稿演示</span>
                </div>
                <div className={`${rankRowClass} mt-[13px] min-h-[35px]! text-[#9497a6]!`}>
                    <span>名称</span>
                    <span>调用次数</span>
                    <span>Token 消耗</span>
                    <span>最后使用</span>
                </div>
                {ranking.map((row, index) => (
                    <div className={rankRowClass} key={row.name}>
                        <span>
                            <i className="grid size-5 place-items-center rounded-full bg-[#f0eff5] text-[12px] not-italic">{index + 1}</i>
                            {row.name}
                        </span>
                        <span>{row.calls}</span>
                        <span>{row.tokens}</span>
                        <span>{row.lastUsed}（演示）</span>
                    </div>
                ))}
            </section>
        </main>
    )
}

function ApiPage({ appId, appName }: Pick<ApplicationPagesProps, 'appId' | 'appName'>) {
    const [keys, setKeys] = useState<ApplicationDemoKey[]>([])
    const [creating, setCreating] = useState(false)
    const [name, setName] = useState('')
    const [message, setMessage] = useState('')
    const [createdKey, setCreatedKey] = useState('')

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const result = await apiKeyService.getList(appId)
                if (cancelled) return
                setKeys(
                    result.items.map(item => ({
                        id: item.id,
                        name: item.name,
                        active: item.isActive,
                        created: new Date(item.createdAt).toLocaleDateString('zh-CN'),
                        key: item.keyPrefix,
                        calls: item.usageCount,
                        lastUsed: item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleString('zh-CN') : '从未使用',
                    }))
                )
            } catch (error) {
                if (!cancelled) setMessage(error instanceof Error ? error.message : '获取 API Key 失败')
            }
        })()
        return () => {
            cancelled = true
        }
    }, [appId])
    async function copy(text: string, label: string) {
        try {
            await navigator.clipboard.writeText(text)
            setMessage(`${label}已复制`)
        } catch {
            setMessage('复制失败，请手动选中文本复制（浏览器可能未授予剪贴板权限）。')
        }
    }
    async function createKey() {
        if (!name.trim()) return
        try {
            const key = await apiKeyService.create(appId, { name })
            setKeys(old => [
                ...old,
                {
                    id: key.id,
                    name: key.name,
                    active: key.isActive,
                    created: new Date(key.createdAt).toLocaleDateString('zh-CN'),
                    key: key.key,
                    calls: 0,
                    lastUsed: '从未使用',
                },
            ])
            setCreatedKey(key.key)
            setName('')
            setCreating(false)
            setMessage('密钥已创建，请立即保存完整密钥。')
        } catch (error) {
            setMessage(error instanceof Error ? error.message : '创建密钥失败')
        }
    }
    return (
        <main className={`${pageClass} bg-white`}>
            <div className={titleClass}>
                <div>
                    <h1>访问 API</h1>
                    <p>管理应用 API 密钥，并查看接入方式。</p>
                </div>
                <PortalButton
                    primary
                    className="flex h-[34px]! min-h-[34px]! items-center gap-[6px]! rounded-lg! border-0! bg-[#6558e8]! px-[13px]! text-[12px]! text-white! shadow-none!"
                    onClick={() => setCreating(true)}
                >
                    <Plus size={15} />
                    创建 API Key
                </PortalButton>
            </div>
            <section className="border-b border-[#e8e9f0] pb-[26px]">
                <div className={sectionTitleClass}>
                    <h2>API Keys</h2>
                    <span>请妥善保管密钥，避免在客户端代码中暴露</span>
                </div>
                <p className="mt-2 mb-0 text-[12px] leading-[1.7] text-[#85899a]">
                    本页管理当前应用的真实 API 密钥。完整密钥只在创建时返回一次，请立即保存。
                </p>
                <div className="overflow-x-auto">
                    <div className="mt-[17px] min-w-[780px]">
                        <div className={`${keyRowClass} min-h-[35px]! text-[#9195a5]!`}>
                            <span>名称</span>
                            <span>Key</span>
                            <span>状态</span>
                            <span>使用次数</span>
                            <span>最后使用</span>
                            <span>创建时间</span>
                            <span>操作</span>
                        </div>
                        {keys.map(key => (
                            <div className={keyRowClass} key={key.id}>
                                <strong className="text-[12px] text-[#343849] [overflow-wrap:anywhere]">{key.name}</strong>
                                <code className="w-fit rounded-[5px] bg-[#f3f3f6] px-2 py-[5px] text-[#4d5162]" title="密钥前缀">
                                    ••••{key.key.slice(-4)}
                                </code>
                                <span className={key.active ? successClass : `${statusClass} text-[#9296a6] [&_i]:bg-[#9296a6]`}>
                                    <i />
                                    {key.active ? '启用' : '禁用'}
                                </span>
                                <span>
                                    {key.calls}
                                    {key.calls}
                                </span>
                                <span>{key.lastUsed}</span>
                                <span>{key.created}</span>
                                <Menu.Root>
                                    <Menu.Trigger
                                        className="grid size-7 place-items-center rounded-[5px] border-0 bg-transparent text-[#777b8d] hover:bg-[#f3f1ff]"
                                        aria-label={`管理密钥 ${key.name}`}
                                    >
                                        <MoreHorizontal size={16} />
                                    </Menu.Trigger>
                                    <Menu.Portal>
                                        <Menu.Content className={popoverClass} align="end" sideOffset={6}>
                                            <Menu.Item className={optionClass} onSelect={() => void copy(key.key, '密钥前缀')}>
                                                复制密钥前缀
                                            </Menu.Item>
                                            <Menu.Item
                                                className={optionClass}
                                                onSelect={() => {
                                                    void (async () => {
                                                        try {
                                                            const updated = await apiKeyService.update(appId, key.id, {
                                                                isActive: !key.active,
                                                            })
                                                            setKeys(old =>
                                                                old.map(item =>
                                                                    item.id === updated.id ? { ...item, active: updated.isActive } : item
                                                                )
                                                            )
                                                            setMessage(`已${key.active ? '禁用' : '启用'}密钥`)
                                                        } catch (toggleError) {
                                                            setMessage(toggleError instanceof Error ? toggleError.message : '更新密钥失败')
                                                        }
                                                    })()
                                                }}
                                            >
                                                {key.active ? '禁用' : '启用'}
                                            </Menu.Item>
                                            <Menu.Item
                                                className={`${optionClass} text-[#ce5364]`}
                                                onSelect={() => {
                                                    void (async () => {
                                                        try {
                                                            await apiKeyService.delete(appId, key.id)
                                                            setKeys(old => old.filter(item => item.id !== key.id))
                                                            setMessage('密钥已删除')
                                                        } catch (deleteError) {
                                                            setMessage(deleteError instanceof Error ? deleteError.message : '删除密钥失败')
                                                        }
                                                    })()
                                                }}
                                            >
                                                删除
                                            </Menu.Item>
                                        </Menu.Content>
                                    </Menu.Portal>
                                </Menu.Root>
                            </div>
                        ))}
                        {!keys.length && <div className={emptyClass}>暂无 API Key，点击“创建 API Key”添加。</div>}
                    </div>
                </div>
            </section>
            <div className="text-[12px] leading-[1.5] text-[#6256da] [&:not(:empty)]:mt-[10px]" role="status">
                {message}
            </div>
            <section className="pt-[27px] [&_h3]:mt-[25px] [&_h3]:mb-[10px] [&_h3]:text-[12px] [&_h3]:font-bold [&>p]:text-[12px] [&>p]:text-[#7d8192]">
                <div className={sectionTitleClass}>
                    <h2>接入文档</h2>
                    <span>通过标准 HTTP API 调用“{appName}”</span>
                </div>
                <p className="mt-2 mb-0 leading-[1.7]">
                    端点会调用当前应用已发布版本的工作流。请求需在 Authorization Header 中携带有效 API Key。
                </p>
                <h3>API 端点</h3>
                <div className="grid min-h-[68px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[9px] rounded-[10px] bg-[#f5f5f8] px-[13px] py-[10px]">
                    <span className="rounded-[6px] bg-[#6558e8] px-[9px] py-[5px] text-[12px] font-bold text-white">POST</span>
                    <code className="text-[12px] text-[#3e4253] [overflow-wrap:anywhere]">POST /api/v1/apps/{appId}/run</code>
                    <button
                        className={copyButtonClass}
                        onClick={() => void copy(`${window.location.origin}/api/v1/apps/${appId}/run`, 'API 端点')}
                    >
                        复制
                    </button>
                    <small className="col-span-full text-[12px] text-[#9296a6]">使用已发布工作流并返回生成结果</small>
                </div>
                <h3>认证方式</h3>
                <p>真实服务需要在 Header 中携带有效 API Key；以下仅展示认证格式：</p>
                <div className="flex min-h-12 items-center justify-between gap-[10px] rounded-[9px] bg-[#202029] px-[14px] py-[10px]">
                    <code className="text-[12px] text-[#e3e1f5] [overflow-wrap:anywhere]">Authorization: Bearer YOUR_API_KEY</code>
                    <button className={copyButtonClass} onClick={() => void copy('Authorization: Bearer YOUR_API_KEY', '认证格式')}>
                        复制
                    </button>
                </div>
                <h3>请求参数</h3>
                <div className="overflow-hidden rounded-[9px] border border-[#e8e9f0] [&>div]:grid [&>div]:min-h-[42px] [&>div]:grid-cols-[0.7fr_0.7fr_0.55fr_2.2fr] [&>div]:items-center [&>div]:gap-2 [&>div]:border-b [&>div]:border-[#e8e9f0] [&>div]:px-3 [&>div]:py-2 [&>div]:text-[12px] [&>div]:text-[#626677] [&>div:first-child]:min-h-[34px] [&>div:first-child]:bg-[#f7f7f9] [&>div:first-child]:text-[#4d5162] [&>div:last-child]:border-0 [&_code]:text-[#5d51cf] [&_code]:[overflow-wrap:anywhere]">
                    <div>
                        <strong>参数</strong>
                        <strong>类型</strong>
                        <strong>必填</strong>
                        <strong>说明</strong>
                    </div>
                    <div>
                        <code>inputs</code>
                        <span>object</span>
                        <span>是</span>
                        <span>工作流输入参数，对应开始节点定义的变量</span>
                    </div>
                    <div>
                        <code>response_mode</code>
                        <span>string</span>
                        <span>否</span>
                        <span>返回模式，可选 blocking 或 streaming</span>
                    </div>
                </div>
            </section>
            <PortalDialog
                open={creating}
                onOpenChange={setCreating}
                title="创建 API Key"
                description="创建后完整密钥只会显示一次。"
                className={dialogClass}
            >
                <form
                    onSubmit={event => {
                        event.preventDefault()
                        createKey()
                    }}
                >
                    <label className="flex flex-col gap-2 text-[12px]">
                        名称
                        <input
                            className="h-[38px] rounded-lg border border-[#dfe1e9] px-[10px] outline-[#7165e8]"
                            autoFocus
                            required
                            maxLength={50}
                            value={name}
                            onChange={event => setName(event.target.value)}
                            placeholder="例如：测试环境"
                        />
                    </label>
                    <div className="mt-5 flex justify-end gap-2">
                        <PortalButton type="button" onClick={() => setCreating(false)}>
                            取消
                        </PortalButton>
                        <PortalButton primary type="submit" disabled={!name.trim()}>
                            创建密钥
                        </PortalButton>
                    </div>
                </form>
            </PortalDialog>
            <PortalDialog
                open={!!createdKey}
                onOpenChange={open => {
                    if (!open) setCreatedKey('')
                }}
                title="密钥已创建"
                description="此字符串不会再次显示，请立即安全保存。"
                className={dialogClass}
            >
                <pre>{createdKey}</pre>
                <PortalButton onClick={() => void copy(createdKey, '完整密钥')}>复制完整密钥</PortalButton>
                <p role="status">{message}</p>
            </PortalDialog>
        </main>
    )
}

export function ApplicationPages(props: ApplicationPagesProps) {
    if (props.tab === 'logs') return <LogsPage key={`${props.appId}-logs`} executions={props.executions} />
    if (props.tab === 'monitor') return <MonitorPage key={`${props.appId}-monitor`} executions={props.executions} />
    return <ApiPage key={`${props.appId}-api`} appId={props.appId} appName={props.appName} />
}
