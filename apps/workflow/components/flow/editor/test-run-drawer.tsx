'use client'

import { Play } from 'lucide-react'

import { TestRunTabs } from '@/components/flow/editor/test-run-tabs'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { DemoExecution, FlowInput } from '@/types/workflow'

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

export function TestRunDrawer({
    open,
    onOpenChange,
    inputParams,
    values,
    onValuesChange,
    onRun,
    onReset,
    running,
    execution,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    inputParams: FlowInput[]
    values: Record<string, string>
    onValuesChange: (values: Record<string, string>) => void
    onRun: () => Promise<boolean>
    onReset: () => void
    running: boolean
    execution?: DemoExecution
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="document-drawer !left-auto !right-0 !top-0 flex !h-dvh !max-h-none !w-[440px] !max-w-full !translate-x-0 !translate-y-0 flex-col !overflow-hidden !rounded-none !p-0 transform-none animate-[portal-slide-in_0.24s_ease-out] text-[12px] [&>.modal-close]:top-[24px]">
                <div className="shrink-0 border-b border-[#edeef5] px-[22px] pb-[16px] pt-[24px]">
                    <DialogTitle className="m-0 flex items-center gap-2 text-[15px] font-[650] text-[#30334a]">
                        <span className="grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-[#5fae8c] to-[#3f8a68] text-white">
                            <Play size={15} />
                        </span>
                        测试运行
                    </DialogTitle>
                    <DialogDescription className="mt-2 mb-0 flex items-center gap-2 text-[12px] text-[#9a9db0]">
                        {running ? '正在执行当前工作流...' : execution ? formatDateTime(execution.time) : '填写输入参数后开始测试'}
                    </DialogDescription>
                </div>
                <TestRunTabs
                    defaultTab="input"
                    execution={execution}
                    inputParams={inputParams}
                    values={values}
                    onValuesChange={onValuesChange}
                    onRun={onRun}
                    onReset={onReset}
                    running={running}
                />
            </DialogContent>
        </Dialog>
    )
}
