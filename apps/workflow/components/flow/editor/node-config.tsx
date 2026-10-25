'use client'

import { Trash2, X } from 'lucide-react'
import type { ComponentType } from 'react'

import { useFlowEditorContext } from '@/components/flow/editor/context'
import { ICON_MAP } from '@/components/flow/icon-map'
import {
    ConditionSettingsForm,
    EndSettingsForm,
    HttpSettingsForm,
    KnowledgeSettingsForm,
    LLMSettingsForm,
    StartSettingsForm,
} from '@/components/flow/settings/forms'
import { Field, TextInput } from '@/components/flow/settings/forms/controls'
import type { NodeSettingsFormProps } from '@/components/flow/settings/forms/types'
import { PortalButton } from '@/components/shared'
import type { FlowNode, NodeConfig, NodeKind } from '@/types/workflow'

const iconButtonClass =
    'grid size-[25px] shrink-0 place-items-center rounded-[5px] border-0 bg-transparent text-[#a5a7b7] hover:bg-[#f3f1fd] hover:text-[#6658bd]'
const nodeIconColors: Record<NodeKind, string> = {
    start: 'bg-[#e9f7ef] text-[#53a383]',
    model: 'bg-[#efebff] text-[#7b61d6]',
    knowledge: 'bg-[#eaf2fe] text-[#588ace]',
    http: 'bg-[#eaf2fe] text-[#5186cb]',
    condition: 'bg-[#fff4df] text-[#bd8735]',
    output: 'bg-[#eaf1fe] text-[#5c88cf]',
}

const formComponents: Record<NodeKind, ComponentType<NodeSettingsFormProps<NodeConfig>>> = {
    start: StartSettingsForm,
    model: LLMSettingsForm,
    knowledge: KnowledgeSettingsForm,
    http: HttpSettingsForm,
    condition: ConditionSettingsForm,
    output: EndSettingsForm,
}

export function NodeConfigPanel({
    node,
    onUpdate,
    onClose,
    onDelete,
}: {
    node: FlowNode
    onUpdate: (label: string, config: NodeConfig) => void
    onClose: () => void
    onDelete: () => void
}) {
    const kind = node.type ?? 'start'
    const Icon = ICON_MAP[kind]
    const { nodes = [], edges = [] } = useFlowEditorContext()
    const FormComponent = formComponents[kind]
    const saveConfig = (config: Partial<NodeConfig>) => onUpdate(node.data.label, { ...node.data.config, ...config })

    return (
        <aside className="z-3 flex min-h-0 w-[330px] shrink-0 flex-col border-l border-[#e6e8f1] bg-white max-[1100px]:w-[300px] max-[800px]:absolute max-[800px]:top-[108px] max-[800px]:right-0 max-[800px]:bottom-0 max-[800px]:w-[min(310px,80vw)] max-[800px]:shadow-[-10px_0_30px_#34365b10]">
            <div className="flex min-h-[61px] items-center justify-between border-b border-[#edeef5] px-[18px]">
                <div className="flex items-center gap-[10px]">
                    <span className={`grid size-[30px] shrink-0 place-items-center rounded-lg ${nodeIconColors[kind]}`}>
                        <Icon size={16} />
                    </span>
                    <strong className="text-[12px]">{node.data.label}</strong>
                </div>
                <button className={iconButtonClass} aria-label="关闭节点配置" onClick={onClose}>
                    <X size={17} />
                </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[19px]">
                <Field label="节点名称" className="mb-5">
                    <TextInput value={node.data.label} onChange={event => onUpdate(event.target.value, node.data.config)} />
                </Field>
                <FormComponent node={node} onSave={saveConfig} flowContext={{ nodes, edges }} />
            </div>
            <div className="flex min-h-16 justify-between gap-[10px] border-t border-[#e8e9f2] px-[18px] py-3">
                <PortalButton onClick={onDelete}>
                    <Trash2 size={14} />
                    删除节点
                </PortalButton>
                <PortalButton primary onClick={onClose}>
                    完成配置
                </PortalButton>
            </div>
        </aside>
    )
}
