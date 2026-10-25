'use client'

import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import { memo } from 'react'

import { ICON_MAP } from '@/components/flow/icon-map'
import type { FlowNode } from '@/types/workflow'

export const ConditionNode = memo(function ConditionNode({ data, selected }: NodeProps<FlowNode>) {
    const intents = data.config.intents || []

    return (
        <div
            className={clsx('w-64 rounded-xl border bg-white p-3 shadow-md', {
                'border-[#7b61d6]': selected,
                'border-transparent': !selected,
            })}
        >
            <div className="mb-2 flex items-center">
                <span className="mr-3 grid place-items-center rounded-lg bg-[#7b61d6] p-2 text-white shadow-sm">
                    <ICON_MAP.condition size={14} />
                </span>
                <span className="text-[13px] font-bold">{data.label}</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-12 text-xs text-gray-600">模型</span>
                    <span className="flex-1 rounded-md bg-[#f2f4f7] px-2 py-1 text-sm">{data.config.model || '未选择模型'}</span>
                </div>
            </div>
            <Handle position={Position.Left} type="target" />
            {intents.length ? (
                <div className="mt-2 flex flex-col gap-2">
                    {intents.map((intent, index) => (
                        <div className="relative rounded-md bg-[#f2f4f7] px-2 py-1" key={`${intent.name}-${index}`}>
                            <p className="mb-1 text-xs font-bold text-gray-600">意图{index + 1}</p>
                            <p className="m-0 max-w-[180px] truncate text-sm text-zinc-500" title={intent.name}>
                                {intent.name}
                            </p>
                            <Handle id={`intent-${index}`} position={Position.Right} style={{ right: '-12px', top: '50%' }} type="source" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-2 text-center text-xs text-gray-400">请配置意图列表</div>
            )}
        </div>
    )
})
