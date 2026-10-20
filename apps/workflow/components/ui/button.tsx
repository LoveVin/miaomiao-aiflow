'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ClassValue, clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
const variants = cva(
    'button inline-flex h-9 items-center justify-center gap-[7px] whitespace-nowrap rounded-lg border border-[color:var(--line)] px-[14px] py-0 text-[11px] font-[650] no-underline',
    {
        variants: {
            variant: {
                default:
                    'border-[color:var(--orange)] bg-[var(--orange)] text-white shadow-[0_5px_14px_rgba(101,88,232,0.2)] hover:bg-[#5548d5]',
                outline: 'bg-white text-[#4a4750] hover:border-[#ccc9d1]',
                ghost: 'border-0 bg-transparent',
                destructive: 'border-[#c94f5b] bg-[#c94f5b] text-white hover:bg-[#b7434e]',
            },
            size: { default: '', icon: 'icon-button' },
        },
        defaultVariants: { variant: 'default', size: 'default' },
    }
)
export function Button({
    className,
    variant,
    size,
    asChild,
    ...props
}: ComponentProps<'button'> & VariantProps<typeof variants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(variants({ variant, size }), className)} {...props} />
}
