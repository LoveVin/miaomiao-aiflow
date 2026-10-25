'use client'

import { Handle, type NodeProps, Position } from '@xyflow/react'
import { Trash2 } from 'lucide-react'
import { memo } from 'react'

import { useFlowEditorContext } from '@/components/flow/editor/context'
import { ICON_MAP } from '@/components/flow/icon-map'
import type { FlowNode, NodeKind } from '@/types/workflow'

const nodeIconColors: Record<NodeKind, string> = {
    start: 'bg-[#e9f7ef] text-[#53a383]',
    model: 'bg-[#efebff] text-[#7b61d6]',
    knowledge: 'bg-[#eaf2fe] text-[#588ace]',
    http: 'bg-[#eaf2fe] text-[#5186cb]',
    condition: 'bg-[#fff4df] text-[#bd8735]',
    output: 'bg-[#eaf1fe] text-[#5c88cf]',
}
export const WorkflowNode = memo(function WorkflowNode({ id, data, selected, type }: NodeProps<FlowNode>) {
    const kind = type ?? 'start'
    const Icon = ICON_MAP[kind]
    const { onDeleteNode } = useFlowEditorContext()
    const config = data.config
    const descriptions = {
        start: `输入：${config.inputs?.map(input => input.name).join('、') || '暂无参数'}`,
        model: `模型：${config.model || '未选择模型'}`,
        knowledge: `知识库：${config.knowledge || '待配置'}`,
        http: `${config.method || 'GET'} ${config.url || '待配置 URL'}`,
        condition: `${config.field || '待配置字段'} ${config.operator || '待配置运算符'} ${config.value ?? ''}`,
        output: `返回：${config.format || 'text'} 格式内容`,
    }
    const stateClass = selected
        ? 'border-[#8974e1] shadow-[0_0_0_3px_#eae5fc,0_10px_26px_#625b9819] hover:border-[#8974e1]'
        : kind === 'model'
          ? 'border-[#c4b7e9] shadow-[0_0_0_2px_#eeeafa,0_9px_24px_#67548f12] hover:border-[#c4b7e9]'
          : 'border-[#dedfea] shadow-[0_8px_25px_#34365b0d] hover:border-[#b7acdf]'
    return (
        <div className={`w-[228px] rounded-xl border bg-white p-[14px] transition-[border-color,box-shadow] duration-150 ${stateClass}`}>
            3333
            <div className="flex items-center gap-[9px]">
                <span className={`grid size-[27px] shrink-0 place-items-center rounded-[7px] ${nodeIconColors[kind]}`}>
                    <Icon size={16} />
                </span>
                <strong className="flex-1 truncate text-[11px]">{data.label}</strong>
                <button
                    className="nodrag nopan grid size-[25px] shrink-0 place-items-center rounded-[5px] border-0 bg-transparent text-[#a5a7b7] hover:bg-[#f3f1fd] hover:text-[#6658bd]"
                    aria-label={`删除${data.label}`}
                    onClick={event => {
                        event.stopPropagation()
                        onDeleteNode?.(id)
                    }}
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <p className="mt-[13px] mb-0 rounded-[6px] bg-[#f7f8fb] p-[9px] text-[9px] leading-[1.7] text-[#8e91a3] [overflow-wrap:anywhere]">
                {descriptions[kind]}
            </p>
            {kind === 'model' && (
                <small className="mx-[2px] mt-[9px] block text-[8px] text-[#b1aec4]">提示词 · {config.temperature ?? 0.7} 温度</small>
            )}
            {kind !== 'start' && <Handle type="target" position={Position.Left} />}
            {kind === 'condition' ? (
                <>
                    <div className="mt-2 flex flex-col items-end gap-2 text-[9px] leading-4 text-[#bd8735]">
                        <span>true（满足）</span>
                        <span>false（不满足）</span>
                    </div>
                    <Handle id="true" type="source" position={Position.Right} style={{ top: 'calc(100% - 47px)' }} aria-label="true 分支" />
                    <Handle
                        id="false"
                        type="source"
                        position={Position.Right}
                        style={{ top: 'calc(100% - 23px)' }}
                        aria-label="false 分支"
                    />
                </>
            ) : kind !== 'output' ? (
                <Handle type="source" position={Position.Right} />
            ) : null}
        </div>
    )
})
export const StartNode = memo(function StartNode(props: NodeProps<FlowNode>) {
    return <WorkflowNode {...props} type="start" />
})
