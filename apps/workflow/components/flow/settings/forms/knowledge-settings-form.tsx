'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { getAvailableNodeOutputs } from '@/components/flow/settings/node-outputs'
import { VariableEditor } from '@/components/flow/settings/variable-editor'
import type { KnowledgeOutputFormat, KnowledgeRetrievalMode } from '@/types/workflow'

import { EmptyList, Field, SelectedCheck, SelectInput, TextInput } from './controls'
import type { NodeSettingsFormProps } from './types'

interface KnowledgeBaseItem {
    id: string
    name: string
    documentCount?: number
}

const retrievalOptions: { value: KnowledgeRetrievalMode; label: string }[] = [
    { value: 'vector', label: '向量检索' },
    { value: 'fulltext', label: '全文检索' },
    { value: 'hybrid', label: '混合检索' },
]
const formatOptions: { value: KnowledgeOutputFormat; label: string }[] = [
    { value: 'text', label: '文本' },
    { value: 'json', label: 'JSON' },
]

export function KnowledgeSettingsForm({ node, onSave, flowContext }: NodeSettingsFormProps<Record<string, unknown>>) {
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([])
    const [loading, setLoading] = useState(true)
    const [config, setConfig] = useState({
        knowledgeBaseIds: node.data.config.knowledgeBaseIds || [],
        query: node.data.config.query || node.data.config.prompt || '',
        retrievalMode: node.data.config.retrievalMode || 'vector',
        topK: node.data.config.topK ?? 5,
        threshold: node.data.config.threshold ?? 0.2,
        outputFormat: node.data.config.outputFormat || 'text',
    })
    const lastSavedRef = useRef(JSON.stringify(config))
    const availableOutputs = useMemo(
        () => (flowContext ? getAvailableNodeOutputs(node.id, flowContext.nodes, flowContext.edges) : []),
        [flowContext, node.id]
    )

    useEffect(() => {
        const controller = new AbortController()
        fetch('/api/knowledge?pageSize=100', { signal: controller.signal })
            .then(response => {
                if (!response.ok) throw new Error('获取知识库列表失败')
                return response.json()
            })
            .then(result => setKnowledgeBases(result.data?.items || []))
            .catch(() => setKnowledgeBases([]))
            .finally(() => setLoading(false))
        return () => controller.abort()
    }, [])

    useEffect(() => {
        const current = JSON.stringify(config)
        if (current === lastSavedRef.current) return
        const timer = window.setTimeout(() => {
            onSave(config)
            lastSavedRef.current = current
        }, 500)
        return () => window.clearTimeout(timer)
    }, [config, onSave])

    const toggle = (id: string) =>
        setConfig(current => ({
            ...current,
            knowledgeBaseIds: current.knowledgeBaseIds.includes(id)
                ? current.knowledgeBaseIds.filter(item => item !== id)
                : [...current.knowledgeBaseIds, id],
        }))

    return (
        <div className="flex flex-col gap-5">
            <Field label="知识库" required>
                {loading ? (
                    <div className="py-2 text-[11px] text-[#a2a6b9]">加载中...</div>
                ) : knowledgeBases.length ? (
                    <div className="max-h-36 overflow-y-auto rounded-lg border border-[#e8e9f2] p-2">
                        {knowledgeBases.map(item => {
                            const checked = config.knowledgeBaseIds.includes(item.id)
                            return (
                                <button
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-[#f7f6fe]"
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggle(item.id)}
                                >
                                    <SelectedCheck checked={checked} />
                                    <span className="flex-1 truncate text-[11px] text-[#555a70]">{item.name}</span>
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    <EmptyList title="暂无知识库，请先创建" />
                )}
            </Field>
            <Field label="查询内容" help="可引用上游变量，例如 {{question}}">
                <VariableEditor
                    value={config.query}
                    onChange={query => setConfig({ ...config, query })}
                    availableOutputs={availableOutputs}
                    placeholder="输入查询内容，可使用 / 插入变量"
                    minHeight="80px"
                />
            </Field>
            <Field label="检索模式">
                <SelectInput
                    value={config.retrievalMode}
                    options={retrievalOptions}
                    onChange={retrievalMode => setConfig({ ...config, retrievalMode })}
                />
            </Field>
            <div className="grid grid-cols-3 gap-2">
                <Field label="Top K">
                    <TextInput
                        type="number"
                        min={1}
                        max={50}
                        value={config.topK}
                        onChange={event => setConfig({ ...config, topK: Number(event.target.value) })}
                    />
                </Field>
                <Field label="阈值">
                    <TextInput
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        value={config.threshold}
                        onChange={event => setConfig({ ...config, threshold: Number(event.target.value) })}
                    />
                </Field>
                <Field label="输出格式">
                    <SelectInput
                        value={config.outputFormat}
                        options={formatOptions}
                        onChange={outputFormat => setConfig({ ...config, outputFormat })}
                    />
                </Field>
            </div>
        </div>
    )
}
