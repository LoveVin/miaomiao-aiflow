'use client'

import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, type JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ChevronDown } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import { getColor, ICON_MAP } from '@/components/flow/icon-map'
import { cn } from '@/components/ui/button'
import type { NodeKind } from '@/types/workflow'

import { type AvailableNodeOutput, formatVariableExpression, type NodeOutputVariable } from '../node-outputs'
import { VariableTag } from '../variable-renderer'
import { SlashCommand } from './slash-command'
import { VariableMention } from './variable-mention'

interface VariableEditorProps {
    value: string
    onChange: (value: string) => void
    availableOutputs: AvailableNodeOutput[]
    placeholder?: string
    minHeight?: string
    disabled?: boolean
    className?: string
    singleVariable?: boolean
    singleLine?: boolean
    hideBorder?: boolean
}

function textToContent(text: string, availableOutputs: AvailableNodeOutput[]): JSONContent {
    const content: JSONContent[] = []
    const variableRegex = /\$\{([^.]+)\.([^}]+)\}/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = variableRegex.exec(text)) !== null) {
        if (match.index > lastIndex && text.slice(lastIndex, match.index)) {
            content.push({ type: 'text', text: text.slice(lastIndex, match.index) })
        }
        const nodeId = match[1]!
        const variableName = match[2]!
        const nodeOutput = availableOutputs.find(item => item.nodeId === nodeId)
        const variable = nodeOutput?.outputs.find(item => item.name === variableName)
        content.push({
            type: 'variableMention',
            attrs: { nodeId, nodeLabel: nodeOutput?.nodeLabel || nodeId, variableName, variableLabel: variable?.label || variableName },
        })
        lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) content.push({ type: 'text', text: text.slice(lastIndex) })
    if (content.length === 0) return { type: 'doc', content: [{ type: 'paragraph' }] }
    return { type: 'doc', content: [{ type: 'paragraph', content }] }
}

function contentToText(content: JSONContent): string {
    let result = ''
    const processNode = (node: JSONContent) => {
        if (node.type === 'text') {
            result += node.text || ''
        } else if (node.type === 'variableMention') {
            result += formatVariableExpression(node.attrs?.nodeId || '', node.attrs?.variableName || '')
        } else if (node.type === 'paragraph') {
            node.content?.forEach(processNode)
            result += '\n'
        } else if (node.content) {
            node.content.forEach(processNode)
        }
    }
    content.content?.forEach(processNode)
    return result.replace(/\n$/, '')
}

function parseVariableExpression(value: string) {
    const match = value.match(/\$\{([^.]+)\.([^}]+)\}/)
    return match ? { nodeId: match[1]!, variableName: match[2]! } : null
}

function VariableGroupList({
    availableOutputs,
    selectedIndex,
    onSelect,
}: {
    availableOutputs: AvailableNodeOutput[]
    selectedIndex?: number
    onSelect: (nodeOutput: AvailableNodeOutput, variable: NodeOutputVariable, flatIndex: number) => void
}) {
    const flatItems = useMemo(
        () => availableOutputs.flatMap(nodeOutput => nodeOutput.outputs.map(variable => ({ nodeOutput, variable }))),
        [availableOutputs]
    )

    return (
        <>
            {availableOutputs.map(nodeOutput => {
                const NodeIcon = ICON_MAP[nodeOutput.nodeType]
                return (
                    <div key={nodeOutput.nodeId}>
                        <div className="flex items-center gap-2 border-b border-[#edeef5] bg-[#f7f8fb] px-3 py-1.5">
                            <span
                                className={`flex size-5 shrink-0 items-center justify-center rounded text-white ${getColor(nodeOutput.nodeType)}`}
                            >
                                {NodeIcon ? <NodeIcon size={12} /> : null}
                            </span>
                            <span className="text-[11px] font-medium text-[#4d5164]">{nodeOutput.nodeLabel}</span>
                            <span className="text-[11px] text-[#9a9db0]">({nodeOutput.nodeId})</span>
                        </div>
                        {nodeOutput.outputs.map(variable => {
                            const currentFlatIndex = flatItems.findIndex(
                                item => item.nodeOutput === nodeOutput && item.variable === variable
                            )
                            return (
                                <button
                                    className={`flex w-full items-center gap-2 py-2 pl-10 pr-3 text-left transition-colors ${
                                        selectedIndex === currentFlatIndex ? 'bg-[#f2efff]' : 'hover:bg-[#f7f6fe]'
                                    }`}
                                    key={`${nodeOutput.nodeId}-${variable.name}`}
                                    type="button"
                                    onMouseDown={event => event.preventDefault()}
                                    onClick={() => onSelect(nodeOutput, variable, currentFlatIndex)}
                                >
                                    <code className="rounded bg-[#f2efff] px-1.5 py-0.5 font-mono text-[11px] text-[#7664d5]">
                                        {variable.name}
                                    </code>
                                    <span className="flex-1 truncate text-[11px] text-[#9a9db0]">{variable.label}</span>
                                    <span className="text-[11px] text-[#c3c5d0]">{variable.type}</span>
                                </button>
                            )
                        })}
                    </div>
                )
            })}
        </>
    )
}

function SingleVariableSelector({
    value,
    onChange,
    availableOutputs,
    placeholder,
    disabled,
}: {
    value: string
    onChange: (value: string) => void
    availableOutputs: AvailableNodeOutput[]
    placeholder?: string
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const flatItems = useMemo(
        () => availableOutputs.flatMap(nodeOutput => nodeOutput.outputs.map(variable => ({ nodeOutput, variable }))),
        [availableOutputs]
    )
    const selectedVariable = useMemo(() => {
        const parsed = parseVariableExpression(value)
        const nodeOutput = availableOutputs.find(item => item.nodeId === parsed?.nodeId)
        const variable = nodeOutput?.outputs.find(item => item.name === parsed?.variableName)
        return nodeOutput && variable ? { nodeOutput, variable } : null
    }, [availableOutputs, value])

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (!open) {
            if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
                event.preventDefault()
                setOpen(true)
            }
            return
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelectedIndex((selectedIndex + flatItems.length - 1) % flatItems.length)
        } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelectedIndex((selectedIndex + 1) % flatItems.length)
        } else if (event.key === 'Enter') {
            event.preventDefault()
            const item = flatItems[selectedIndex]
            if (item) {
                onChange(formatVariableExpression(item.nodeOutput.nodeId, item.variable.name))
                setOpen(false)
            }
        } else if (event.key === 'Escape') {
            setOpen(false)
        }
    }

    return (
        <div
            ref={containerRef}
            className="relative"
            onBlur={event => {
                if (!containerRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
            }}
        >
            <button
                className="flex h-9 w-full items-center justify-between rounded-[7px] border border-[#e0e3ee] bg-white px-[10px] text-[11px] transition-colors focus:border-[#a293eb] focus:shadow-[0_0_0_3px_#f2efff] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
                type="button"
                onClick={() => setOpen(!open)}
                onKeyDown={handleKeyDown}
            >
                {selectedVariable ? (
                    <VariableTag
                        variable={{
                            nodeId: selectedVariable.nodeOutput.nodeId,
                            nodeLabel: selectedVariable.nodeOutput.nodeLabel,
                            variableName: selectedVariable.variable.name,
                            variableLabel: selectedVariable.variable.label,
                            variableType: selectedVariable.variable.type,
                        }}
                        removable
                        onRemove={() => onChange('')}
                    />
                ) : (
                    <span className="text-[#a2a6b9]">{placeholder || '选择变量'}</span>
                )}
                <ChevronDown className="shrink-0 text-[#a2a6b9]" size={14} />
            </button>
            {open ? (
                <div
                    className="absolute left-0 right-0 top-full z-50 mt-1 min-w-[300px] overflow-hidden rounded-lg border border-[#e8eaf2] bg-white shadow-lg"
                    onMouseDown={event => event.preventDefault()}
                >
                    <div className="border-b border-[#edeef5] bg-[#fbfbfd] px-3 py-2">
                        <span className="text-[11px] font-medium text-[#82879d]">选择变量</span>
                    </div>
                    <div className="max-h-[220px] overflow-auto">
                        {availableOutputs.length ? (
                            <VariableGroupList
                                availableOutputs={availableOutputs}
                                selectedIndex={selectedIndex}
                                onSelect={(nodeOutput, variable, index) => {
                                    setSelectedIndex(index)
                                    onChange(formatVariableExpression(nodeOutput.nodeId, variable.name))
                                    setOpen(false)
                                }}
                            />
                        ) : (
                            <div className="p-3 text-[12px] text-[#9a9db0]">没有可用的变量</div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

function RichTextEditor({
    value,
    onChange,
    availableOutputs,
    placeholder,
    minHeight,
    disabled,
    className,
    singleLine,
    hideBorder,
}: {
    value: string
    onChange: (value: string) => void
    availableOutputs: AvailableNodeOutput[]
    placeholder: string
    minHeight: string
    disabled?: boolean
    className?: string
    singleLine: boolean
    hideBorder?: boolean
}) {
    const initialContent = useMemo(() => textToContent(value, availableOutputs), [availableOutputs, value])
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                bulletList: false,
                orderedList: false,
                blockquote: false,
                codeBlock: false,
                horizontalRule: false,
                hardBreak: singleLine ? false : {},
            }),
            Placeholder.configure({ placeholder }),
            VariableMention,
            SlashCommand.configure({ availableOutputs }),
        ],
        content: initialContent,
        editable: !disabled,
        onUpdate: ({ editor: currentEditor }) => onChange(contentToText(currentEditor.getJSON())),
        editorProps: {
            attributes: { class: 'outline-none' },
            handleKeyDown: singleLine
                ? (_view, event) => {
                      if (event.key === 'Enter') return true
                      return false
                  }
                : undefined,
        },
        immediatelyRender: false,
    })
    const containerStyle = singleLine ? { height: '36px' } : { minHeight }
    const editorClassName = singleLine
        ? 'flex h-full items-center px-[10px] text-[11px] [&_.ProseMirror]:flex-1 [&_.ProseMirror]:overflow-x-auto [&_.ProseMirror]:overflow-y-hidden [&_.ProseMirror]:whitespace-nowrap [&_.ProseMirror]:outline-none'
        : 'px-[10px] py-2 text-[11px] [&_.ProseMirror]:min-h-[48px] [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:break-all [&_.ProseMirror]:outline-none [&_.ProseMirror]:overflow-auto'

    return (
        <div className={cn('relative', className)}>
            <div
                className={cn(
                    'overflow-hidden bg-white transition-[border-color,box-shadow] focus-within:border-[#a293eb] focus-within:shadow-[0_0_0_3px_#f2efff]',
                    hideBorder ? 'rounded-none border-0' : 'rounded-[7px] border border-[#e0e3ee]'
                )}
                style={containerStyle}
            >
                <EditorContent editor={editor} className={editorClassName} />
            </div>
            {!singleLine && availableOutputs.length > 0 ? (
                <p className="mb-0 mt-1 text-[9px] leading-[1.8] text-[#a2a6b9]">
                    输入 <kbd className="rounded bg-[#f2f3f8] px-1 font-mono">/</kbd> 插入变量
                </p>
            ) : null}
        </div>
    )
}

export function VariableEditor({
    value,
    onChange,
    availableOutputs,
    placeholder = '输入内容，使用 / 插入变量...',
    minHeight = '100px',
    disabled,
    className,
    singleVariable = false,
    singleLine = false,
    hideBorder = false,
}: VariableEditorProps) {
    if (singleVariable) {
        return (
            <SingleVariableSelector
                value={value}
                onChange={onChange}
                availableOutputs={availableOutputs}
                placeholder={placeholder}
                disabled={disabled}
            />
        )
    }
    return (
        <RichTextEditor
            value={value}
            onChange={onChange}
            availableOutputs={availableOutputs}
            placeholder={placeholder}
            minHeight={minHeight}
            disabled={disabled}
            className={className}
            singleLine={singleLine}
            hideBorder={hideBorder}
        />
    )
}
