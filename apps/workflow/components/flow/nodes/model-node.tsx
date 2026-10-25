'use client'

import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import { memo } from 'react'

import { ICON_MAP } from '@/components/flow/icon-map'
import type { FlowNode } from '@/types/workflow'

export const ModelNode = memo(function ModelNode({ data, selected }: NodeProps<FlowNode>) {
    const model = data.config.model || '未选择模型'

    return (
        <div
            className={clsx('w-64 rounded-xl border bg-white p-3 shadow-md', {
                'border-[#7b61d6]': selected,
                'border-transparent': !selected,
            })}
        >
            <div className="mb-3 flex items-center">
                <span className="mr-3 grid place-items-center rounded-lg bg-[#7b61d6] p-2 text-white shadow-sm">
                    <ICON_MAP.model size={14} />
                </span>
                <span className="text-[13px] font-bold">{data.label}</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-12 text-xs text-gray-600">模型</span>
                    <span className="flex-1 rounded-md bg-[#f2f4f7] px-2 py-1 text-sm">{model}</span>
                </div>
            </div>
            <Handle position={Position.Left} type="target" />
            <Handle position={Position.Right} type="source" />
        </div>
    )
})
