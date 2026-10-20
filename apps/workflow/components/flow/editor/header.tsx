'use client'

import * as Tabs from '@radix-ui/react-tabs'
import { ArrowLeft, Play, Save, Upload, Workflow } from 'lucide-react'
import Link from 'next/link'
import { memo } from 'react'

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
}: FlowEditorHeaderProps) {
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
                            className="relative border-0 bg-transparent px-[2px] py-0 text-[12px] whitespace-nowrap text-[#9294a5] data-[state=active]:font-[650] data-[state=active]:text-[#6051cf] data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-[3px] data-[state=active]:after:rounded-t data-[state=active]:after:bg-[#7664e9] data-[state=active]:after:content-['']"
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
                        <PortalButton className="border-[#292b40]! bg-[#292b40]! text-white!" onClick={onTestRun}>
                            <Play size={14} />
                            运行测试
                        </PortalButton>
                        <PortalButton primary onClick={onPublish}>
                            <Upload size={14} />
                            发布
                        </PortalButton>
                    </>
                )}
            </div>
        </header>
    )
})
