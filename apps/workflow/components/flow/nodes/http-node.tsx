'use client'

import type { NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import { memo } from 'react'

import { ICON_MAP } from '@/components/flow/icon-map'
import type { FlowNode } from '@/types/workflow'

export const HttpNode = memo(function HttpNode({ data, selected }: NodeProps<FlowNode>) {
    const method = data.config.method || 'GET'
    const url = data.config.url || ''
    const displayUrl = url.replace(/^https?:\/\//, '').substring(0, 30) + (url.length > 30 ? '...' : '')

    return (
        <div
            className={clsx('w-64 rounded-xl border bg-white px-3 py-2 shadow-md', {
                'border-[#45a274]': selected,
                'border-transparent': !selected,
            })}
        >
            <div className="mb-3 flex items-center">
                <span className="mr-3 grid place-items-center rounded-lg bg-[#45a274] p-2 text-white shadow-sm">
                    <ICON_MAP.http size={14} />
                </span>
                <span className="text-[13px] font-bold">{data.label}</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-12 text-xs text-gray-600">方法</span>
                    <span
                        className={clsx('rounded-md px-2 py-0.5 text-xs font-medium', {
                            'bg-blue-100 text-blue-700': method === 'GET',
                            'bg-green-100 text-green-700': method === 'POST',
                            'bg-orange-100 text-orange-700': method === 'PUT',
                            'bg-red-100 text-red-700': method === 'DELETE',
                            'bg-purple-100 text-purple-700': method === 'PATCH',
                        })}
                    >
                        {method}
                    </span>
                </div>
                {url ? (
                    <div className="flex items-center gap-2">
                        <span className="w-12 text-xs text-gray-600">URL</span>
                        <span className="flex-1 truncate rounded-md bg-[#f2f4f7] px-2 py-1 text-xs" title={url}>
                            {displayUrl}
                        </span>
                    </div>
                ) : null}
            </div>
            <Handle position={Position.Left} type="target" />
            <Handle position={Position.Right} type="source" />
        </div>
    )
})
