'use client'

import { X } from 'lucide-react'

import { getColor, ICON_MAP } from '@/components/flow/icon-map'
import type { NodeKind } from '@/types/workflow'

export interface VariableData {
    nodeId: string
    nodeLabel: string
    variableName: string
    variableLabel?: string
    variableType?: string
}

interface VariableTagProps {
    variable: VariableData
    removable?: boolean
    onRemove?: () => void
    className?: string
}

export function VariableTag({ variable, removable, onRemove, className = '' }: VariableTagProps) {
    const nodeType = variable.nodeId.split('-')[0] as NodeKind
    const NodeIcon = ICON_MAP[nodeType]

    return (
        <span
            className={`inline-flex items-center gap-1 rounded bg-[#eff6ff] px-1.5 py-0.5 text-xs font-medium text-[#1d4ed8] ${className}`}
        >
            <span className={`flex size-4 items-center justify-center rounded text-white ${getColor(nodeType)}`}>
                {NodeIcon ? <NodeIcon size={10} /> : null}
            </span>
            <span className="font-medium">{variable.nodeLabel}</span>
            <span className="text-gray-400">/</span>
            <span className="font-mono" title={variable.variableLabel || variable.variableName}>
                {variable.variableName}
            </span>
            {removable && onRemove ? (
                <button
                    className="ml-0.5 cursor-pointer border-0 bg-transparent transition-colors hover:text-red-500"
                    type="button"
                    onClick={event => {
                        event.stopPropagation()
                        onRemove()
                    }}
                >
                    <X size={12} />
                </button>
            ) : null}
        </span>
    )
}

export function VariableRenderer({
    value,
    availableOutputs,
    className = '',
}: {
    value: string
    availableOutputs: {
        nodeId: string
        nodeLabel: string
        outputs: { name: string; label?: string; type?: string }[]
    }[]
    className?: string
}) {
    const variableRegex = /\$\{([^.]+)\.([^}]+)\}/g
    const parts: Array<{ type: 'text' | 'variable'; content: string; data?: VariableData }> = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = variableRegex.exec(value)) !== null) {
        if (match.index > lastIndex) parts.push({ type: 'text', content: value.slice(lastIndex, match.index) })
        const nodeId = match[1]!
        const variableName = match[2]!
        const nodeOutput = availableOutputs.find(item => item.nodeId === nodeId)
        const variable = nodeOutput?.outputs.find(item => item.name === variableName)
        parts.push({
            type: 'variable',
            content: `${nodeOutput?.nodeLabel || nodeId}/${variable?.label || variableName}`,
            data: {
                nodeId,
                nodeLabel: nodeOutput?.nodeLabel || nodeId,
                variableName,
                variableLabel: variable?.label,
                variableType: variable?.type,
            },
        })
        lastIndex = match.index + match[0].length
    }
    if (lastIndex < value.length) parts.push({ type: 'text', content: value.slice(lastIndex) })

    if (parts.length === 0) {
        return <span className={className}>{value || <span className="text-[#9a9db0]">未设置</span>}</span>
    }

    return (
        <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
            {parts.map((part, index) =>
                part.type === 'text' ? (
                    <span key={`text-${index}`}>{part.content}</span>
                ) : part.data ? (
                    <VariableTag key={`var-${index}`} variable={part.data} />
                ) : null
            )}
        </span>
    )
}
