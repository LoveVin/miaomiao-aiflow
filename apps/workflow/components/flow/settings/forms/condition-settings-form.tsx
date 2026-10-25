'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getAvailableNodeOutputs } from '@/components/flow/settings/node-outputs'
import { VariableEditor } from '@/components/flow/settings/variable-editor'
import { Button } from '@/components/ui/button'
import { workflowModels } from '@/lib/workflow-presets'
import type { Intent } from '@/types/workflow'

import { EmptyList, Field, ListHeader, SelectInput, TextInput } from './controls'
import type { NodeSettingsFormProps } from './types'

export function ConditionSettingsForm({ node, onSave, flowContext }: NodeSettingsFormProps<{ model: string; intents: Intent[] }>) {
    const [model, setModel] = useState(node.data.config.model || workflowModels[0])
    const [intents, setIntents] = useState<Intent[]>(node.data.config.intents || [])
    const lastSavedRef = useRef('')
    const availableOutputs = useMemo(
        () => (flowContext ? getAvailableNodeOutputs(node.id, flowContext.nodes, flowContext.edges) : []),
        [flowContext, node.id]
    )

    useEffect(() => {
        const current = JSON.stringify({ model, intents })
        if (!lastSavedRef.current) {
            lastSavedRef.current = current
            return
        }
        if (current === lastSavedRef.current) return
        const timer = window.setTimeout(() => {
            const validIntents = intents.filter(intent => intent.name.trim())
            onSave({ model, intents: validIntents })
            lastSavedRef.current = JSON.stringify({ model, intents: validIntents })
        }, 500)
        return () => window.clearTimeout(timer)
    }, [intents, model, onSave])

    return (
        <div className="flex flex-col gap-5">
            <Field label="识别模型" help="选择用于意图识别的模型">
                <SelectInput value={model} options={workflowModels.map(item => ({ value: item, label: item }))} onChange={setModel} />
            </Field>
            <ListHeader
                title="意图列表"
                action={
                    <Button variant="outline" type="button" onClick={() => setIntents([...intents, { name: '', description: '' }])}>
                        <Plus size={13} />
                        添加
                    </Button>
                }
            />
            {intents.length ? (
                <div className="flex flex-col gap-3">
                    {intents.map((intent, index) => (
                        <div className="rounded-lg border border-[#e8e9f2] p-3" key={index}>
                            <div className="mb-3 flex items-center justify-between text-[10px] font-[650] text-[#555a70]">
                                <span>意图 {index + 1}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={() => setIntents(intents.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Field label="意图名称">
                                    <TextInput
                                        value={intent.name}
                                        onChange={event =>
                                            setIntents(
                                                intents.map((item, itemIndex) =>
                                                    itemIndex === index ? { ...item, name: event.target.value } : item
                                                )
                                            )
                                        }
                                        placeholder="例如: 查询订单"
                                    />
                                </Field>
                                <Field label="意图说明">
                                    <VariableEditor
                                        value={intent.description || ''}
                                        onChange={value =>
                                            setIntents(
                                                intents.map((item, itemIndex) =>
                                                    itemIndex === index ? { ...item, description: value } : item
                                                )
                                            )
                                        }
                                        placeholder="补充识别场景和关键词"
                                        availableOutputs={availableOutputs}
                                        minHeight="60px"
                                    />
                                </Field>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyList title="暂无意图配置" description='点击"添加"配置意图分支' />
            )}
            <p className="m-0 text-[10px] leading-[1.8] text-[#a2a6b9]">
                大模型会根据输入内容识别用户意图，并路由到对应分支。无法识别时将走“其他”分支。
            </p>
        </div>
    )
}
