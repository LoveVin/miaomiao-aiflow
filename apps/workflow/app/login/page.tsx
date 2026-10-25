'use client'

import { Database, Eye, EyeOff, Plug, Sparkles, Workflow } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

import { brandLogoClass, PortalButton, PortalDialog } from '@/components/shared'
const labelClass = 'flex flex-col gap-[7px] text-[12px] font-[650] text-[#4d5063]'
const inputClass =
    'h-[44px] w-full rounded-[9px] border border-[#dfe1ea] bg-white px-3 text-[13px] text-[var(--ink)] outline-none! transition-all duration-200 focus-visible:outline-none! focus:border-[#8e84ef] focus:shadow-[0_0_0_3px_#efedff]'

export default function LoginPage() {
    const router = useRouter()
    const [registering, setRegistering] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [notice, setNotice] = useState('')
    async function enter(event?: FormEvent) {
        event?.preventDefault()
        if (registering && password !== confirmPassword) {
            setNotice('两次输入的密码不一致')
            return
        }
        const endpoint = registering ? '/api/auth/register' : '/api/auth/login'
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password }),
        })
        const result = await response.json()
        if (!response.ok || !result.success) {
            setNotice(result.message ?? '操作失败')
            return
        }
        const nextPath = new URLSearchParams(window.location.search).get('next')
        router.push(nextPath?.startsWith('/') ? nextPath : '/')
        router.refresh()
    }
    return (
        <main className="grid min-h-screen grid-cols-[minmax(460px,1.05fr)_minmax(500px,0.95fr)] bg-white max-[980px]:grid-cols-1">
            <section className="relative flex flex-col overflow-hidden bg-[linear-gradient(145deg,#211b52,#4135a4_58%,#5d52d9)] px-12 py-[38px] text-white before:absolute before:-bottom-[150px] before:-right-[170px] before:size-[420px] before:rounded-full before:bg-[radial-gradient(circle,rgba(166,153,255,0.32),rgba(166,153,255,0)_70%)] before:content-[''] max-[980px]:hidden">
                <div className="relative z-[2] flex items-center gap-[11px]">
                    <img alt="" className={brandLogoClass} height={32} src="/logo.svg" width={32} />
                    <strong className="text-base">喵喵AI引擎</strong>
                </div>
                <div className="relative z-[2] my-auto max-w-[530px]">
                    <span className="flex h-[30px] w-fit items-center gap-[7px] rounded-2xl border border-white/14 bg-white/10 px-3 text-[9px] tracking-[0.5px] text-[#dcd8ff]">
                        <Sparkles size={15} />
                        新一代 AI 应用编排平台
                    </span>
                    <h1 className="mb-[18px] mt-6 text-[clamp(36px,4vw,58px)] leading-[1.2] tracking-[-2.5px] text-white">
                        让每一个 AI 创意，
                        <br />
                        都能快速落地。
                    </h1>
                    <p className="max-w-[450px] text-sm leading-[1.8] text-white/62">
                        连接模型、知识与工具，用可视化流程构建属于你的智能应用。
                    </p>
                    <div className="mt-[42px] flex gap-[22px] [&>span]:flex [&>span]:flex-col [&>span]:gap-[9px] [&>span]:text-[9px] [&>span]:text-white/75 [&_i]:grid [&_i]:size-[34px] [&_i]:place-items-center [&_i]:rounded-[9px] [&_i]:bg-white/10 [&_i]:not-italic [&_i]:text-[#d5d0ff]">
                        <span>
                            <i>
                                <Workflow size={17} />
                            </i>
                            可视化流程编排
                        </span>
                        <span>
                            <i>
                                <Database size={17} />
                            </i>
                            企业级知识库
                        </span>
                        <span>
                            <i>
                                <Plug size={17} />
                            </i>
                            丰富插件生态
                        </span>
                    </div>
                </div>
                <div className="absolute -right-[180px] top-[10%] size-[430px] rounded-full border border-white/8" />
                <div className="absolute -right-[90px] top-[26%] size-[260px] rounded-full border border-white/8" />
            </section>
            <section className="relative flex flex-col items-center justify-center bg-[#fbfbfe] p-[45px] max-[980px]:min-h-screen max-[760px]:p-8">
                <div className="w-[min(380px,100%)]">
                    <div className="mb-9 hidden items-center gap-[9px] max-[980px]:flex">
                        <img alt="" className={brandLogoClass} height={32} src="/logo.svg" width={32} />
                        <strong>喵喵AI引擎</strong>
                    </div>
                    <span className="text-[8px] font-extrabold tracking-[1.8px] text-[var(--orange)]">
                        {registering ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
                    </span>
                    <h2 className="mb-7 mt-[9px] text-[27px] tracking-[-0.8px] text-[var(--ink)]">
                        {registering ? '创建你的账号' : '欢迎回来'}
                    </h2>
                    <form className="flex flex-col gap-4" onSubmit={enter}>
                        <label className={labelClass}>
                            用户名
                            <input
                                className={inputClass}
                                required
                                placeholder={registering ? '请输入用户名' : '请输入登录用户名'}
                                autoComplete="username"
                                value={name}
                                onChange={event => setName(event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            <span className="flex items-center justify-between">密码</span>
                            <div className="flex h-[44px] w-full items-center rounded-[9px] border border-[#dfe1ea] bg-white pr-2.5 transition-all duration-200 focus-within:border-[#8e84ef] focus-within:shadow-[0_0_0_3px_#efedff]">
                                <input
                                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-[var(--ink)] outline-none! focus-visible:outline-none!"
                                    required
                                    minLength={registering ? 8 : 1}
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={registering ? 'new-password' : 'current-password'}
                                    value={password}
                                    onChange={event => setPassword(event.target.value)}
                                    placeholder={registering ? '至少 8 位字符' : '请输入密码'}
                                />
                                <button
                                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                                    className="grid size-8 shrink-0 place-items-center rounded-[7px] border-0 bg-transparent text-[#777b8f] transition-colors hover:text-[#5548d5] focus-visible:outline-none! focus-visible:outline-offset-0"
                                    type="button"
                                    onClick={() => setShowPassword(old => !old)}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </label>
                        {registering && (
                            <label className={labelClass}>
                                确认密码
                                <div className="flex h-[44px] w-full items-center rounded-[9px] border border-[#dfe1ea] bg-white pr-2.5 transition-all duration-200 focus-within:border-[#8e84ef] focus-within:shadow-[0_0_0_3px_#efedff]">
                                    <input
                                        className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-[var(--ink)] outline-none! focus-visible:outline-none!"
                                        required
                                        minLength={8}
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={event => setConfirmPassword(event.target.value)}
                                        placeholder="请再次输入密码"
                                    />
                                    <button
                                        aria-label={showPassword ? '隐藏确认密码' : '显示确认密码'}
                                        className="grid size-8 shrink-0 place-items-center rounded-[7px] border-0 bg-transparent text-[#777b8f] transition-colors hover:text-[#5548d5] focus-visible:outline-none! focus-visible:outline-offset-0"
                                        type="button"
                                        onClick={() => setShowPassword(old => !old)}
                                    >
                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </label>
                        )}
                        <PortalButton primary type="submit" className="mt-0.5 h-[44px] w-full text-[13px]!">
                            {registering ? '创建账号' : '登录'}
                        </PortalButton>
                    </form>
                    <p className="mb-0 mt-5 text-center text-[12px] text-[#9094a7]">
                        {registering ? '已有账号？' : '还没有账号？'}
                        <button
                            className="border-0 bg-transparent pl-[5px] text-[12px] font-bold text-[var(--orange)]"
                            onClick={() => setRegistering(old => !old)}
                        >
                            {registering ? '直接登录' : '免费注册'}
                        </button>
                    </p>
                </div>
            </section>
            <PortalDialog open={!!notice} onOpenChange={() => setNotice('')} title="提示" description={notice}>
                <PortalButton onClick={() => setNotice('')}>知道了</PortalButton>
            </PortalDialog>
        </main>
    )
}
