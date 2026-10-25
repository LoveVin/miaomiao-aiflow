'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getAvailableNodeOutputs } from '@/components/flow/settings/node-outputs'
import { VariableEditor } from '@/components/flow/settings/variable-editor'
import { Button } from '@/components/ui/button'
import type { OutputParam } from '@/types/workflow'

import { EmptyList, Field, ListHeader, TextInput } from './controls'
import type { NodeSettingsFormProps } from './types'

export function EndSettingsForm({ node, onSave, flowContext }: NodeSettingsFormProps<{ outputs: OutputParam[] }>) {
    const [outputs, setOutputs] = useState<OutputParam[]>(node.data.config.outputs || [])
    const lastSavedRef = useRef(JSON.stringify({ outputs: node.data.config.outputs || [] }))
    const availableOutputs = useMemo(
        () => (flowContext ? getAvailableNodeOutputs(node.id, flowContext.nodes, flowContext.edges) : []),
        [flowContext, node.id]
    )

    useEffect(() => {
        const current = JSON.stringify({ outputs })
        if (current === lastSavedRef.current) return
        const timer = window.setTimeout(() => {
            const validOutputs = outputs.filter(output => output.name.trim())
            onSave({ outputs: validOutputs })
            lastSavedRef.current = JSON.stringify({ outputs: validOutputs })
        }, 500)
        return () => window.clearTimeout(timer)
    }, [onSave, outputs])

    return (
        <div className="flex flex-col gap-5">
            <ListHeader
                title="输出参数"
                action={
                    <Button variant="outline" type="button" onClick={() => setOutputs([...outputs, { name: '', value: '' }])}>
                        <Plus size={13} />
                        添加
                    </Button>
                }
            />
            {outputs.length ? (
                <div className="flex flex-col gap-3">
                    {outputs.map((output, index) => (
                        <div className="rounded-lg border border-[#e8e9f2] p-3" key={index}>
                            <div className="mb-3 flex items-center justify-between text-[10px] font-[650] text-[#555a70]">
                                <span>参数 {index + 1}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={() => setOutputs(outputs.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <Field label="参数名">
                                    <TextInput
                                        value={output.name}
                                        onChange={event =>
                                            setOutputs(
                                                outputs.map((item, itemIndex) =>
                                                    itemIndex === index ? { ...item, name: event.target.value } : item
                                                )
                                            )
                                        }
                                        placeholder="result"
                                    />
                                </Field>
                            </div>
                            <Field label="参数值" className="mt-3">
                                <VariableEditor
                                    value={output.value}
                                    onChange={value =>
                                        setOutputs(outputs.map((item, itemIndex) => (itemIndex === index ? { ...item, value } : item)))
                                    }
                                    placeholder="选择上游变量"
                                    availableOutputs={availableOutputs}
                                    singleVariable
                                />
                            </Field>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyList title="暂无输出参数" description='点击"添加"配置输出' />
            )}
            <p className="m-0 text-[10px] leading-[1.8] text-[#a2a6b9]">配置工作流结束时返回的输出参数。</p>
        </div>
    )
}
