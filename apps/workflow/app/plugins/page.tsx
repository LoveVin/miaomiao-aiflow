'use client'

import * as Tabs from '@radix-ui/react-tabs'
import { Check, Code } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import {
    avatarClass,
    colorClasses,
    demoNoteClass,
    emptyStateClass,
    fieldLabelClass,
    Hero,
    modalActionsClass,
    PortalButton,
    PortalDialog,
    PortalShell,
    portalTabsClass,
    SearchField,
    textAreaClass,
    textFieldClass,
    useLocalData,
} from '@/components/shared'
import { initialInstalledPlugins, initialPlugins } from '@/mocks/plugins'

export default function PluginsPage() {
    const [plugins, setPlugins] = useLocalData('miaomiao.plugins.v1', initialPlugins)
    const [installed, setInstalled] = useLocalData('miaomiao.installed-plugins.v1', initialInstalledPlugins)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('精选')
    const [modal, setModal] = useState(false)
    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const [error, setError] = useState('')
    function create(event: FormEvent) {
        event.preventDefault()
        if (!name.trim()) return
        if (plugins.some(plugin => plugin.name === name.trim())) {
            setError('此插件名称已存在，请使用其他名称。')
            return
        }
        setPlugins(old => [
            ...old,
            {
                name: name.trim(),
                desc: desc || '自定义工具配置 · 尚未连接执行服务',
                icon: '</>',
                color: 'violet',
                tag: '自定义',
                category: '效率工具',
            },
        ])
        setInstalled(old => [...old, name.trim()])
        setName('')
        setDesc('')
        setError('')
        setModal(false)
        setCategory('精选')
    }
    const visible = plugins.filter(
        plugin =>
            (category === '精选' || (category === '已安装' && installed.includes(plugin.name)) || plugin.category === category) &&
            `${plugin.name}${plugin.desc}`.includes(search)
    )
    return (
        <PortalShell>
            <Hero eyebrow="PLUGIN MARKETPLACE" title="插件市场" description="接入丰富工具，让你的 AI 应用拥有更强大的行动能力。">
                <PortalButton onClick={() => setModal(true)}>
                    <Code size={16} />
                    创建自定义插件
                </PortalButton>
            </Hero>
            <div className="mb-5 flex items-end justify-between border-b border-[var(--line)] max-[760px]:flex-wrap">
                <Tabs.Root value={category} onValueChange={setCategory}>
                    <Tabs.List className={portalTabsClass} aria-label="插件分类">
                        {['精选', '效率工具', '内容创作', '数据分析', '已安装'].map(item => (
                            <Tabs.Trigger key={item} value={item}>
                                {item}
                            </Tabs.Trigger>
                        ))}
                    </Tabs.List>
                </Tabs.Root>
                <SearchField value={search} onChange={setSearch} placeholder="搜索插件" />
            </div>
            <div className="grid grid-cols-3 gap-[14px] max-[1180px]:grid-cols-2 max-[480px]:grid-cols-1">
                {visible.map(plugin => (
                    <article
                        className="rounded-xl border border-[var(--line)] bg-white p-[18px] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[var(--shadow)]"
                        key={plugin.name}
                    >
                        <div className="flex items-start justify-between">
                            <span
                                className={`grid size-[42px] place-items-center rounded-[11px] text-xs font-extrabold ${colorClasses[plugin.color]}`}
                            >
                                {plugin.icon}
                            </span>
                            <span className="rounded-[5px] bg-[#f3f2f4] px-[7px] py-[3px] text-[8px] text-[#8e8b93]">{plugin.tag}</span>
                        </div>
                        <h3 className="mb-[7px] mt-[15px] text-[13px]">{plugin.name}</h3>
                        <p className="m-0 min-h-8 text-[10px] leading-[1.6] text-[#8d8a93]">{plugin.desc}</p>
                        <div className="mt-[15px] flex items-center justify-between border-t border-[#efedf1] pt-[13px] [&_.avatar]:size-[19px] [&_.avatar]:text-[7px] [&_.button]:h-7 [&_.button]:px-2.5 [&_.button]:text-[9px]">
                            <span className="flex items-center gap-1.5 text-[9px] text-[#99969e]">
                                <span className={avatarClass}>喵</span>
                                {plugin.tag === '自定义' ? '我的插件' : '喵喵官方'}
                            </span>
                            <PortalButton
                                primary={!installed.includes(plugin.name)}
                                aria-label={`${installed.includes(plugin.name) ? '卸载' : '安装'}${plugin.name}`}
                                onClick={() =>
                                    setInstalled(old =>
                                        old.includes(plugin.name) ? old.filter(name => name !== plugin.name) : [...old, plugin.name]
                                    )
                                }
                            >
                                {installed.includes(plugin.name) && <Check size={12} />}{' '}
                                {installed.includes(plugin.name) ? '已安装' : '安装'}
                            </PortalButton>
                        </div>
                    </article>
                ))}
                {visible.length === 0 && <p className={emptyStateClass}>暂无匹配的插件</p>}
            </div>
            <p className={demoNoteClass}>插件安装仅保存到当前浏览器，用于编排演示；尚未连接真实搜索、代码执行、邮件或图像生成服务。</p>
            <PortalDialog
                open={modal}
                onOpenChange={setModal}
                title="创建自定义插件"
                description="保存一个本地插件配置。此演示不会发送网络请求或执行代码。"
            >
                <form onSubmit={create}>
                    <label className={fieldLabelClass} htmlFor="plugin-name">
                        插件名称
                    </label>
                    <input
                        id="plugin-name"
                        className={textFieldClass}
                        required
                        maxLength={40}
                        value={name}
                        onChange={event => setName(event.target.value)}
                        placeholder="例如：我的业务工具"
                    />
                    <label className={`${fieldLabelClass} mt-[14px]`} htmlFor="plugin-desc">
                        能力描述
                    </label>
                    <textarea
                        id="plugin-desc"
                        className={textAreaClass}
                        value={desc}
                        onChange={event => setDesc(event.target.value)}
                        placeholder="描述此插件的用途"
                    />
                    {error && (
                        <p role="alert" className={demoNoteClass}>
                            {error}
                        </p>
                    )}
                    <div className={modalActionsClass}>
                        <PortalButton type="button" onClick={() => setModal(false)}>
                            取消
                        </PortalButton>
                        <PortalButton primary type="submit" disabled={!name.trim()}>
                            创建插件
                        </PortalButton>
                    </div>
                </form>
            </PortalDialog>
        </PortalShell>
    )
}
