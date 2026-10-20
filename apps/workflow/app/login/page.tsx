'use client'

import { Database, Plug, Sparkles, Workflow } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

import { PawPrint, PortalButton, PortalDialog, useLocalData } from '@/components/shared'
import { createDemoProfile, initialProfile } from '@/mocks/session'

const brandMarkClass =
    'grid size-8 shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(145deg,#7b70f4,#5849d9)] text-white shadow-[0_6px_15px_rgba(101,88,232,0.2)]'
const labelClass = 'flex flex-col gap-[7px] text-[10px] font-[650] text-[#4d5063]'
const inputClass =
    'h-[42px] w-full rounded-[9px] border border-[#dfe1ea] bg-white px-3 text-[10px] text-[var(--ink)] outline-none transition-all duration-200 focus:border-[#8e84ef] focus:shadow-[0_0_0_3px_#efedff]'

export default function LoginPage() {
    const router = useRouter()
    const [registering, setRegistering] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [notice, setNotice] = useState('')
    const [, setProfile] = useLocalData('miaomiao.profile.v1', initialProfile)
    function enter(event?: FormEvent) {
        event?.preventDefault()
        setProfile(createDemoProfile(name, email))
        router.push('/')
    }
    return (
        <main className="grid min-h-screen grid-cols-[minmax(460px,1.05fr)_minmax(500px,0.95fr)] bg-white max-[980px]:grid-cols-1">
            <section className="relative flex flex-col overflow-hidden bg-[linear-gradient(145deg,#211b52,#4135a4_58%,#5d52d9)] px-12 py-[38px] text-white before:absolute before:-bottom-[150px] before:-right-[170px] before:size-[420px] before:rounded-full before:bg-[radial-gradient(circle,rgba(166,153,255,0.32),rgba(166,153,255,0)_70%)] before:content-[''] max-[980px]:hidden">
                <div className="relative z-[2] flex items-center gap-[11px]">
                    <span className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-white/18 bg-white/14 text-white">
                        <PawPrint size={25} />
                    </span>
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
                        <span className={brandMarkClass}>
                            <PawPrint size={21} />
                        </span>
                        <strong>喵喵AI引擎</strong>
                    </div>
                    <span className="text-[8px] font-extrabold tracking-[1.8px] text-[var(--orange)]">
                        {registering ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
                    </span>
                    <h2 className="mb-[7px] mt-[9px] text-[27px] tracking-[-0.8px] text-[var(--ink)]">
                        {registering ? '创建你的账号' : '欢迎回来'}
                    </h2>
                    <p className="mb-7 mt-0 text-[10px] text-[#9094a7]">
                        {registering ? '注册后即可开始构建 AI 应用' : '登录后继续构建你的 AI 应用'}
                    </p>
                    <form className="flex flex-col gap-4" onSubmit={enter}>
                        {registering && (
                            <label className={labelClass}>
                                用户名
                                <input
                                    className={inputClass}
                                    required
                                    placeholder="请输入你的名字"
                                    autoComplete="nickname"
                                    value={name}
                                    onChange={event => setName(event.target.value)}
                                />
                            </label>
                        )}
                        <label className={labelClass}>
                            邮箱
                            <input
                                className={inputClass}
                                required
                                type="email"
                                placeholder="name@example.com"
                                autoComplete="email"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                            />
                        </label>
                        <label className={labelClass}>
                            <span className="flex items-center justify-between">
                                密码
                                {!registering && (
                                    <button
                                        className="border-0 bg-transparent p-0 text-[9px] text-[var(--orange)]"
                                        type="button"
                                        onClick={() =>
                                            setNotice(
                                                '当前为本地演示，没有真实账号或密码，也不会发送密码重置邮件。请使用“体验演示账号”进入。'
                                            )
                                        }
                                    >
                                        忘记密码？
                                    </button>
                                )}
                            </span>
                            <div className="flex h-[42px] w-full items-center rounded-[9px] border border-[#dfe1ea] bg-white pr-2.5 outline-none transition-all duration-200 focus-within:border-[#8e84ef] focus-within:shadow-[0_0_0_3px_#efedff]">
                                <input
                                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[10px] text-[var(--ink)] outline-none"
                                    required
                                    minLength={registering ? 8 : 1}
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={registering ? 'new-password' : 'current-password'}
                                    placeholder={registering ? '至少 8 位字符' : '请输入密码'}
                                />
                                <button
                                    className="border-0 bg-transparent text-[9px] text-[#777b8f]"
                                    type="button"
                                    onClick={() => setShowPassword(old => !old)}
                                >
                                    {showPassword ? '隐藏' : '显示'}
                                </button>
                            </div>
                        </label>
                        {registering && (
                            <label className="flex items-center gap-2 text-[9px] font-normal text-[#898da0]">
                                <input className="accent-[var(--orange)]" type="checkbox" required />
                                <span>我已阅读并同意《服务协议》和《隐私政策》</span>
                            </label>
                        )}
                        <PortalButton primary type="submit" className="mt-0.5 h-[42px] w-full">
                            {registering ? '创建账号（演示）' : '登录（演示）'}
                        </PortalButton>
                    </form>
                    <div className="flex h-[35px] items-center text-[8px] text-[#afb2c0] before:h-px before:flex-1 before:bg-[var(--line)] before:content-[''] after:h-px after:flex-1 after:bg-[var(--line)] after:content-['']">
                        <span className="px-2.5">或</span>
                    </div>
                    <PortalButton className="h-10 w-full" onClick={() => enter()}>
                        <Sparkles size={16} />
                        体验演示账号
                    </PortalButton>
                    <p className="mb-0 mt-5 text-center text-[9px] text-[#9094a7]">
                        {registering ? '已有账号？' : '还没有账号？'}
                        <button
                            className="border-0 bg-transparent pl-[5px] text-[9px] font-bold text-[var(--orange)]"
                            onClick={() => setRegistering(old => !old)}
                        >
                            {registering ? '直接登录' : '免费注册'}
                        </button>
                    </p>
                    <p className="mb-7 mt-5 text-[10px] leading-[1.7] text-[#9094a7]">
                        当前为本地原型体验，不进行身份认证，不保存或发送密码。请勿输入真实密码。
                    </p>
                </div>
            </section>
            <PortalDialog open={!!notice} onOpenChange={() => setNotice('')} title="演示账号说明" description={notice}>
                <PortalButton onClick={() => setNotice('')}>知道了</PortalButton>
            </PortalDialog>
        </main>
    )
}
