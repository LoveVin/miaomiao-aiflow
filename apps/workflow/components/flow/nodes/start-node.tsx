'use client'

import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import { memo } from 'react'

import { ICON_MAP } from '@/components/flow/icon-map'
import { PARAM_TYPE_LABELS } from '@/components/flow/param-types'
import type { FlowNode } from '@/types/workflow'

export const StartNode = memo(function StartNode({ data, selected }: NodeProps<FlowNode>) {
    const inputs = data.config.inputs || []

    return (
        <div
            className={clsx('w-44 rounded-xl border bg-white p-3 shadow-md', {
                'border-[#3d7de0]': selected,
                'border-transparent': !selected,
            })}
        >
            <div className="mb-3 flex items-center">
                <span className="mr-3 grid place-items-center rounded-lg bg-[#3d7de0] p-2 text-white shadow-sm">
                    <ICON_MAP.start size={14} />
                </span>
                <span className="text-[13px] font-bold">{data.label}</span>
            </div>
            {inputs.length ? (
                <div className="flex flex-col gap-2">
                    {inputs.map((input, index) => (
                        <div
                            className="flex h-6 items-center justify-between gap-1 rounded-md bg-[#f2f4f7] px-2"
                            key={`${input.name}-${index}`}
                        >
                            <span className="flex w-0 grow items-center gap-1">
                                <span className="size-2 rounded-full bg-[#155aef]" />
                                <span className="truncate text-xs" title={input.name}>
                                    {input.name}
                                </span>
                            </span>
                            <span className="ml-1 flex items-center gap-1">
                                <span className="whitespace-nowrap text-[10px] text-gray-500">{PARAM_TYPE_LABELS[input.type]}</span>
                                {input.required ? <span className="text-xs text-red-500">*</span> : null}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-2 text-center text-xs text-gray-400">暂无入参</div>
            )}
            <Handle position={Position.Right} type="source" />
        </div>
    )
})
