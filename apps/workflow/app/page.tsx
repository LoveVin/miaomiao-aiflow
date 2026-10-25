'use client'

import * as Menu from '@radix-ui/react-dropdown-menu'
import * as Tabs from '@radix-ui/react-tabs'
import { ChevronRight, Clock, Grid2X2, List, MoreHorizontal, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import {
    colorClasses,
    emptyStateClass,
    fieldLabelClass,
    Hero,
    modalActionsClass,
    PortalButton,
    PortalDialog,
    portalMenuClass,
    PortalShell,
    portalTabsClass,
    SearchField,
    textAreaClass,
    textFieldClass,
} from '@/components/shared'
import { appIconOptions, IconPicker, RecordIcon } from '@/components/shared/icon-picker'
import { type AppListItem, appService } from '@/lib/services/app-service'

function formatTime(value: string) {
    const minutes = (Date.now() - new Date(value).getTime()) / 60000
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${Math.floor(minutes)} 分钟前`
    if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`
    if (minutes < 43200) return `${Math.floor(minutes / 1440)} 天前`
    return new Date(value).toLocaleDateString('zh-CN')
}

export default function StudioPage() {
    const router = useRouter()
    const [apps, setApps] = useState<AppListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [view, setView] = useState('grid')
    const [tab, setTab] = useState('all')
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(false)
    const [editing, setEditing] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [selectedIcon, setSelectedIcon] = useState(appIconOptions[0])
    const visible = apps.filter(app => (tab === 'all' || tab === 'mine') && `${app.name}${app.desc}`.includes(search))

    const loadApps = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const result = await appService.getList({ search })
            setApps(result.items)
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : '加载应用失败')
        } finally {
            setLoading(false)
        }
    }, [search])

    useEffect(() => {
        const timer = window.setTimeout(() => void loadApps(), 200)
        return () => window.clearTimeout(timer)
    }, [loadApps])
    function openCreate() {
        setEditing(null)
        setName('')
        setDescription('')
        setSelectedIcon(appIconOptions[0])
        setModal(true)
    }
    async function submit(event: React.FormEvent) {
        event.preventDefault()
        if (!name.trim()) return
        try {
            if (editing) {
                const updated = await appService.update(editing, {
                    name: name.trim(),
                    description,
                    icon: selectedIcon.icon,
                    iconColor: selectedIcon.color,
                })
                setApps(old => old.map(app => (app.id === editing ? { ...updated, time: formatTime(updated.updatedAt) } : app)))
                setModal(false)
                return
            }
            const created = await appService.create({
                name: name.trim(),
                description,
                icon: selectedIcon.icon,
                iconColor: selectedIcon.color,
            })
            router.push(`/app/${created.id}/workflow`)
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : '保存应用失败')
        }
    }
    return (
        <PortalShell>
            <Hero eyebrow="AI APPLICATION STUDIO" title="工作室" description="构建、调试和发布你的 AI 应用，让创意快速落地。">
                <PortalButton primary onClick={openCreate}>
                    <Plus size={17} />
                    新建应用
                </PortalButton>
            </Hero>
            <section>
                {(loading || error) && <p className="mb-4 text-[10px] text-[#85899a]">{loading ? '加载中…' : error}</p>}
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--line)] max-[760px]:flex-wrap">
                    <Tabs.Root value={tab} onValueChange={setTab}>
                        <Tabs.List className={portalTabsClass} aria-label="应用范围">
                            <Tabs.Trigger value="all">
                                全部应用 <span>{apps.length}</span>
                            </Tabs.Trigger>
                            <Tabs.Trigger value="mine">我创建的</Tabs.Trigger>
                            <Tabs.Trigger value="shared">与我协作</Tabs.Trigger>
                        </Tabs.List>
                    </Tabs.Root>
                    <div className="flex items-center gap-3 max-[760px]:w-full max-[760px]:justify-between">
                        <SearchField value={search} onChange={setSearch} />
                        <div className="mb-[7px] flex overflow-hidden rounded-[7px] border border-[var(--line)] [&_button]:grid [&_button]:h-[27px] [&_button]:w-[31px] [&_button]:place-items-center [&_button]:border-0">
                            <button
                                aria-label="网格视图"
                                className={view === 'grid' ? 'bg-[#f0eff2] text-[#4d4a52]' : 'bg-white text-[#aaa7af]'}
                                onClick={() => setView('grid')}
                            >
                                <Grid2X2 size={16} />
                            </button>
                            <button
                                aria-label="列表视图"
                                className={view === 'list' ? 'bg-[#f0eff2] text-[#4d4a52]' : 'bg-white text-[#aaa7af]'}
                                onClick={() => setView('list')}
                            >
                                <List size={17} />
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    className={`grid gap-[15px] max-[760px]:grid-cols-2 max-[480px]:grid-cols-1 ${view === 'list' ? 'grid-cols-2' : 'grid-cols-4 max-[1180px]:grid-cols-3'}`}
                >
                    {!search && tab !== 'shared' && (
                        <button
                            className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-white p-[18px] text-[#aaa7af] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--orange)] hover:bg-[#faf9ff]"
                            onClick={openCreate}
                        >
                            <span className="grid size-10 place-items-center rounded-xl bg-[var(--orange-soft)] text-[var(--orange)]">
                                <Plus size={22} />
                            </span>
                            <strong className="mb-1.5 mt-[11px] text-xs text-[#4a4750]">新建 AI 应用</strong>
                            <small className="text-[9px]">从空白流程或模板开始创建</small>
                        </button>
                    )}
                    {visible.map(app => (
                        <article
                            className="relative min-h-[190px] rounded-xl border border-[var(--line)] bg-white p-[18px] transition-all duration-200 hover:-translate-y-[3px] hover:border-[#dedce2] hover:shadow-[var(--shadow)]"
                            key={app.id}
                        >
                            <div className="flex items-start justify-between">
                                <span
                                    className={`grid size-[38px] shrink-0 place-items-center rounded-[10px] text-[13px] font-extrabold ${colorClasses[app.color]}`}
                                >
                                    <RecordIcon icon={app.icon} fallback={app.name.slice(0, 1)} />
                                </span>
                                <Menu.Root>
                                    <Menu.Trigger
                                        className="relative z-[2] border-0 bg-transparent p-0.5 text-[#aaa7af]"
                                        aria-label={`${app.name}更多操作`}
                                    >
                                        <MoreHorizontal size={18} />
                                    </Menu.Trigger>
                                    <Menu.Portal>
                                        <Menu.Content className={portalMenuClass} align="end">
                                            <Menu.Item
                                                onSelect={() => {
                                                    setEditing(app.id)
                                                    setName(app.name)
                                                    setDescription(app.desc)
                                                    setSelectedIcon(
                                                        appIconOptions.find(
                                                            option => option.icon === app.icon && option.color === app.color
                                                        ) ??
                                                            appIconOptions.find(option => option.icon === app.icon) ??
                                                            appIconOptions[0]
                                                    )
                                                    setModal(true)
                                                }}
                                            >
                                                编辑应用信息
                                            </Menu.Item>
                                            <Menu.Item
                                                onSelect={() => {
                                                    void (async () => {
                                                        try {
                                                            await appService.create({
                                                                name: `${app.name} 副本`,
                                                                description: app.desc,
                                                                icon: app.icon,
                                                                iconColor: app.color,
                                                            })
                                                            await loadApps()
                                                        } catch (copyError) {
                                                            setError(copyError instanceof Error ? copyError.message : '复制应用失败')
                                                        }
                                                    })()
                                                }}
                                            >
                                                复制应用
                                            </Menu.Item>
                                            <Menu.Item onSelect={() => setDeleting(app.id)}>删除应用</Menu.Item>
                                        </Menu.Content>
                                    </Menu.Portal>
                                </Menu.Root>
                            </div>
                            <Link
                                className="mb-[7px] mt-[15px] block text-xs font-bold text-inherit no-underline after:absolute after:inset-0 after:content-['']"
                                href={`/app/${app.id}/workflow`}
                            >
                                {app.name}
                            </Link>
                            <p className="m-0 min-h-[31px] text-[10px] leading-[1.55] text-[#918e96]">{app.desc || '暂无描述'}</p>
                            <div className="mt-[14px] flex justify-between border-t border-[#f0eff2] pt-[11px] text-[9px] text-[#aaa7af] [&>span]:flex [&>span]:items-center [&>span]:gap-1">
                                <span className={app.status === '已发布' ? 'text-[#579c80]' : ''}>
                                    <i
                                        className={`size-[5px] rounded-full ${app.status === '已发布' ? 'bg-[#49b788] shadow-[0_0_0_3px_#e8f7f1]' : 'bg-[#bbb7c0]'}`}
                                    />
                                    {app.status}
                                </span>
                                <span>
                                    <Clock size={13} />
                                    {formatTime(app.updatedAt)}
                                </span>
                            </div>
                        </article>
                    ))}
                    {visible.length === 0 && <p className={emptyStateClass}>暂无匹配的应用，试试其他关键词或创建新应用。</p>}
                </div>
            </section>
            <PortalDialog
                open={modal}
                onOpenChange={setModal}
                title={editing ? '编辑应用信息' : '创建你的 AI 应用'}
                description={editing ? '给新应用取个名字，稍后可以随时修改' : undefined}
            >
                <form onSubmit={submit}>
                    <IconPicker
                        label="应用图标"
                        options={appIconOptions}
                        value={selectedIcon}
                        onChange={setSelectedIcon}
                        className="mb-[15px]"
                    />
                    <label className={fieldLabelClass} htmlFor="app-name">
                        应用名称
                    </label>
                    <input
                        id="app-name"
                        className={textFieldClass}
                        autoFocus
                        required
                        maxLength={50}
                        placeholder="例如：我的智能助手"
                        value={name}
                        onChange={event => setName(event.target.value)}
                    />
                    <label className={`${fieldLabelClass} ${editing ? 'mt-[14px]' : 'mt-[15px]'}`} htmlFor="app-description">
                        应用描述
                    </label>
                    <textarea
                        id="app-description"
                        className={`${textAreaClass} ${editing ? '' : 'h-[72px]!'}`}
                        placeholder={editing ? undefined : '简单描述这个应用的用途和能力'}
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                    />
                    <div className={modalActionsClass}>
                        <PortalButton type="button" onClick={() => setModal(false)}>
                            取消
                        </PortalButton>
                        <PortalButton primary type="submit" disabled={!name.trim()}>
                            {editing ? '保存修改' : '开始创建'}
                            <ChevronRight size={15} />
                        </PortalButton>
                    </div>
                </form>
            </PortalDialog>
            <PortalDialog
                open={!!deleting}
                onOpenChange={() => setDeleting(null)}
                title="确认删除应用？"
                description="此操作将移除当前浏览器中的应用记录，无法恢复。"
            >
                <div className={modalActionsClass}>
                    <PortalButton onClick={() => setDeleting(null)}>取消</PortalButton>
                    <PortalButton
                        variant="destructive"
                        onClick={() => {
                            void (async () => {
                                try {
                                    if (deleting) await appService.delete(deleting)
                                    await loadApps()
                                    setDeleting(null)
                                } catch (deleteError) {
                                    setError(deleteError instanceof Error ? deleteError.message : '删除应用失败')
                                }
                            })()
                        }}
                    >
                        确认删除
                    </PortalButton>
                </div>
            </PortalDialog>
        </PortalShell>
    )
}
