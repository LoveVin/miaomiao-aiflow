'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tabs from '@radix-ui/react-tabs'
import { ArrowLeft, CheckCircle2, ChevronDown, Globe, Save, Workflow } from 'lucide-react'
import Link from 'next/link'
import { memo } from 'react'

import { TestRunHistoryButton } from '@/components/flow/editor/execution-history'
import { colorClasses, PortalButton } from '@/components/shared'
import { RecordIcon } from '@/components/shared/icon-picker'
import type { EditorTab, FlowEditorHeaderProps } from '@/types/workflow'

export const FlowEditorHeader = memo(function FlowEditorHeader({
    appName,
    appIcon,
    appColor,
    hasUnsavedChanges,
    lastSavedAt,
    tab,
    onTabChange,
    onSave,
    onTestRun,
    onPublish,
    onUnpublish,
    executions,
    onSelectExecution,
    publishing,
    isPublished,
    publishedAt,
}: FlowEditorHeaderProps) {
    const formatPublishTime = (time: string) => {
        const startedAt = new Date(time)
        const minutes = Math.floor((Date.now() - startedAt.getTime()) / 60000)
        if (minutes < 1) return '刚刚'
        if (minutes < 60) return `${minutes} 分钟前`
        if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`
        if (minutes < 10080) return `${Math.floor(minutes / 1440)} 天前`
        return startedAt.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }

    return (
        <header className="z-5 flex h-[66px] min-h-[66px] items-center gap-[18px] border-b border-[#e8e9f2] bg-white px-[22px] max-[1100px]:gap-3 max-[1100px]:px-3 max-[800px]:h-[108px] max-[800px]:min-h-[108px] max-[800px]:flex-wrap max-[800px]:gap-x-[10px] max-[800px]:gap-y-[5px] max-[800px]:pt-[10px]">
            <div className="flex min-w-[180px] flex-1 items-center gap-3 max-[800px]:min-w-[140px]">
                <Link className="grid place-items-center p-[5px] text-[#85899d]" href="/" aria-label="返回工作室">
                    <ArrowLeft size={19} />
                </Link>
                <span
                    className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${appColor ? colorClasses[appColor] : 'bg-[#eeeaff] text-[#7561d5]'}`}
                >
                    <RecordIcon icon={appIcon} size={19} fallback={<Workflow size={19} />} />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                    <strong
                        className="max-w-[240px] truncate text-[13px] max-[1100px]:max-w-[170px] max-[800px]:max-w-[140px]"
                        title={appName}
                    >
                        {appName}
                    </strong>
                    <small className="text-[10px] text-[#969aab]">
                        {hasUnsavedChanges
                            ? '草稿 · 有未保存的更改'
                            : lastSavedAt
                              ? `已保存 · ${new Date(lastSavedAt).toLocaleTimeString('zh-CN')}`
                              : '草稿 · 本地演示工作流'}
                    </small>
                </div>
            </div>
            <Tabs.Root
                value={tab}
                onValueChange={value => onTabChange(value as EditorTab)}
                className="h-full max-[800px]:order-3 max-[800px]:flex max-[800px]:h-10 max-[800px]:w-full max-[800px]:justify-center"
            >
                <Tabs.List className="flex h-full gap-[26px] max-[1100px]:gap-4" aria-label="工作流视图">
                    {[
                        { id: 'edit', name: '编排' },
                        { id: 'logs', name: '日志' },
                        { id: 'monitor', name: '监测' },
                        { id: 'api', name: '访问 API' },
                    ].map(item => (
                        <Tabs.Trigger
                            className="relative border-0 bg-transparent px-[2px] py-0 text-[12px] whitespace-nowrap text-[#9294a5] outline-none! focus-visible:outline-none! data-[state=active]:font-[650] data-[state=active]:text-[#6051cf] data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-[3px] data-[state=active]:after:rounded-t data-[state=active]:after:bg-[#7664e9] data-[state=active]:after:content-['']"
                            key={item.id}
                            value={item.id}
                        >
                            {item.name}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>
            </Tabs.Root>
            <div className="flex flex-1 justify-end gap-2 max-[1100px]:[&_.button]:px-[9px]! max-[800px]:flex-none">
                {tab === 'edit' && (
                    <>
                        <PortalButton onClick={onSave}>
                            <Save size={14} />
                            保存
                        </PortalButton>
                        <TestRunHistoryButton executions={executions} onSelectExecution={onSelectExecution} onTestRun={onTestRun} />
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <PortalButton primary>
                                    {isPublished ? <CheckCircle2 size={14} /> : <Globe size={14} />}
                                    {isPublished ? '已发布' : '发布'}
                                    <ChevronDown size={14} />
                                </PortalButton>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    align="end"
                                    sideOffset={8}
                                    className="z-50 w-[320px] overflow-hidden rounded-[12px] border border-[#e8eaf2] bg-white p-0 text-[12px] shadow-[0_18px_55px_#312c4d1f]"
                                >
                                    {isPublished ? (
                                        <>
                                            <div className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={15} className="text-[#6eaf94]" />
                                                    <strong className="text-[13px] font-[650] text-[#30334a]">已发布</strong>
                                                    {publishedAt && (
                                                        <span className="text-[12px] text-[#9a9db0]">
                                                            · {formatPublishTime(publishedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-3 mb-0 text-[12px] leading-[1.8] text-[#9a9db0]">
                                                    当前线上版本可正常访问。修改流程后需要更新发布，外部调用才会使用新版本。
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2 border-t border-[#edeef5] p-3">
                                                <DropdownMenu.Item asChild>
                                                    <PortalButton primary className="w-full!" disabled={publishing} onClick={onPublish}>
                                                        {publishing ? '处理中...' : '更新发布'}
                                                    </PortalButton>
                                                </DropdownMenu.Item>
                                                <DropdownMenu.Item asChild>
                                                    <PortalButton
                                                        className="w-full! border-[#f0d3d3]! bg-white! text-[#c26262]! hover:bg-[#fdf4f4]!"
                                                        disabled={publishing}
                                                        onClick={onUnpublish}
                                                    >
                                                        取消发布
                                                    </PortalButton>
                                                </DropdownMenu.Item>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Globe size={15} className="text-[#8f8ba5]" />
                                                    <strong className="text-[13px] font-[650] text-[#30334a]">发布应用</strong>
                                                </div>
                                                <p className="mt-3 mb-0 text-[12px] leading-[1.8] text-[#9a9db0]">
                                                    发布后会保存当前流程快照，可通过公开 API
                                                    调用这个版本。后续修改流程需要再次发布才会生效。
                                                </p>
                                            </div>
                                            <div className="border-t border-[#edeef5] p-3">
                                                <DropdownMenu.Item asChild>
                                                    <PortalButton primary className="w-full!" disabled={publishing} onClick={onPublish}>
                                                        {publishing ? '发布中...' : '立即发布'}
                                                    </PortalButton>
                                                </DropdownMenu.Item>
                                            </div>
                                        </>
                                    )}
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    </>
                )}
            </div>
        </header>
    )
})
