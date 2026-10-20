'use client'

import {
    BookOpen,
    Bot,
    Check,
    Code,
    Database,
    FileText,
    Folder,
    GraduationCap,
    Layers,
    PanelsTopLeft,
    Plug,
    Search,
    Sparkles,
    Workflow,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { colorClasses, fieldLabelClass, PawPrint } from '@/components/shared'

const icons = {
    spark: Sparkles,
    bot: Bot,
    flow: Workflow,
    book: BookOpen,
    code: Code,
    paw: PawPrint,
    database: Database,
    plug: Plug,
    api: Code,
    file: FileText,
    search: Search,
    studio: PanelsTopLeft,
    folder: Folder,
    layers: Layers,
    graduation: GraduationCap,
}

export const appIconOptions = [
    { icon: 'spark', label: '智能', color: 'violet' },
    { icon: 'bot', label: '助手', color: 'blue' },
    { icon: 'flow', label: '流程', color: 'green' },
    { icon: 'book', label: '知识', color: 'amber' },
    { icon: 'code', label: '代码', color: 'pink' },
    { icon: 'paw', label: '品牌', color: 'coral' },
    { icon: 'database', label: '数据', color: 'blue' },
    { icon: 'plug', label: '插件', color: 'violet' },
    { icon: 'api', label: '接口', color: 'green' },
    { icon: 'file', label: '文档', color: 'amber' },
    { icon: 'search', label: '搜索', color: 'blue' },
    { icon: 'studio', label: '应用', color: 'pink' },
]

export const knowledgeIconOptions = [
    { icon: 'book', label: '知识', color: 'violet' },
    { icon: 'folder', label: '文件夹', color: 'blue' },
    { icon: 'file', label: '文档', color: 'green' },
    { icon: 'layers', label: '图层', color: 'pink' },
    { icon: 'graduation', label: '学习', color: 'amber' },
    { icon: 'database', label: '数据', color: 'coral' },
    { icon: 'search', label: '搜索', color: 'blue' },
    { icon: 'book', label: '手册', color: 'green' },
]

export function RecordIcon({ icon, size = 20, fallback }: { icon?: string; size?: number; fallback: ReactNode }) {
    const Icon = icon && Object.hasOwn(icons, icon) ? icons[icon as keyof typeof icons] : undefined
    return Icon ? <Icon size={size} /> : <>{icon || fallback}</>
}

export function IconPicker({
    label,
    options,
    value,
    onChange,
    className = '',
}: {
    label: string
    options: typeof appIconOptions
    value: (typeof appIconOptions)[number]
    onChange: (value: (typeof appIconOptions)[number]) => void
    className?: string
}) {
    return (
        <fieldset className={`m-0 mt-[15px] min-w-0 border-0 p-0 ${className}`}>
            <legend className={fieldLabelClass}>{label}</legend>
            <div className="grid grid-cols-6 gap-[7px]">
                {options.map(option => {
                    const selected = value.icon === option.icon && value.color === option.color
                    return (
                        <button
                            key={`${option.icon}-${option.color}`}
                            type="button"
                            title={option.label}
                            aria-label={option.label}
                            aria-pressed={selected}
                            onClick={() => onChange(option)}
                            className="relative flex h-[42px] items-center justify-center border-0 bg-transparent text-[#898c9c] outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[#8f84eb]"
                        >
                            <span
                                className={`grid size-[30px] place-items-center rounded-lg ${colorClasses[option.color]} ${selected ? 'shadow-[0_0_0_2px_white,0_0_0_4px_#8f84eb]' : ''}`}
                            >
                                <RecordIcon icon={option.icon} size={18} fallback={null} />
                            </span>
                            {selected && (
                                <i className="absolute right-[5px] top-px grid size-[14px] place-items-center rounded-full border-2 border-white bg-[var(--orange)] text-white not-italic">
                                    <Check size={10} />
                                </i>
                            )}
                        </button>
                    )
                })}
            </div>
        </fieldset>
    )
}
