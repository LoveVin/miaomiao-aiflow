'use client'

import * as Primitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from './button'
export const Dialog = Primitive.Root
export const DialogTrigger = Primitive.Trigger
export const DialogTitle = Primitive.Title
export const DialogDescription = Primitive.Description
export const DialogClose = Primitive.Close
export function DialogContent({ children, className, ...props }: ComponentProps<typeof Primitive.Content>) {
    return (
        <Primitive.Portal>
            <Primitive.Overlay className="fixed inset-0 z-50 animate-[portal-fade_0.2s] bg-[rgba(19,18,22,0.45)] backdrop-blur-[3px]" />
            <Primitive.Content
                className={cn(
                    'portal-modal fixed left-1/2 top-1/2 z-[51] max-h-[90vh] w-[min(480px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl bg-white p-[30px] text-[color:var(--ink)] shadow-[0_25px_80px_rgba(20,17,28,0.23)]',
                    className
                )}
                {...props}
            >
                {children}
                <Primitive.Close
                    className="modal-close absolute right-[18px] top-[18px] border-0 bg-transparent text-[#99969e]"
                    aria-label="关闭"
                >
                    <X size={18} />
                </Primitive.Close>
            </Primitive.Content>
        </Primitive.Portal>
    )
}
