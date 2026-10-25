'use client'

import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import { memo, useMemo } from 'react'

import { ICON_MAP } from '@/components/flow/icon-map'
import type { FlowNode } from '@/types/workflow'

import { useFlowEditorContext } from '../editor/context'
import { getAvailableNodeOutputs } from '../settings/node-outputs'
import { VariableRenderer } from '../settings/variable-renderer'

export const OutputNode = memo(function OutputNode({ id, data, selected }: NodeProps<FlowNode>) {
    const outputs = data.config.outputs || []
    const { nodes, edges } = useFlowEditorContext()
    const availableOutputs = useMemo(() => getAvailableNodeOutputs(id, nodes || [], edges || []), [edges, id, nodes])

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
                        <div className="flex flex-row gap-1" key={`${output.name}-${index}`}>
                            <VariableRenderer
                                availableOutputs={availableOutputs}
                                className="w-full text-xs text-[#82879d]"
                                value={output.value}
                            />
                        </div>
                    ))}
                </div>
            ) : null}
            <Handle position={Position.Left} type="target" />
        </div>
    )
})
