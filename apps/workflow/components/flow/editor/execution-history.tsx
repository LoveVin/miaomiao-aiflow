'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CircleAlert, CircleCheck, History, Play } from 'lucide-react'

import { TestRunTabs } from '@/components/flow/editor/test-run-tabs'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { DemoExecution } from '@/types/workflow'

function formatDuration(duration: number) {
    if (duration < 1000) return `${duration} ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(2)} s`
    return `${Math.floor(duration / 60000)}m ${((duration % 60000) / 1000).toFixed(1)}s`
}

function formatRelativeTime(time: string) {
    const startedAt = new Date(time)
    const minutes = Math.floor((Date.now() - startedAt.getTime()) / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (minutes < 1440) return `${Math.floor(minutes / 60)} 小时前`
    if (minutes < 10080) return `${Math.floor(minutes / 1440)} 天前`
    return startedAt.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function StatusIcon({ success }: { success: boolean }) {
    return success ? (
        <CircleCheck size={14} className="shrink-0 text-[#6eaf94]" />
    ) : (
        <CircleAlert size={14} className="shrink-0 text-[#d18282]" />
    )
}

export function TestRunHistoryButton({
    executions,
    onSelectExecution,
    onTestRun,
}: {
    executions: DemoExecution[]
    onSelectExecution: (id: string) => void
    onTestRun: () => void
}) {
    return (
        <DropdownMenu.Root>
            <div className="flex h-9 shrink-0 items-stretch overflow-hidden rounded-lg border border-[#e3e4ed] bg-white text-[#4a4750]">
                <button
                    className="flex cursor-pointer items-center gap-[7px] border-0 bg-transparent px-[14px] text-[12px] font-[650] whitespace-nowrap text-[#4a4750] transition-colors hover:bg-[#f7f6fe]"
                    type="button"
                    onClick={onTestRun}
                >
                    <Play size={14} />
                    运行测试
                </button>
                <span aria-hidden className="w-px bg-[#e5e6ef]" />
                <DropdownMenu.Trigger
                    aria-label="执行历史"
                    className="grid w-[38px] cursor-pointer place-items-center border-0 bg-transparent text-[#6d7184] transition-colors outline-none hover:bg-[#f7f6fe] hover:text-[#6658bd] data-[state=open]:bg-[#f7f6fe] data-[state=open]:text-[#6658bd]"
                >
                    <History size={16} />
                </DropdownMenu.Trigger>
            </div>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 w-[320px] overflow-hidden rounded-[12px] border border-[#e8eaf2] bg-white p-0 text-[12px] shadow-[0_18px_55px_#312c4d1f]"
                >
                    <div className="flex min-h-[46px] items-center justify-between border-b border-[#edeef5] px-4 py-3">
                        <strong className="text-[13px] font-[650] text-[#30334a]">执行历史</strong>
                        <span className="text-[12px] text-[#989bad]">{executions.length} 条记录</span>
                    </div>
                    {executions.length === 0 ? (
                        <p className="m-0 px-4 py-7 text-center text-[12px] leading-[1.8] text-[#a2a5b6]">
                            暂无执行记录，请先运行一次测试。
                        </p>
                    ) : (
                        <div className="max-h-[320px] overflow-y-auto p-2">
                            {executions.map(record => (
                                <DropdownMenu.Item
                                    key={record.id}
                                    onSelect={() => onSelectExecution(record.id)}
                                    className="flex cursor-pointer items-center gap-3 rounded-[8px] px-3 py-[10px] outline-none data-[highlighted]:bg-[#f7f6fe]"
                                >
                                    <StatusIcon success={record.success} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[12px] font-[600] text-[#4d5164]">
                                            {record.success ? '执行成功' : '执行失败'}
                                        </span>
                                        <span className="mt-1 block truncate text-[12px] text-[#9a9db0]">
                                            {formatRelativeTime(record.time)}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-[12px] text-[#9a9db0]">{formatDuration(record.duration)}</span>
                                </DropdownMenu.Item>
                            ))}
                        </div>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    )
}

export function ExecutionDetailDrawer({
    open,
    onOpenChange,
    execution,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    execution?: DemoExecution
}) {
    return (
        <Dialog open={Boolean(execution) && open} onOpenChange={onOpenChange}>
            <DialogContent className="document-drawer !left-auto !right-0 !top-0 flex !h-dvh !max-h-none !w-[440px] !max-w-full !translate-x-0 !translate-y-0 flex-col !overflow-hidden !rounded-none !p-0 transform-none animate-[portal-slide-in_0.24s_ease-out] text-[12px] [&>.modal-close]:top-[24px]">
                <div className="shrink-0 border-b border-[#edeef5] px-[22px] pb-[16px] pt-[24px]">
                    <DialogTitle className="m-0 flex items-center gap-2 text-[15px] font-[650] text-[#30334a]">
                        <History size={17} className="text-[#7664e9]" />
                        执行详情
                    </DialogTitle>
                    <DialogDescription className="mt-2 mb-0 flex items-center gap-2 text-[12px] text-[#9a9db0]">
                        {execution ? (
                            <>
                                <StatusIcon success={execution.success} />
                                {execution.success ? '执行成功' : '执行失败'} · {formatRelativeTime(execution.time)}
                            </>
                        ) : null}
                    </DialogDescription>
                </div>
                {execution ? <TestRunTabs key={execution.id} defaultTab="result" execution={execution} /> : null}
            </DialogContent>
        </Dialog>
    )
}
