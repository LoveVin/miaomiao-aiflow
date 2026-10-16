'use client'

import { memo } from 'react'

import { FlowEditorHeaderProps } from '@/types/workflow'

export const FlowEditorHeader = memo(function FlowEditorHeader({
    appName,
    appId = '',
    mode = 'edit',
    hasUnsavedChanges = false,
    isSaving = false,
    lastSavedAt,
    onSave,
    onTestRun,
    onExitTestRun,
    onSelectExecution,
}: FlowEditorHeaderProps) {
    return <div className="flex items-center justify-around px-4 py-2 bg-transparent absolute top-0 left-0 w-full z-10">head</div>
})
