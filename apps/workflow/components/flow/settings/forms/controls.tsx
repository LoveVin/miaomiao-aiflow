'use client'

import { Check, ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

const controlClass =
    'w-full rounded-[7px] border border-[#e0e3ee] bg-white px-[10px] py-[8px] text-[11px] leading-[1.6] text-[#60657b] outline-none focus:border-[#a293eb] focus:shadow-[0_0_0_3px_#f2efff]'

export function Field({
    label,
    htmlFor,
    required = false,
    help,
    error,
    children,
    className = '',
}: {
    label?: ReactNode
    htmlFor?: string
    required?: boolean
    help?: ReactNode
    error?: string
    children: ReactNode
    className?: string
}) {
    return (
        <div className={`flex flex-col gap-2 text-[10px] font-[550] text-[#63687d] ${className}`}>
            {label ? (
                <label className="text-[10px] font-[550] text-[#63687d]" htmlFor={htmlFor}>
                    {label}
                    {required ? <span className="text-[#c94f5b]"> *</span> : null}
                </label>
            ) : null}
            {children}
            {help && !error ? <small className="font-normal leading-[1.7] text-[#a2a6b9]">{help}</small> : null}
            {error ? <small className="font-normal text-[#c94f5b]">{error}</small> : null}
        </div>
    )
}

export function TextInput({ className = '', ...props }: ComponentProps<'input'>) {
    return <input className={`${controlClass} h-9 ${className}`} {...props} />
}

export function TextareaInput({ className = '', ...props }: ComponentProps<'textarea'>) {
    return <textarea className={`${controlClass} min-h-[72px] resize-y ${className}`} {...props} />
}

export function SelectInput<T extends string>({
    id,
    value,
    options,
    onChange,
}: {
    id?: string
    value: T
    options: { value: T; label: string }[]
    onChange: (value: T) => void
}) {
    return (
        <div className="relative">
            <select
                className={`${controlClass} h-9 cursor-pointer appearance-none pr-8`}
                id={id}
                value={value}
                onChange={event => onChange(event.target.value as T)}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-[#a2a6b9]" size={14} />
        </div>
    )
}

export function CheckboxInput({ className = '', ...props }: ComponentProps<'input'>) {
    return <input className={`size-[14px] cursor-pointer accent-[#7664d5] ${className}`} type="checkbox" {...props} />
}

export function CheckboxField({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean
    onChange: (checked: boolean) => void
    label: string
    description?: string
}) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#e7e8f0] p-3 text-[10px] text-[#82879d]">
            <span>
                {label}
                {description ? <small className="mt-[4px] block text-[9px] text-[#a4a8b9]">{description}</small> : null}
            </span>
            <CheckboxInput checked={checked} onChange={event => onChange(event.target.checked)} />
        </label>
    )
}

export function ListHeader({ title, action }: { title: string; action?: ReactNode }) {
    return (
        <div className="flex items-center justify-between text-[10px] font-[650] text-[#555a70]">
            <h3 className="m-0">{title}</h3>
            {action}
        </div>
    )
}

export function EmptyList({ title, description }: { title: string; description?: string }) {
    return (
        <div className="rounded-lg border border-dashed border-[#ddd9ef] px-4 py-6 text-center text-[10px] leading-[1.8] text-[#a2a6b9]">
            <p className="m-0">{title}</p>
            {description ? <p className="m-0">{description}</p> : null}
        </div>
    )
}

export function SelectedCheck({ checked }: { checked: boolean }) {
    return (
        <span className={`grid size-4 place-items-center rounded-full ${checked ? 'bg-[#7664d5] text-white' : 'border border-[#d5d7e2]'}`}>
            {checked ? <Check size={10} /> : null}
        </span>
    )
}
