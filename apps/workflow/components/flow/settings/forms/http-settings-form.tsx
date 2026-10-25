'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { getAvailableNodeOutputs } from '@/components/flow/settings/node-outputs'
import { VariableEditor } from '@/components/flow/settings/variable-editor'
import { Button } from '@/components/ui/button'
import type { HttpBodyType, HttpMethod, KeyValuePair } from '@/types/workflow'

import { CheckboxField, Field, ListHeader, SelectInput, TextInput } from './controls'
import type { NodeSettingsFormProps } from './types'

const methodOptions: { value: HttpMethod; label: string }[] = (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as HttpMethod[]).map(value => ({
    value,
    label: value,
}))
const bodyTypeOptions: { value: HttpBodyType; label: string }[] = [
    { value: 'none', label: 'none' },
    { value: 'form-data', label: 'form-data' },
    { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
    { value: 'json', label: 'json' },
    { value: 'raw', label: 'raw' },
    { value: 'binary', label: 'binary' },
]

function KeyValueTable({
    title,
    value,
    onChange,
    availableOutputs,
}: {
    title: string
    value: KeyValuePair[]
    onChange: (value: KeyValuePair[]) => void
    availableOutputs: ReturnType<typeof getAvailableNodeOutputs>
}) {
    return (
        <Field label={title}>
            <div className="overflow-hidden rounded-lg border border-[#e8e9f2]">
                <table className="w-full border-collapse">
                    <thead className="bg-[#f7f8fb]">
                        <tr>
                            <th className="w-1/2 px-2 py-2 text-left text-[10px] text-[#82879d]">Key</th>
                            <th className="w-1/2 px-2 py-2 text-left text-[10px] text-[#82879d]">Value</th>
                            <th className="w-10 px-1 py-2 text-center text-[10px] text-[#82879d]">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {value.map((item, index) => (
                            <tr key={index}>
                                <td className="border-0 border-t border-solid border-[#eeeff5] p-1 align-top">
                                    <TextInput
                                        value={item.key}
                                        onChange={event =>
                                            onChange(
                                                value.map((row, rowIndex) =>
                                                    rowIndex === index ? { ...row, key: event.target.value } : row
                                                )
                                            )
                                        }
                                        placeholder="Name"
                                    />
                                </td>
                                <td className="border-0 border-t border-solid border-[#eeeff5] p-1 align-top">
                                    <VariableEditor
                                        availableOutputs={availableOutputs}
                                        value={item.value}
                                        onChange={rowValue =>
                                            onChange(value.map((row, rowIndex) => (rowIndex === index ? { ...row, value: rowValue } : row)))
                                        }
                                        placeholder="Value"
                                        hideBorder
                                        minHeight="60px"
                                    />
                                </td>
                                <td className="border-0 border-t border-solid border-[#eeeff5] px-1 py-1 text-center align-top">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        onClick={() => onChange(value.filter((_, rowIndex) => rowIndex !== index))}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {value.length === 0 ? (
                            <tr>
                                <td className="px-3 py-4 text-center text-[10px] text-[#a2a6b9]" colSpan={3}>
                                    暂无数据
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
            <Button variant="outline" type="button" onClick={() => onChange([...value, { key: '', value: '' }])}>
                <Plus size={13} />
                添加
            </Button>
        </Field>
    )
}

export function HttpSettingsForm({ node, onSave, flowContext }: NodeSettingsFormProps<Record<string, unknown>>) {
    const [config, setConfig] = useState({
        method: node.data.config.method || 'GET',
        url: node.data.config.url || '',
        headers: node.data.config.headers || [],
        params: node.data.config.params || [],
        bodyType: node.data.config.bodyType || 'none',
        body: node.data.config.body || '',
        formData: node.data.config.formData || [],
        timeout: node.data.config.timeout ?? 30000,
        followRedirects: node.data.config.followRedirects ?? true,
    })
    const lastSavedRef = useRef('')
    const availableOutputs = useMemo(
        () => (flowContext ? getAvailableNodeOutputs(node.id, flowContext.nodes, flowContext.edges) : []),
        [flowContext, node.id]
    )
    const showBody = config.bodyType !== 'none' && config.bodyType !== 'binary'
    const useTextEditor = config.bodyType === 'json' || config.bodyType === 'raw'
    const useFormData = config.bodyType === 'form-data' || config.bodyType === 'x-www-form-urlencoded'

    useEffect(() => {
        const current = JSON.stringify(config)
        if (!lastSavedRef.current) {
            lastSavedRef.current = current
            return
        }
        if (current === lastSavedRef.current) return
        const timer = window.setTimeout(() => {
            onSave(config)
            lastSavedRef.current = current
        }, 500)
        return () => window.clearTimeout(timer)
    }, [config, onSave])

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-[96px_1fr] gap-2">
                <Field label="方法">
                    <SelectInput value={config.method} options={methodOptions} onChange={method => setConfig({ ...config, method })} />
                </Field>
                <Field label="请求 URL" required>
                    <VariableEditor
                        value={config.url}
                        onChange={url => setConfig({ ...config, url })}
                        placeholder="https://api.example.com/users"
                        availableOutputs={availableOutputs}
                        minHeight="70px"
                    />
                </Field>
            </div>
            <Field label="超时时间 (ms)">
                <TextInput
                    type="number"
                    min={1000}
                    step={1000}
                    value={config.timeout}
                    onChange={event => setConfig({ ...config, timeout: Number(event.target.value) })}
                />
            </Field>
            <KeyValueTable
                title="请求头 (Headers)"
                value={config.headers}
                onChange={headers => setConfig({ ...config, headers })}
                availableOutputs={availableOutputs}
            />
            <KeyValueTable
                title="Query 参数 (Params)"
                value={config.params}
                onChange={params => setConfig({ ...config, params })}
                availableOutputs={availableOutputs}
            />
            <Field label="请求体 (Body)">
                <div className="flex flex-wrap gap-2">
                    {bodyTypeOptions.map(option => (
                        <label className="flex cursor-pointer items-center gap-1 text-[10px]" key={option.value}>
                            <input
                                className="accent-[#7664d5]"
                                type="radio"
                                checked={config.bodyType === option.value}
                                onChange={() => setConfig({ ...config, bodyType: option.value })}
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
            </Field>
            {useTextEditor ? (
                <Field>
                    <VariableEditor
                        className="font-mono"
                        value={config.body}
                        onChange={body => setConfig({ ...config, body })}
                        placeholder={config.bodyType === 'json' ? '{"key": "value"}' : '请输入文本内容...'}
                        availableOutputs={availableOutputs}
                        minHeight="120px"
                    />
                </Field>
            ) : null}
            {useFormData ? (
                <KeyValueTable
                    title="表单数据"
                    value={config.formData}
                    onChange={formData => setConfig({ ...config, formData })}
                    availableOutputs={availableOutputs}
                />
            ) : null}
            {config.bodyType === 'binary' ? (
                <div className="rounded-lg border border-dashed border-[#ddd9ef] px-4 py-5 text-center text-[10px] text-[#a2a6b9]">
                    Binary 模式暂不支持，请使用其他方式上传文件。
                </div>
            ) : null}
            <CheckboxField
                checked={config.followRedirects}
                onChange={followRedirects => setConfig({ ...config, followRedirects })}
                label="自动跟随重定向"
            />
        </div>
    )
}
