import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import { VariableMentionComponent } from './variable-mention-component'

export interface VariableMentionOptions {
    HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        variableMention: {
            insertVariable: (attrs: { nodeId: string; nodeLabel: string; variableName: string; variableLabel: string }) => ReturnType
        }
    }
}

export const VariableMention = Node.create<VariableMentionOptions>({
    name: 'variableMention',
    group: 'inline',
    inline: true,
    selectable: true,
    atom: true,
    addOptions() {
        return { HTMLAttributes: {} }
    },
    addAttributes() {
        return {
            nodeId: {
                default: null,
                parseHTML: element => element.getAttribute('data-node-id'),
                renderHTML: attributes => ({ 'data-node-id': attributes.nodeId }),
            },
            nodeLabel: {
                default: null,
                parseHTML: element => element.getAttribute('data-node-label'),
                renderHTML: attributes => ({ 'data-node-label': attributes.nodeLabel }),
            },
            variableName: {
                default: null,
                parseHTML: element => element.getAttribute('data-variable-name'),
                renderHTML: attributes => ({ 'data-variable-name': attributes.variableName }),
            },
            variableLabel: {
                default: null,
                parseHTML: element => element.getAttribute('data-variable-label'),
                renderHTML: attributes => ({ 'data-variable-label': attributes.variableLabel }),
            },
        }
    },
    parseHTML() {
        return [{ tag: 'span[data-variable-mention]' }]
    },
    renderHTML({ HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-variable-mention': '', class: 'variable-mention' }),
        ]
    },
    addNodeView() {
        return ReactNodeViewRenderer(VariableMentionComponent)
    },
    addCommands() {
        return {
            insertVariable:
                attrs =>
                ({ commands }) =>
                    commands.insertContent({ type: this.name, attrs }),
        }
    },
})
