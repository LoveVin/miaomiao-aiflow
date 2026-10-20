'use client'

import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, Plus, Trash2, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { ICON_MAP } from '@/components/flow/icon-map'
import { PortalButton } from '@/components/shared'
import { workflowModels } from '@/mocks/workflow'
import type { FlowNode, NodeConfig, NodeKind } from '@/types/workflow'

const fieldClass = 'mb-[18px] flex flex-col gap-2 text-[10px] font-[550] text-[#63687d]'
const controlClass =
    'w-full rounded-[7px] border border-[#e0e3ee] bg-white px-[10px] py-[9px] text-[11px] leading-[1.7] text-[#60657b] outline-none focus:border-[#a293eb] focus:shadow-[0_0_0_3px_#f2efff]'
const helpClass = 'block text-[9px] leading-[1.8] font-normal text-[#a2a6b9]'
const iconButtonClass =
    'grid size-[25px] shrink-0 place-items-center rounded-[5px] border-0 bg-transparent text-[#a5a7b7] hover:bg-[#f3f1fd] hover:text-[#6658bd]'
const checkboxClass = 'flex items-center gap-[6px] text-[10px] text-[#82879d]'
const nodeIconColors: Record<NodeKind, string> = {
    start: 'bg-[#e9f7ef] text-[#53a383]',
    model: 'bg-[#efebff] text-[#7b61d6]',
    knowledge: 'bg-[#eaf2fe] text-[#588ace]',
    http: 'bg-[#eaf2fe] text-[#5186cb]',
    condition: 'bg-[#fff4df] text-[#bd8735]',
    output: 'bg-[#eaf1fe] text-[#5c88cf]',
}

export function ConfigSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string
    value: string
    options: { value: string; label: string }[]
    onChange: (value: string) => void
}) {
    return (
        <label className={fieldClass}>
            <span>{label}</span>
            <Select.Root value={value} onValueChange={onChange}>
                <Select.Trigger className={`${controlClass} flex h-9 items-center justify-between font-normal`} aria-label={label}>
                    <Select.Value placeholder="请选择" />
                    <Select.Icon>
                        <ChevronDown size={14} />
                    </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Content
                        position="popper"
                        sideOffset={5}
                        className="z-60 min-w-[var(--radix-select-trigger-width)] rounded-lg border border-[#e1dff0] bg-white p-1 text-[11px] text-[#60657b] shadow-[0_8px_25px_#45416c19]"
                    >
                        <Select.Viewport>
                            {options.map(option => (
                                <Select.Item
                                    className="flex cursor-pointer justify-between gap-5 rounded-[5px] p-[9px] outline-none data-highlighted:bg-[#f2efff] data-highlighted:text-[#6a55c8]"
                                    key={option.value}
                                    value={option.value}
                                >
                                    <Select.ItemText>{option.label}</Select.ItemText>
                                    <Select.ItemIndicator>
                                        <Check size={13} />
                                    </Select.ItemIndicator>
                                </Select.Item>
                            ))}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
        </label>
    )
}
function TextField({
    label,
    value,
    onChange,
    multiline = false,
    children,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    multiline?: boolean
    children?: ReactNode
}) {
    return (
        <label className={fieldClass}>
            <span>{label}</span>
            {multiline ? (
                <textarea
                    className={`${controlClass} min-h-[65px] resize-y`}
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    rows={4}
                />
            ) : (
                <input className={`${controlClass} h-9`} value={value} onChange={event => onChange(event.target.value)} />
            )}
            {children}
        </label>
    )
}
const choices = (values: string[]) => values.map(value => ({ value, label: value }))

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
    const config = node.data.config
    const update = (patch: Partial<NodeConfig>) => onUpdate(node.data.label, { ...config, ...patch })
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
            <p className="m-0 border-b border-[#edeef5] bg-[#fbfbfe] px-[18px] py-3 text-[10px] leading-[1.8] text-[#9599ac]">
                配置当前节点。修改实时应用到画布，点击顶部保存后存入当前浏览器。
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[19px]">
                <TextField label="节点名称" value={node.data.label} onChange={label => onUpdate(label, config)} />
                {kind === 'start' && (
                    <>
                        <div className="mt-[23px] mb-[13px] flex items-center justify-between text-[10px]">
                            <strong>输入参数</strong>
                            <button
                                className="flex items-center gap-[3px] border-0 bg-transparent text-[10px] text-[#7d69d4]"
                                onClick={() =>
                                    update({
                                        inputs: [
                                            ...(config.inputs ?? []),
                                            {
                                                id: crypto.randomUUID(),
                                                name: `input_${(config.inputs?.length ?? 0) + 1}`,
                                                type: 'string',
                                                required: true,
                                            },
                                        ],
                                    })
                                }
                            >
                                <Plus size={13} />
                                添加参数
                            </button>
                        </div>
                        {(config.inputs ?? []).map((input, index) => (
                            <div className="mb-3 rounded-lg border border-[#e8e9f2] p-[11px] [&>label]:mb-[10px]" key={input.id}>
                                <TextField
                                    label={`参数 ${index + 1}`}
                                    value={input.name}
                                    onChange={name =>
                                        update({ inputs: config.inputs?.map(item => (item.id === input.id ? { ...item, name } : item)) })
                                    }
                                />
                                <div className="flex items-center gap-[10px] [&>label:first-child]:m-0 [&>label:first-child]:flex-1">
                                    <ConfigSelect
                                        label="类型"
                                        value={input.type}
                                        options={choices(['string', 'number', 'boolean'])}
                                        onChange={type =>
                                            update({
                                                inputs: config.inputs?.map(item =>
                                                    item.id === input.id ? { ...item, type: type as typeof input.type } : item
                                                ),
                                            })
                                        }
                                    />
                                    <label className={checkboxClass}>
                                        <input
                                            className="accent-[#7664d5]"
                                            type="checkbox"
                                            checked={input.required}
                                            onChange={event =>
                                                update({
                                                    inputs: config.inputs?.map(item =>
                                                        item.id === input.id ? { ...item, required: event.target.checked } : item
                                                    ),
                                                })
                                            }
                                        />
                                        必填
                                    </label>
                                    <button
                                        className={iconButtonClass}
                                        aria-label={`删除参数${input.name}`}
                                        onClick={() => update({ inputs: config.inputs?.filter(item => item.id !== input.id) })}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <small className={helpClass}>参数名需唯一，建议使用字母、数字与下划线。</small>
                    </>
                )}
                {kind === 'model' && (
                    <>
                        <ConfigSelect
                            label="模型（仅配置，未连接服务）"
                            value={config.model ?? workflowModels[0]}
                            options={choices(workflowModels)}
                            onChange={model => update({ model })}
                        />
                        <TextField
                            label="系统提示词"
                            multiline
                            value={config.systemPrompt ?? ''}
                            onChange={systemPrompt => update({ systemPrompt })}
                        />
                        <TextField label="用户提示词" multiline value={config.prompt ?? ''} onChange={prompt => update({ prompt })}>
                            <small className={helpClass}>使用 {'{{参数名}}'} 引用开始节点输入。</small>
                        </TextField>
                        <label className={fieldClass}>
                            <span className="flex justify-between">
                                温度<strong className="text-[#8c78d9]">{config.temperature ?? 0.7}</strong>
                            </span>
                            <input
                                className="w-full accent-[#7e69db] focus:border-[#a293eb] focus:shadow-[0_0_0_3px_#f2efff]"
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={config.temperature ?? 0.7}
                                onChange={event => update({ temperature: Number(event.target.value) })}
                            />
                        </label>
                        <ConfigSelect
                            label="最大回复长度"
                            value={config.maxTokens ?? '2048'}
                            options={choices(['1024', '2048', '4096'])}
                            onChange={maxTokens => update({ maxTokens })}
                        />
                    </>
                )}
                {kind === 'knowledge' && (
                    <>
                        <TextField label="知识库名称 / ID" value={config.knowledge ?? ''} onChange={knowledge => update({ knowledge })} />
                        <TextField label="检索问题" multiline value={config.prompt ?? ''} onChange={prompt => update({ prompt })} />
                        <ConfigSelect
                            label="召回数量 Top K"
                            value={config.topK ?? '3'}
                            options={choices(['1', '3', '5', '10'])}
                            onChange={topK => update({ topK })}
                        />
                        <small className={helpClass}>本地演示不检索文档，不生成虚构召回结果。</small>
                    </>
                )}
                {kind === 'http' && (
                    <>
                        <ConfigSelect
                            label="请求方法"
                            value={config.method ?? 'GET'}
                            options={choices(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])}
                            onChange={method => update({ method })}
                        />
                        <TextField label="请求 URL" value={config.url ?? ''} onChange={url => update({ url })} />
                        <TextField label="请求体" multiline value={config.body ?? ''} onChange={body => update({ body })} />
                        <small className={helpClass}>URL 和请求体可使用 {'{{参数名}}'}。本地模拟仅展示配置，不发出真实 HTTP 请求。</small>
                    </>
                )}
                {kind === 'condition' && (
                    <>
                        <TextField label="比较字段" value={config.field ?? ''} onChange={field => update({ field })}>
                            <small className={helpClass}>填写开始节点参数名或 content，不需要双花括号。</small>
                        </TextField>
                        <ConfigSelect
                            label="运算符"
                            value={config.operator ?? 'equals'}
                            options={[
                                { value: 'equals', label: '等于' },
                                { value: 'notEquals', label: '不等于' },
                                { value: 'contains', label: '包含' },
                                { value: 'greaterThan', label: '大于（数字）' },
                                { value: 'lessThan', label: '小于（数字）' },
                            ]}
                            onChange={operator => update({ operator: operator as NodeConfig['operator'] })}
                        />
                        <TextField label="比较值" value={config.value ?? ''} onChange={value => update({ value })} />
                        <small className={helpClass}>
                            等于、不等于和包含按文本比较；大小比较按数字。将右侧 true（满足）与
                            false（不满足）连接点分别连至目标节点，模拟仅执行命中的分支。
                        </small>
                    </>
                )}
                {kind === 'output' && (
                    <>
                        <ConfigSelect
                            label="输出格式"
                            value={config.format ?? 'text'}
                            options={choices(['text', 'json', 'markdown'])}
                            onChange={format => update({ format })}
                        />
                        <TextField
                            label="输出模板"
                            multiline
                            value={config.template ?? '{{content}}'}
                            onChange={template => update({ template })}
                        >
                            <small className={helpClass}>可引用 {'{{content}}'} 或开始节点的输入参数。</small>
                        </TextField>
                        <label className={`${checkboxClass} justify-between rounded-lg border border-[#e7e8f0] p-3`}>
                            <span>
                                流式输出<small className="mt-[5px] block text-[9px] text-[#a4a8b9]">仅保存配置，模拟不流式调用</small>
                            </span>
                            <input
                                className="accent-[#7664d5]"
                                type="checkbox"
                                checked={config.stream ?? false}
                                onChange={event => update({ stream: event.target.checked })}
                            />
                        </label>
                    </>
                )}
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
