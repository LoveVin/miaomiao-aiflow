'use client'

import './portal.css'

import * as Menu from '@radix-ui/react-dropdown-menu'
import { Bell, BookOpen, ChevronDown, CircleHelp, PanelsTopLeft, Plug, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { initialProfile } from '@/mocks/session'
import { readMockStorage, writeMockStorage } from '@/mocks/storage'

export const portalMenuClass =
    'portal-menu z-[60] min-w-[130px] rounded-[9px] border border-[var(--line)] bg-white p-[5px] shadow-[var(--shadow)] [&_[role=menuitem]]:cursor-pointer [&_[role=menuitem]]:rounded-[5px] [&_[role=menuitem]]:px-3 [&_[role=menuitem]]:py-[9px] [&_[role=menuitem]]:text-[11px] [&_[role=menuitem]]:outline-none [&_[role=menuitem]:focus]:bg-[var(--orange-soft)]'
export const portalTabsClass =
    "tabs flex gap-[29px] max-[760px]:gap-[18px] [&_button]:relative [&_button]:h-[38px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-[11px] [&_button]:text-[#8d8a93] [&_[data-state=active]]:font-bold [&_[data-state=active]]:text-[#29262d] [&_[data-state=active]]:after:absolute [&_[data-state=active]]:after:inset-x-0 [&_[data-state=active]]:after:-bottom-px [&_[data-state=active]]:after:h-0.5 [&_[data-state=active]]:after:bg-[var(--orange)] [&_[data-state=active]]:after:content-[''] [&_button_span]:ml-[3px] [&_button_span]:text-[#aaa7af]"
export const fieldLabelClass = 'mb-[7px] block text-[10px] font-[650]'
export const textFieldClass =
    'h-10 w-full rounded-lg border border-[#dedce2] px-3 text-[11px] outline-none focus:border-[var(--orange)] focus:shadow-[0_0_0_3px_var(--orange-soft)]'
export const textAreaClass =
    'h-[78px] w-full resize-none rounded-lg border border-[#dedce2] px-3 py-2.5 text-[11px] outline-none focus:border-[var(--orange)] focus:shadow-[0_0_0_3px_var(--orange-soft)]'
export const modalActionsClass = 'mt-[25px] flex justify-end gap-2'
export const emptyStateClass = 'col-span-full p-12 text-center text-xs text-[var(--muted)]'
export const demoNoteClass = 'text-[9px] leading-[1.7] text-[#9699ab]'
export const avatarClass =
    'avatar inline-grid size-[30px] shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#dedaff,#a99ff7)] text-[11px] font-extrabold text-[#4237a1]'
export const colorClasses: Record<string, string> = {
    coral: 'bg-[#ece9ff] text-[#5e50d8]',
    violet: 'bg-[#eeeaff] text-[#7359d5]',
    blue: 'bg-[#e5f0ff] text-[#4a81d5]',
    pink: 'bg-[#ffe7f1] text-[#cf5b86]',
    green: 'bg-[#e4f7ef] text-[#3f9e7c]',
    amber: 'bg-[#fff1d7] text-[#c1872b]',
}
const brandMarkClass =
    'grid size-8 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(145deg,#7b70f4,#5849d9)] text-white shadow-[0_6px_15px_rgba(101,88,232,0.2)]'

export function PawPrint({ size = 23 }: { size?: number; fill?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <ellipse cx="12" cy="15.5" rx="5.2" ry="4.5" />
            <ellipse cx="5.7" cy="11" rx="2.1" ry="2.8" transform="rotate(-28 5.7 11)" />
            <ellipse cx="9.3" cy="6.7" rx="2.1" ry="2.8" transform="rotate(-8 9.3 6.7)" />
            <ellipse cx="14.7" cy="6.7" rx="2.1" ry="2.8" transform="rotate(8 14.7 6.7)" />
            <ellipse cx="18.3" cy="11" rx="2.1" ry="2.8" transform="rotate(28 18.3 11)" />
        </svg>
    )
}

export function useLocalData<T>(key: string, initial: T) {
    const [value, setValue] = useState(initial)
    const current = useRef(initial)
    useEffect(() => {
        current.current = readMockStorage(key, initial)
        setValue(current.current)
        // Defaults are only used when the storage key changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])
    function update(next: T | ((old: T) => T)) {
        const result = typeof next === 'function' ? (next as (old: T) => T)(current.current) : next
        current.current = result
        setValue(result)
        writeMockStorage(key, result)
    }
    return [value, update] as const
}

export function PortalButton({
    children,
    primary = false,
    className = '',
    ...props
}: ComponentProps<typeof Button> & { primary?: boolean }) {
    return (
        <Button variant={primary ? 'default' : 'outline'} className={className} {...props}>
            {children}
        </Button>
    )
}

export function PortalDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    className = '',
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    children: ReactNode
    className?: string
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`portal-modal ${className}`}>
                <DialogTitle className="mb-[7px] mt-0 text-xl">{title}</DialogTitle>
                {description && <DialogDescription className="mb-[22px] mt-0 text-[11px] text-[#918e97]">{description}</DialogDescription>}
                {children}
            </DialogContent>
        </Dialog>
    )
}

export function SearchField({
    value,
    onChange,
    placeholder = '搜索应用',
}: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}) {
    return (
        <label className="portal-search mb-[7px] flex h-[31px] w-[190px] items-center gap-[7px] rounded-lg border border-[var(--line)] bg-white px-[9px] text-[#9b98a0]">
            <Search size={15} />
            <input
                className="min-w-0 w-full border-0 bg-transparent text-[11px] text-[var(--ink)] outline-none"
                aria-label={placeholder}
                placeholder={placeholder}
                value={value}
                onChange={event => onChange(event.target.value)}
            />
        </label>
    )
}

export function Hero({
    eyebrow,
    title,
    description,
    children,
}: {
    eyebrow: string
    title: string
    description: string
    children?: ReactNode
}) {
    return (
        <div className="hero-row mb-9 flex items-end justify-between max-[760px]:items-center max-[760px]:gap-[15px] max-[480px]:[&>.button]:px-2.5">
            <div>
                <div className="mb-2.5 flex items-center gap-2 text-[9px] font-bold tracking-[1.8px] text-[#aaa7ae]">
                    <span className="h-0.5 w-[17px] bg-[var(--orange)]" />
                    {eyebrow}
                </div>
                <h1 className="mb-2 mt-0 text-[30px] leading-[1.2] tracking-[-1px] text-[#26232b] max-[760px]:text-[25px]">{title}</h1>
                <p className="m-0 text-[13px] text-[#8b8891] max-[760px]:text-[11px] max-[760px]:leading-[1.6]">{description}</p>
            </div>
            {children}
        </div>
    )
}

export function PortalShell({ children }: { children: ReactNode }) {
    const path = usePathname()
    const [message, setMessage] = useState('')
    const [profile] = useLocalData('miaomiao.profile.v1', initialProfile)
    return (
        <div className="portal app-shell text-[var(--ink)]">
            <header className="sidebar fixed inset-x-0 top-0 z-10 flex h-[54px] items-center border-b border-[var(--line)] bg-white/96 px-6 shadow-[0_4px_20px_rgba(40,43,78,0.04)] max-[760px]:px-3">
                <Link
                    className="brand flex w-[184px] items-center gap-[9px] text-[var(--ink)] no-underline max-[760px]:mr-4 max-[760px]:w-auto"
                    href="/"
                >
                    <span className={brandMarkClass}>
                        <PawPrint size={23} fill="currentColor" />
                    </span>
                    <strong className="text-[15px] tracking-[-0.4px] max-[760px]:hidden">喵喵AI引擎</strong>
                </Link>
                <nav className="side-nav flex gap-1" aria-label="主导航">
                    {[
                        { href: '/', label: '工作室', icon: PanelsTopLeft },
                        { href: '/knowledge', label: '知识库', icon: BookOpen },
                        { href: '/plugins', label: '插件市场', icon: Plug },
                    ].map(item => {
                        const active = item.href === '/' ? path === '/' : path.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                className={`nav-item flex h-[34px] min-w-[88px] items-center justify-center gap-[7px] rounded-lg px-3 text-xs font-[550] no-underline transition-all duration-200 hover:bg-[#f5f4ff] hover:text-[#4e46a8] max-[760px]:min-w-0 max-[760px]:px-2 max-[760px]:text-[11px] ${active ? 'active bg-[#f0eeff] text-[#4f43c7]' : 'text-[#72768a]'}`}
                                href={item.href}
                            >
                                <item.icon size={18} />
                                {item.label}
                                {item.href === '/plugins' && (
                                    <em className="rounded-[10px] bg-[#ebe9ff] px-1.5 py-0.5 text-[10px] not-italic text-[#6558c9]">12</em>
                                )}
                            </Link>
                        )
                    })}
                </nav>
                <div className="side-bottom relative ml-auto flex items-center">
                    <div className="header-utilities mr-[14px] flex gap-0.5 border-r border-[var(--line)] pr-[14px] max-[760px]:hidden">
                        <button
                            className="relative grid size-8 place-items-center border-0 bg-transparent text-[#88858e]"
                            aria-label="帮助中心"
                            onClick={() =>
                                setMessage(
                                    '这是本地演示空间。你可以创建应用、管理知识文档、添加插件；所有更改仅保存在当前浏览器，不会调用真实 AI 或云端服务。'
                                )
                            }
                        >
                            <CircleHelp size={18} />
                        </button>
                        <button
                            className="relative grid size-8 place-items-center border-0 bg-transparent text-[#88858e]"
                            aria-label="消息通知"
                            onClick={() => setMessage('暂无新消息。当前空间中的初始应用和动态均为演示数据。')}
                        >
                            <Bell size={18} />
                            <i className="absolute right-[5px] top-[5px] size-[5px] rounded-full border border-white bg-[var(--orange)]" />
                        </button>
                    </div>
                    <Menu.Root>
                        <Menu.Trigger className="workspace-switcher flex cursor-pointer list-none items-center gap-2 border-0 bg-transparent text-[var(--ink)]">
                            <span className={avatarClass}>{profile.name.slice(0, 1)}</span>
                            <strong className="text-[11px] max-[760px]:hidden">{profile.name}</strong>
                            <ChevronDown size={14} />
                        </Menu.Trigger>
                        <Menu.Portal>
                            <Menu.Content
                                className={`${portalMenuClass} account-menu w-60 max-w-[calc(100vw-24px)] text-[var(--ink)] [&_[role=menuitem]]:flex [&_[role=menuitem]]:min-h-9 [&_[role=menuitem]]:items-center [&_[role=menuitem]]:text-inherit [&_[role=menuitem]]:no-underline`}
                                align="end"
                                sideOffset={12}
                                collisionPadding={12}
                            >
                                <div className="mb-[5px] flex flex-col gap-[5px] border-b border-[var(--line)] px-3 pb-[14px] pt-2.5">
                                    <strong className="text-[13px] font-semibold leading-normal [overflow-wrap:anywhere]">
                                        {profile.name}
                                    </strong>
                                    <small className="text-[11px] leading-normal text-[#9296a8] [overflow-wrap:anywhere]">
                                        {profile.email}
                                    </small>
                                </div>
                                <Menu.Item onSelect={() => setMessage('本地演示账号，无远程账户设置。可退出后使用其他名字重新体验。')}>
                                    账号设置
                                </Menu.Item>
                                <Menu.Item asChild>
                                    <Link href="/login">退出演示 / 登录</Link>
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Portal>
                    </Menu.Root>
                </div>
            </header>
            <div className="main-shell flex min-h-screen flex-col pt-[54px]">
                <main className="page-content mx-auto w-[min(1130px,calc(100%-76px))] flex-1 pb-10 pt-[46px] max-[760px]:w-[calc(100%-32px)] max-[760px]:pt-[30px] [&:has(.kb-detail-layout)]:flex [&:has(.kb-detail-layout)]:h-[calc(100dvh-54px)] [&:has(.kb-detail-layout)]:min-h-0 [&:has(.kb-detail-layout)]:w-[calc(100%-48px)] [&:has(.kb-detail-layout)]:flex-none [&:has(.kb-detail-layout)]:flex-col [&:has(.kb-detail-layout)]:overflow-hidden [&:has(.kb-detail-layout)]:py-[14px]">
                    {children}
                </main>
            </div>
            <PortalDialog open={!!message} onOpenChange={() => setMessage('')} title="演示空间说明" description={message}>
                <PortalButton onClick={() => setMessage('')}>知道了</PortalButton>
            </PortalDialog>
        </div>
    )
}
