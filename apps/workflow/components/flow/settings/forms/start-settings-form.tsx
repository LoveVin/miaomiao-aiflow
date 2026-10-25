'use client'

import { Edit2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { type Control, Controller, useForm, type UseFormRegister, useWatch } from 'react-hook-form'

import { PARAM_TYPE_LABELS, PARAM_TYPE_OPTIONS } from '@/components/flow/param-types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { FlowInput, ParamType } from '@/types/workflow'

import { CheckboxInput, EmptyList, Field, ListHeader, SelectInput, TextInput } from './controls'
import type { NodeSettingsFormProps } from './types'

const placeholders: Record<ParamType, string> = {
    string: '例如: Hello',
    number: '例如: 42',
    boolean: '例如: true 或 false',
    array: '例如: [1, 2, 3]',
    object: '例如: {"key": "value"}',
}

function DefaultValueInput({
    control,
    register,
}: {
    control: Control<FlowInput>
    register: ReturnType<typeof useForm<FlowInput>>['register']
}) {
    const paramType = useWatch({ control, name: 'type' }) as ParamType

    return <TextInput id="defaultValue" placeholder={placeholders[paramType || 'string']} {...register('defaultValue')} />
}

function ParamEditDialog({
    open,
    onOpenChange,
    param,
    onSave,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    param?: FlowInput
    onSave: (param: FlowInput) => void
}) {
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FlowInput>({ defaultValues: { name: '', type: 'string', defaultValue: '', required: false, description: '' } })

    useEffect(() => {
        if (open) reset(param || { name: '', type: 'string', defaultValue: '', required: false, description: '' })
    }, [open, param, reset])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <div className="mb-6">
                    <DialogTitle className="m-0 text-[15px] font-[650]">{param ? '编辑参数' : '添加参数'}</DialogTitle>
                    <DialogDescription className="mt-2 mb-0 text-[11px] text-[#9a9db0]">配置工作流的入参信息</DialogDescription>
                </div>
                <form
                    className="flex flex-col gap-5"
                    onSubmit={handleSubmit(data => {
                        onSave(data)
                        onOpenChange(false)
                    })}
                >
                    <Field label="参数名" htmlFor="name" required error={errors.name?.message}>
                        <TextInput id="name" placeholder="例如: count, userName" {...register('name', { required: '参数名不能为空' })} />
                    </Field>
                    <Field label="参数类型" htmlFor="type">
                        <Controller
                            control={control}
                            name="type"
                            render={({ field }) => (
                                <SelectInput
                                    id="type"
                                    value={field.value || 'string'}
                                    options={PARAM_TYPE_OPTIONS}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </Field>
                    <Field label="默认值" htmlFor="defaultValue">
                        <DefaultValueInput control={control} register={register} />
                    </Field>
                    <Field label="描述" htmlFor="description">
                        <TextInput id="description" placeholder="说明这个参数的用途" {...register('description')} />
                    </Field>
                    <label className="flex items-center gap-2 text-[11px] text-[#82879d]">
                        <CheckboxInput {...register('required')} />
                        必填
                    </label>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit">保存</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function StartSettingsForm({ node, onSave }: NodeSettingsFormProps<{ inputs: FlowInput[] }>) {
    const [inputs, setInputs] = useState<FlowInput[]>(node.data.config.inputs || [])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const lastSavedRef = useRef(JSON.stringify({ inputs: node.data.config.inputs || [] }))

    useEffect(() => {
        const current = JSON.stringify({ inputs })
        if (current === lastSavedRef.current) return
        const timer = window.setTimeout(() => {
            onSave({ inputs })
            lastSavedRef.current = current
        }, 500)
        return () => window.clearTimeout(timer)
    }, [inputs, onSave])

    const currentParam = editingIndex === null ? undefined : inputs[editingIndex]

    return (
        <form className="flex flex-col gap-5" onSubmit={event => event.preventDefault()}>
            <ListHeader
                title="入参配置"
                action={
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                            setEditingIndex(null)
                            setDialogOpen(true)
                        }}
                    >
                        <Plus size={13} />
                        添加参数
                    </Button>
                }
            />
            {inputs.length ? (
                <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
                    {inputs.map((input, index) => (
                        <div
                            className="group flex min-h-[38px] items-center justify-between rounded-lg border border-[#e8e9f2] px-3 py-2 hover:bg-[#faf9ff]"
                            key={`${input.name}-${index}`}
                        >
                            <span className="flex min-w-0 flex-1 items-center gap-2 text-[11px] text-[#555a70]">
                                <strong className="truncate font-[650]">{input.name}</strong>
                                <small className="rounded bg-[#f2f3f8] px-1.5 py-0.5 text-[9px]">{PARAM_TYPE_LABELS[input.type]}</small>
                                {input.required ? (
                                    <small className="rounded bg-[#fdecec] px-1.5 py-0.5 text-[9px] text-[#c94f5b]">必填</small>
                                ) : null}
                                {input.defaultValue ? (
                                    <small className="truncate text-[9px] text-[#a2a6b9]">= {input.defaultValue}</small>
                                ) : null}
                            </span>
                            <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={() => {
                                        setEditingIndex(index)
                                        setDialogOpen(true)
                                    }}
                                >
                                    <Edit2 size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    type="button"
                                    onClick={() => setInputs(inputs.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyList title="暂无入参配置" description="点击上方按钮添加" />
            )}
            <ParamEditDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                param={currentParam}
                onSave={param => {
                    const next =
                        editingIndex === null
                            ? [...inputs, { ...param, id: crypto.randomUUID() }]
                            : inputs.map((item, index) =>
                                  index === editingIndex ? { ...param, id: item.id || crypto.randomUUID() } : item
                              )
                    setInputs(next)
                }}
            />
        </form>
    )
}
