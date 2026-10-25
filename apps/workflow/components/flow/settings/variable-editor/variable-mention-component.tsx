'use client'

import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'

import { getColor, ICON_MAP } from '@/components/flow/icon-map'
import type { NodeKind } from '@/types/workflow'

export function VariableMentionComponent({ node, selected }: NodeViewProps) {
    const { nodeId, nodeLabel, variableName } = node.attrs as { nodeId: string; nodeLabel: string; variableName: string }
    const nodeType = nodeId.split('-')[0] as NodeKind
    const NodeIcon = ICON_MAP[nodeType]

    return (
        <NodeViewWrapper as="span" className="inline-block align-middle">
            <span
                className={`inline-flex cursor-default select-none items-center gap-1 rounded bg-[#eff6ff] px-1.5 py-0.5 text-xs font-medium text-[#1d4ed8] transition-all ${
                    selected ? 'ring-2 ring-[#7664d5] ring-offset-1' : ''
                }`}
                contentEditable={false}
            >
                <span className={`flex size-4 items-center justify-center rounded text-white ${getColor(nodeType)}`}>
                    {NodeIcon ? <NodeIcon size={10} /> : null}
                </span>
                <span className="font-medium">{nodeLabel}</span>
                <span className="text-gray-400">/</span>
                <span className="font-mono">{variableName}</span>
            </span>
        </NodeViewWrapper>
    )
}
