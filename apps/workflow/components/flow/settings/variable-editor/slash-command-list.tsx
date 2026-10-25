'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'

import { getColor, ICON_MAP } from '@/components/flow/icon-map'
import type { NodeKind } from '@/types/workflow'

import type { AvailableNodeOutput, NodeOutputVariable } from '../node-outputs'

interface SlashCommandItem {
    type: 'node' | 'variable'
    nodeOutput?: AvailableNodeOutput
    variable?: NodeOutputVariable
}

interface SlashCommandListProps {
    items: SlashCommandItem[]
    command: (item: SlashCommandItem) => void
}

export interface SlashCommandListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface GroupedItems {
    nodeOutput: AvailableNodeOutput
    variables: { item: SlashCommandItem; flatIndex: number }[]
}

export const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const groupedItems = useMemo(() => {
        const groups: GroupedItems[] = []
        const nodeMap = new Map<string, GroupedItems>()
        let flatIndex = 0
        items.forEach(item => {
            if (item.type === 'variable' && item.nodeOutput && item.variable) {
                const nodeId = item.nodeOutput.nodeId
                if (!nodeMap.has(nodeId)) {
                    const group = { nodeOutput: item.nodeOutput, variables: [] }
                    nodeMap.set(nodeId, group)
                    groups.push(group)
                }
                nodeMap.get(nodeId)!.variables.push({ item, flatIndex })
                flatIndex += 1
            }
        })
        return groups
    }, [items])
    const totalItems = items.filter(item => item.type === 'variable').length
    const selectItem = (index: number) => {
        const item = items.filter(item => item.type === 'variable')[index]
        if (item) command(item)
    }

    useEffect(() => {
        setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + totalItems - 1) % totalItems)
                return true
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % totalItems)
                return true
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex)
                return true
            }
            return false
        },
    }))

    if (groupedItems.length === 0) {
        return <div className="rounded-lg border border-[#e8eaf2] bg-white p-3 text-[12px] text-[#9a9db0]">没有可用的变量</div>
    }

    return (
        <div className="min-w-[300px] rounded-lg border border-[#e8eaf2] bg-white shadow-lg">
            <div className="border-b border-[#edeef5] bg-[#fbfbfd] px-3 py-2">
                <span className="text-[11px] font-medium text-[#82879d]">选择变量</span>
            </div>
            <div className="max-h-[220px] overflow-auto">
                {groupedItems.map(group => {
                    const nodeType = group.nodeOutput.nodeType
                    const NodeIcon = ICON_MAP[nodeType]
                    return (
                        <div key={group.nodeOutput.nodeId}>
                            <div className="flex items-center gap-2 border-b border-[#edeef5] bg-[#f7f8fb] px-3 py-1.5">
                                <span
                                    className={`flex size-5 shrink-0 items-center justify-center rounded text-white ${getColor(nodeType)}`}
                                >
                                    {NodeIcon ? <NodeIcon size={12} /> : null}
                                </span>
                                <span className="text-[11px] font-medium text-[#4d5164]">{group.nodeOutput.nodeLabel}</span>
                                <span className="text-[11px] text-[#9a9db0]">({group.nodeOutput.nodeId})</span>
                            </div>
                            {group.variables.map(({ item, flatIndex }) => (
                                <button
                                    className={`flex w-full items-center gap-2 py-2 pl-10 pr-3 text-left transition-colors ${
                                        flatIndex === selectedIndex ? 'bg-[#f2efff]' : 'hover:bg-[#f7f6fe]'
                                    }`}
                                    key={`${group.nodeOutput.nodeId}-${item.variable!.name}`}
                                    type="button"
                                    onMouseDown={event => event.preventDefault()}
                                    onMouseEnter={() => setSelectedIndex(flatIndex)}
                                    onClick={() => selectItem(flatIndex)}
                                >
                                    <code className="rounded bg-[#f2efff] px-1.5 py-0.5 font-mono text-[11px] text-[#7664d5]">
                                        {item.variable!.name}
                                    </code>
                                    <span className="flex-1 truncate text-[11px] text-[#9a9db0]">{item.variable!.label}</span>
                                    <span className="text-[11px] text-[#c3c5d0]">{item.variable!.type}</span>
                                </button>
                            ))}
                        </div>
                    )
                })}
            </div>
        </div>
    )
})

SlashCommandList.displayName = 'SlashCommandList'
