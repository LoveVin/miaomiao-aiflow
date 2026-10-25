'use client'

import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import { memo } from 'react'

import { ICON_MAP } from '@/components/flow/icon-map'
import type { FlowNode } from '@/types/workflow'

export const OutputNode = memo(function OutputNode({ data, selected }: NodeProps<FlowNode>) {
    const outputs = data.config.outputs || []

    return (
        <div
            className={clsx('w-52 rounded-xl border bg-white px-3 py-2 shadow-md', {
                'border-[#e7944d]': selected,
                'border-transparent': !selected,
            })}
        >
            <div className="flex items-center">
                <span className="mr-3 grid place-items-center rounded-lg bg-[#e7944d] p-2 text-white shadow-sm">
                    <ICON_MAP.output size={14} />
                </span>
                <span className="text-[13px] font-bold">{data.label}</span>
            </div>
            {outputs.length ? (
                <div className="mt-2 flex flex-col gap-1.5">
                    {outputs.map((output, index) => (
                        <p className="m-0 truncate text-xs text-[#82879d]" key={`${output.name}-${index}`} title={output.value}>
                            {output.value || output.name}
                        </p>
                    ))}
                </div>
            ) : null}
            <Handle position={Position.Left} type="target" />
        </div>
    )
})
