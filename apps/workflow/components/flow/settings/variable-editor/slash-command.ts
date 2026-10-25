'use client'

import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import { type Editor, Extension, type Range } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'

import type { AvailableNodeOutput, NodeOutputVariable } from '../node-outputs'
import { SlashCommandList, type SlashCommandListRef } from './slash-command-list'

export interface SlashCommandItem {
    type: 'node' | 'variable'
    nodeOutput?: AvailableNodeOutput
    variable?: NodeOutputVariable
}

export interface SlashCommandOptions {
    suggestion: Omit<SuggestionOptions<SlashCommandItem>, 'editor'>
    availableOutputs: AvailableNodeOutput[]
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
    name: 'slashCommand',
    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashCommandItem }) => {
                    if (props.type === 'variable' && props.nodeOutput && props.variable) {
                        editor
                            .chain()
                            .focus()
                            .deleteRange(range)
                            .insertVariable({
                                nodeId: props.nodeOutput.nodeId,
                                nodeLabel: props.nodeOutput.nodeLabel,
                                variableName: props.variable.name,
                                variableLabel: props.variable.label,
                            })
                            .run()
                    }
                },
            },
            availableOutputs: [],
        }
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
                items: ({ query }) => {
                    const items: SlashCommandItem[] = []
                    const lowerQuery = query.toLowerCase()
                    this.options.availableOutputs.forEach(nodeOutput => {
                        nodeOutput.outputs.forEach(variable => {
                            const searchText =
                                `${nodeOutput.nodeLabel} ${nodeOutput.nodeId} ${variable.name} ${variable.label}`.toLowerCase()
                            if (!query || searchText.includes(lowerQuery)) {
                                items.push({ type: 'variable', nodeOutput, variable })
                            }
                        })
                    })
                    return items.slice(0, 10)
                },
                render: () => {
                    let component: ReactRenderer<SlashCommandListRef> | null = null
                    let floatingEl: HTMLDivElement | null = null
                    let cleanup: (() => void) | null = null
                    let blurHandler: (() => void) | null = null

                    const updatePosition = (clientRect: (() => DOMRect | null) | null) => {
                        if (!floatingEl || !clientRect) return
                        const rect = clientRect()
                        if (!rect) return
                        const virtualEl = { getBoundingClientRect: () => rect }
                        void computePosition(virtualEl, floatingEl, {
                            placement: 'bottom-start',
                            strategy: 'fixed',
                            middleware: [offset(4), flip(), shift({ padding: 8 })],
                        }).then(({ x, y }) => {
                            if (floatingEl) Object.assign(floatingEl.style, { left: `${x}px`, top: `${y}px` })
                        })
                    }

                    return {
                        onStart: props => {
                            component = new ReactRenderer(SlashCommandList, { props, editor: props.editor })
                            if (!props.clientRect) return
                            floatingEl = document.createElement('div')
                            floatingEl.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;pointer-events:auto;'
                            floatingEl.appendChild(component.element)
                            document.body.appendChild(floatingEl)
                            updatePosition(props.clientRect)
                            const rect = props.clientRect?.()
                            if (rect) {
                                const virtualEl = { getBoundingClientRect: () => rect }
                                cleanup = autoUpdate(virtualEl, floatingEl, () => updatePosition(props.clientRect ?? null))
                            }
                            blurHandler = () => {
                                window.setTimeout(() => {
                                    if (floatingEl) floatingEl.style.display = 'none'
                                }, 150)
                            }
                            props.editor.view.dom.addEventListener('blur', blurHandler)
                        },
                        onUpdate: props => {
                            component?.updateProps(props)
                            updatePosition(props.clientRect ?? null)
                        },
                        onKeyDown: props => {
                            if (props.event.key === 'Escape') {
                                if (floatingEl) floatingEl.style.display = 'none'
                                return true
                            }
                            return component?.ref?.onKeyDown(props) ?? false
                        },
                        onExit: () => {
                            if (blurHandler && component) component.editor.view.dom.removeEventListener('blur', blurHandler)
                            cleanup?.()
                            floatingEl?.remove()
                            component?.destroy()
                            floatingEl = null
                            component = null
                            cleanup = null
                            blurHandler = null
                        },
                    }
                },
            }),
        ]
    },
})
