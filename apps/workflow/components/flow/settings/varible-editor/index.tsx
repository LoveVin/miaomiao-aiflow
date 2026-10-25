'use client'

import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

function RichTextEditor({ placeholder, singleLine }: { placeholder: string; singleLine: boolean }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                bulletList: false,
                orderedList: false,
                blockquote: false,
                codeBlock: false,
                horizontalRule: false,
                // 单行模式禁用硬换行
                hardBreak: singleLine ? false : {},
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
    })

    return (
        <div>
            <EditorContent editor={editor} />
        </div>
    )
}
