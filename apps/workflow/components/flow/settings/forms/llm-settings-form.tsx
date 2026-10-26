'use client'

import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { getAvailableNodeOutputs } from '@/components/flow/settings/node-outputs'
import { VariableEditor } from '@/components/flow/settings/variable-editor'
import { workflowModels } from '@/lib/workflow-presets'
import type { NodeConfig } from '@/types/workflow'

import { Field, SelectInput, TextInput } from './controls'
import type { NodeSettingsFormProps } from './types'

export function LLMSettingsForm({ node, onSave, flowContext }: NodeSettingsFormProps<NodeConfig>) {
    const config = node.data.config
    const { register, control, setValue } = useForm<NodeConfig>({
        defaultValues: {
            model: config.model || workflowModels[0],
            systemPrompt: config.systemPrompt || '',
            userPrompt: config.userPrompt || config.prompt || '',
            assistantPrompt: config.assistantPrompt || '',
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens ?? 2000,
        },
    })
    const values = useWatch({ control })
    const availableOutputs = useMemo(
        () => (flowContext ? getAvailableNodeOutputs(node.id, flowContext.nodes, flowContext.edges) : []),
        [flowContext, node.id]
    )

    useEffect(() => {
        if (!values.model) return
        const timer = window.setTimeout(() => onSave({ ...values } as NodeConfig), 300)
        return () => window.clearTimeout(timer)
    }, [onSave, values])

    return (
        <div className="flex flex-col gap-5">
            <Field label="模型" required>
                <SelectInput
                    value={values.model || workflowModels[0]}
                    options={workflowModels.map(model => ({ value: model, label: model }))}
                    onChange={model => setValue('model', model)}
                />
            </Field>
            <Field label="系统提示词 (System)" help="定义 AI 的角色和行为准则">
                <VariableEditor
                    value={values.systemPrompt || ''}
                    onChange={value => setValue('systemPrompt', value)}
                    availableOutputs={availableOutputs}
                    placeholder="设定 AI 的角色、行为规范和背景信息..."
                />
            </Field>
            <Field label="用户提示词 (User)" required help="可引用上游变量，例如 {{product_name}}">
                <VariableEditor
                    value={values.userPrompt || ''}
                    onChange={value => setValue('userPrompt', value)}
                    availableOutputs={availableOutputs}
                    placeholder="输入用户提示词..."
                />
            </Field>
            <Field label="助手提示词 (Assistant)">
                <VariableEditor
                    value={values.assistantPrompt || ''}
                    onChange={value => setValue('assistantPrompt', value)}
                    availableOutputs={availableOutputs}
                    placeholder="可选，用于示例对话或续写"
                />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="温度">
                    <TextInput type="number" min={0} max={2} step={0.1} {...register('temperature', { valueAsNumber: true })} />
                </Field>
                <Field label="最大 Token 数">
                    <TextInput type="number" min={1} step={100} {...register('maxTokens', { valueAsNumber: true })} />
                </Field>
            </div>
        </div>
    )
}
