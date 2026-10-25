'use client'

import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import { memo } from 'react'

import { ICON_MAP } from '@/components/flow/icon-map'
import type { FlowNode } from '@/types/workflow'

export const KnowledgeNode = memo(function KnowledgeNode({ data, selected }: NodeProps<FlowNode>) {
    const config = data.config
    const retrievalModeLabel = {
        vector: '向量检索',
        fulltext: '全文检索',
        hybrid: '混合检索',
    }

    return (
        <div
            className={clsx('w-64 rounded-xl border bg-white p-3 shadow-md', {
                'border-[#3d94a8]': selected,
                'border-transparent': !selected,
            })}
        >
            <div className="mb-3 flex items-center">
                <span className="mr-3 grid place-items-center rounded-lg bg-[#3d94a8] p-2 text-white shadow-sm">
                    <ICON_MAP.knowledge size={14} />
                </span>
                <span className="text-[13px] font-bold">{data.label}</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-12 text-xs text-gray-600">模式</span>
                    <span className="flex-1 rounded-md bg-[#f2f4f7] px-2 py-1 text-sm">
                        {retrievalModeLabel[config.retrievalMode || 'vector']}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-12 text-xs text-gray-600">Top K</span>
                    <span className="flex-1 rounded-md bg-[#f2f4f7] px-2 py-1 text-sm">{config.topK || 5}</span>
                </div>
                {config.knowledgeBaseIds?.length ? (
                    <div className="flex items-center gap-2">
                        <span className="w-12 text-xs text-gray-600">知识库</span>
                        <span className="flex-1 rounded-md bg-[#f2f4f7] px-2 py-1 text-sm">{config.knowledgeBaseIds.length} 个</span>
                    </div>
                ) : null}
            </div>
            <Handle position={Position.Left} type="target" />
            <Handle position={Position.Right} type="source" />
        </div>
    )
})
