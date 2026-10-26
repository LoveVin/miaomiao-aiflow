'use client'

import {
    Brain,
    Check,
    ChevronDown,
    ChevronLeft,
    CircleAlert,
    CircleHelp,
    Database,
    FileText,
    Plus,
    Search,
    Settings,
    Trash2,
    Upload,
    Workflow,
    X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useRef, useState } from 'react'

import {
    CardSkeleton,
    colorClasses,
    emptyStateClass,
    fieldLabelClass,
    Hero,
    modalActionsClass,
    PortalButton,
    PortalDialog,
    SearchField,
    textAreaClass,
    textFieldClass,
} from '@/components/shared'
import { IconPicker, knowledgeIconOptions, RecordIcon } from '@/components/shared/icon-picker'
import { cn } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
    type DocumentChunksResponse,
    type KnowledgeDocument,
    type KnowledgeLibrary,
    knowledgeService,
    type RawKnowledgeBase,
    type RawKnowledgeDocument,
    type SearchResponse,
} from '@/lib/services/knowledge-service'

const readyClass =
    'ready flex items-center gap-1.5 text-[#4c9f78] [&_i]:size-[5px] [&_i]:rounded-full [&_i]:bg-[#49b788] [&_i]:shadow-[0_0_0_3px_#e8f7f1]'
const iconButtonClass =
    'grid size-[25px] shrink-0 place-items-center rounded-[5px] border-0 bg-transparent text-[#a5a7b7] hover:bg-[#f3f1fd] hover:text-[#6658bd]'
const kbIconClass = 'grid size-[38px] place-items-center rounded-[10px]'
const dangerButtonClass = 'text-[#c6505c] border-[#efcdd0]'
const sectionHeadClass =
    'mb-[22px] flex items-center justify-between max-[760px]:gap-2.5 [&_h2]:mb-[5px] [&_h2]:mt-0 [&_h2]:text-[15px] [&_p]:m-0 [&_p]:text-[9px] [&_p]:text-[#999cab]'
const tableRowClass =
    'grid min-h-[66px] grid-cols-[2.2fr_0.7fr_0.8fr_0.7fr_70px] items-center border-b border-[#efedf1] px-[18px] text-[10px] text-[#74717a] last:border-0 max-[760px]:grid-cols-[2fr_0.6fr_60px] max-[760px]:px-2.5 max-[760px]:[&>span:nth-child(3)]:hidden max-[760px]:[&>span:nth-child(4)]:hidden'
const fileTypeClass =
    'grid h-[37px] w-[31px] shrink-0 place-items-center rounded-[5px] bg-[#eceaff] text-[7px] font-extrabold not-italic text-[#6255dd]'
const navLinkClass = 'flex h-[38px] items-center gap-[9px] rounded-lg px-2.5 text-[10px] no-underline hover:bg-[#f1f0f8]'

function toUiDocument(document: RawKnowledgeDocument): KnowledgeDocument {
    return {
        id: document.id,
        name: document.name,
        size:
            document.size > 1048576 ? `${(document.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(document.size / 1024))} KB`,
        slices: document.chunkCount ?? 0,
        time: new Date(document.updatedAt).toLocaleString('zh-CN'),
        content: document.content?.match(/[\s\S]{1,500}/g) ?? [],
        status: document.status,
    }
}

function toUiLibrary(item: RawKnowledgeBase): KnowledgeLibrary {
    const documents = item.documents.map(toUiDocument)
    return {
        id: item.id,
        name: item.name,
        desc: item.description ?? '',
        docs: documents.length,
        slices: documents.reduce((total, document) => total + document.slices, 0),
        time: new Date(item.updatedAt).toLocaleString('zh-CN'),
        color: item.iconColor,
        icon: item.icon,
        mode: item.retrievalMode.toLowerCase(),
        embeddingModel: item.embeddingModel,
        embeddingProvider: item.embeddingProvider,
        dimensions: item.dimensions,
        chunkSize: item.chunkSize,
        chunkOverlap: item.chunkOverlap,
        vectorWeight: item.vectorWeight,
        topK: item.topK,
        threshold: item.threshold,
        documents,
    }
}

export function KnowledgeList() {
    const router = useRouter()
    const [libraries, setLibraries] = useState<KnowledgeLibrary[]>([])
    const [search, setSearch] = useState('')
    const [loaded, setLoaded] = useState(false)
    const [modal, setModal] = useState(false)
    const [name, setName] = useState('')
    const [desc, setDesc] = useState('')
    const [selectedIcon, setSelectedIcon] = useState(knowledgeIconOptions[0])
    const [error, setError] = useState('')

    useEffect(() => {
        knowledgeService
            .getList()
            .then(result => setLibraries(result.items.map(toUiLibrary)))
            .catch(error => setError(error instanceof Error ? error.message : '加载知识库失败'))
            .finally(() => setLoaded(true))
    }, [])

    function openCreate() {
        setName('')
        setDesc('')
        setSelectedIcon(knowledgeIconOptions[0])
        setModal(true)
    }
    async function create(event: FormEvent) {
        event.preventDefault()
        if (!name.trim()) return
        const result = await knowledgeService.create({ name: name.trim(), description: desc, icon: selectedIcon.icon })
        router.push(`/knowledge/${result.id}`)
    }
    const visible = libraries.filter(library => `${library.name}${library.desc}`.includes(search))
    return (
        <>
            <Hero eyebrow="KNOWLEDGE BASE" title="知识库" description="创建独立知识库，分类管理不同业务场景的知识文档。">
                <PortalButton primary onClick={openCreate}>
                    <Plus size={17} />
                    新建知识库
                </PortalButton>
            </Hero>
            <div className="mb-5 flex h-[62px] items-center rounded-[11px] border border-[var(--line)] bg-white px-[22px] [&>span]:flex [&>span]:min-w-[140px] [&>span]:items-baseline [&>span]:gap-[7px] [&_strong]:text-lg [&_small]:text-[9px] [&_small]:text-[#9699a9] [&>i]:mr-7 [&>i]:h-[22px] [&>i]:w-px [&>i]:bg-[var(--line)] max-[760px]:[&>span]:min-w-0 max-[760px]:[&>span]:flex-1 max-[760px]:[&>span]:gap-[5px] max-[760px]:[&>i]:mx-[15px]">
                <span>
                    <strong>{libraries.length}</strong>
                    <small>知识库</small>
                </span>
                <i />
                <span>
                    <strong>{libraries.reduce((total, item) => total + item.docs, 0)}</strong>
                    <small>文档总数</small>
                </span>
                <i />
                <span>
                    <strong>{libraries.reduce((total, item) => total + item.slices, 0).toLocaleString()}</strong>
                    <small>知识切片</small>
                </span>
            </div>
            <div className="mb-3 flex justify-end">
                <SearchField value={search} onChange={setSearch} placeholder="搜索知识库" />
            </div>
            {loaded && error && <p className={emptyStateClass}>{error}</p>}
            <div className="grid grid-cols-3 gap-[15px] max-[760px]:grid-cols-2 max-[480px]:grid-cols-1">
                <button
                    className="flex min-h-[205px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-white p-[18px] text-[#979aaa] hover:border-[#9187ed] hover:bg-[#faf9ff]"
                    onClick={openCreate}
                >
                    <span className="grid size-[39px] place-items-center rounded-[11px] bg-[var(--orange-soft)] text-[var(--orange)]">
                        <Plus size={21} />
                    </span>
                    <strong className="mb-[5px] mt-[11px] text-[11px] text-[#4a4d60]">新建知识库</strong>
                    <small className="text-[8px]">为不同业务场景独立管理知识</small>
                </button>
                {!loaded && Array.from({ length: 5 }).map((_, index) => <CardSkeleton key={index} className="min-h-[205px]" />)}
                {visible.map(library => (
                    <article
                        className="relative min-h-[205px] rounded-xl border border-[var(--line)] bg-white p-[18px] transition-all duration-200 hover:-translate-y-[3px] hover:border-[#d6d2ef] hover:shadow-[var(--shadow)]"
                        key={library.id}
                    >
                        <div className="flex justify-between">
                            <span className={`${kbIconClass} ${colorClasses[library.color]}`}>
                                <RecordIcon icon={library.icon} fallback={<Database size={20} />} />
                            </span>
                        </div>
                        <h3 className="mb-1.5 mt-[14px] text-xs">
                            <Link
                                className="text-inherit no-underline after:absolute after:inset-0 after:content-['']"
                                href={`/knowledge/${library.id}`}
                            >
                                {library.name}
                            </Link>
                        </h3>
                        <p className="m-0 min-h-7 text-[9px] leading-[1.55] text-[#9295a5]">{library.desc}</p>
                        <div className="mt-[14px] flex gap-[17px] [&_span]:flex [&_span]:items-center [&_span]:gap-[5px] [&_span]:text-[8px] [&_span]:text-[#777b8e]">
                            <span>
                                <FileText size={14} />
                                {library.docs} 个文档
                            </span>
                            <span>
                                <Workflow size={14} />
                                {library.slices} 个切片
                            </span>
                        </div>
                        <div className="mt-[13px] flex items-center justify-between border-t border-[#f0eff3] pt-[11px] text-[9px]">
                            <span className={readyClass}>
                                <i />
                                {library.docs ? '已就绪' : '等待上传'}
                            </span>
                            <time className="text-[8px] text-[#aaacb8]">更新于 {library.time}</time>
                        </div>
                    </article>
                ))}
                {loaded && visible.length === 0 && <p className={emptyStateClass}>没有找到匹配的知识库</p>}
            </div>
            <PortalDialog open={modal} onOpenChange={setModal} title="新建知识库">
                <form onSubmit={create}>
                    <IconPicker
                        label="知识库图标"
                        options={knowledgeIconOptions}
                        value={selectedIcon}
                        onChange={setSelectedIcon}
                        className="mb-[15px]"
                    />
                    <label className={fieldLabelClass} htmlFor="kb-name">
                        知识库名称
                    </label>
                    <input
                        id="kb-name"
                        className={textFieldClass}
                        autoFocus
                        required
                        maxLength={60}
                        placeholder="例如：产品与售后知识库"
                        value={name}
                        onChange={event => setName(event.target.value)}
                    />
                    <label className={`${fieldLabelClass} mt-[14px]`} htmlFor="kb-desc">
                        知识库描述
                    </label>
                    <textarea
                        id="kb-desc"
                        className={textAreaClass}
                        placeholder="简单描述这个知识库的用途"
                        value={desc}
                        onChange={event => setDesc(event.target.value)}
                    />
                    <div className={modalActionsClass}>
                        <PortalButton type="button" onClick={() => setModal(false)}>
                            取消
                        </PortalButton>
                        <PortalButton primary type="submit" disabled={!name.trim()}>
                            创建知识库
                        </PortalButton>
                    </div>
                </form>
            </PortalDialog>
        </>
    )
}

export function KnowledgeDetail({ id, section = 'docs' }: { id: string; section?: 'docs' | 'recall' | 'settings' }) {
    const router = useRouter()
    const [libraries, setLibraries] = useState<KnowledgeLibrary[]>([])
    const library = libraries.find(item => item.id === id)
    const [loadedId, setLoadedId] = useState(id)
    const [loadError, setLoadError] = useState('')
    const loading = loadedId !== id
    const activeLoadError = loadedId === id ? loadError : ''
    const [upload, setUpload] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null)
    const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set())
    const [deletingDoc, setDeletingDoc] = useState<KnowledgeDocument | null>(null)
    const [deleteLibrary, setDeleteLibrary] = useState(false)
    const [notice, setNotice] = useState('')
    const [noticeType, setNoticeType] = useState<'success' | 'error'>('error')
    const [uploading, setUploading] = useState(false)
    const fileInput = useRef<HTMLInputElement>(null)
    const [chunkData, setChunkData] = useState<DocumentChunksResponse | null>(null)
    const [chunkLoading, setChunkLoading] = useState(false)
    const [chunkError, setChunkError] = useState('')

    useEffect(() => {
        if (!notice) return
        const timer = window.setTimeout(() => setNotice(''), 2200)
        return () => window.clearTimeout(timer)
    }, [notice])

    useEffect(() => {
        if (!selectedDoc) return
        let active = true
        void Promise.resolve()
            .then(() => {
                if (!active) return null
                setChunkLoading(true)
                setChunkError('')
                return knowledgeService.getDocumentChunks(id, selectedDoc.id)
            })
            .then(result => {
                if (active && result) setChunkData(result)
            })
            .catch(error => {
                if (active) setChunkError(error instanceof Error ? error.message : '加载切片信息失败')
            })
            .finally(() => {
                if (active) setChunkLoading(false)
            })
        return () => {
            active = false
        }
    }, [id, selectedDoc])

    function openDocument(document: KnowledgeDocument) {
        setChunkData(null)
        setChunkError('')
        setSelectedDoc(document)
    }

    useEffect(() => {
        let cancelled = false
        knowledgeService
            .getList()
            .then(result => {
                if (cancelled) return
                setLibraries(result.items.map(toUiLibrary))
                setLoadedId(id)
            })
            .catch(error => {
                if (!cancelled) {
                    setLoadError(error instanceof Error ? error.message : '加载知识库失败')
                    setLoadedId(id)
                }
            })
        return () => {
            cancelled = true
        }
    }, [id])
    if (loading)
        return (
            <div aria-live="polite" className={emptyStateClass} role="status">
                加载中…
            </div>
        )
    if (activeLoadError) return <div className={emptyStateClass}>{activeLoadError}</div>
    if (!library)
        return (
            <div className={emptyStateClass}>
                <h1>未找到知识库</h1>
                <p>该知识库可能已被删除，或当前账号无权访问。</p>
                <Link href="/knowledge">返回全部知识库</Link>
            </div>
        )
    const activeLibrary = library
    function updateLibrary(update: (item: KnowledgeLibrary) => KnowledgeLibrary) {
        setLibraries(old => old.map(item => (item.id === id ? update(item) : item)))
    }
    async function importFiles(files: FileList | File[]) {
        setUploading(true)
        try {
            const { imported } = await knowledgeService.uploadDocuments(id, Array.from(files))
            const importedDocuments = imported.map(toUiDocument)
            if (imported.length) {
                updateLibrary(item => ({
                    ...item,
                    documents: [...item.documents, ...importedDocuments],
                    docs: item.docs + imported.length,
                    slices: item.slices + importedDocuments.reduce((total, doc) => total + doc.slices, 0),
                    time: '刚刚',
                }))
            }
            setNotice('上传成功')
            setNoticeType('success')
        } catch (error) {
            setNotice(error instanceof Error ? error.message : '上传文档失败')
            setNoticeType('error')
        } finally {
            setUploading(false)
            setUpload(false)
        }
    }
    return (
        <>
            <div className="mb-3 flex-none">
                <Link className="mb-[9px] flex items-center gap-1.5 text-[9px] text-[#7f8293] no-underline" href="/knowledge">
                    <ChevronLeft size={17} />
                    全部知识库
                </Link>
                <div className="flex items-center gap-2.5">
                    <span className={`${kbIconClass} ${colorClasses[activeLibrary.color]}`}>
                        <RecordIcon icon={activeLibrary.icon} size={21} fallback={<Database size={21} />} />
                    </span>
                    <span>
                        <h1 className="mb-[3px] mt-0 text-lg">{activeLibrary.name}</h1>
                        <p className="m-0 text-[9px] text-[#9396a6]">{activeLibrary.desc}</p>
                    </span>
                </div>
            </div>
            <div className="kb-detail-layout grid min-h-0 flex-1 grid-cols-[210px_minmax(0,1fr)] overflow-hidden rounded-[13px] border border-[var(--line)] bg-white max-[760px]:grid-cols-[130px_1fr] max-[480px]:flex max-[480px]:flex-col">
                <aside className="flex flex-col border-r border-[var(--line)] bg-[#fafafe] px-3 py-[18px] max-[760px]:px-1.5 max-[760px]:py-[14px] max-[480px]:flex-none max-[480px]:flex-row max-[480px]:flex-wrap max-[480px]:border-b max-[480px]:border-r-0">
                    <span className="px-[9px] pb-[9px] text-[8px] text-[#a1a4b2] max-[480px]:hidden">知识库管理</span>
                    <Link
                        className={`${navLinkClass} ${section === 'docs' ? 'bg-[#eeecff] font-[650] text-[#5549cb]' : 'text-[#73778b]'}`}
                        href={`/knowledge/${id}`}
                    >
                        <FileText size={16} />
                        文档<em className="ml-auto text-[8px] not-italic text-[#9295a6]">{activeLibrary.docs}</em>
                    </Link>
                    <Link
                        className={`${navLinkClass} ${section === 'recall' ? 'bg-[#eeecff] font-[650] text-[#5549cb]' : 'text-[#73778b]'}`}
                        href={`/knowledge/${id}/recall`}
                    >
                        <Search size={16} />
                        召回测试
                    </Link>
                    <Link
                        className={`${navLinkClass} ${section === 'settings' ? 'bg-[#eeecff] font-[650] text-[#5549cb]' : 'text-[#73778b]'}`}
                        href={`/knowledge/${id}/settings`}
                    >
                        <Settings size={16} />
                        设置
                    </Link>
                    <div className="mt-auto flex flex-col border-t border-[var(--line)] px-[9px] pb-0.5 pt-[14px] max-[480px]:hidden">
                        <small className="text-[8px] text-[#9a9dac]">知识切片</small>
                        <strong className="mb-[7px] mt-[3px] text-[19px]">{activeLibrary.slices}</strong>
                    </div>
                </aside>
                <section className="min-h-0 min-w-0 overflow-y-auto p-6 max-[760px]:p-4 max-[480px]:flex-1">
                    {section === 'docs' && (
                        <>
                            <div className={sectionHeadClass}>
                                <div>
                                    <h2>文档</h2>
                                    <p>管理当前知识库中的所有知识文档</p>
                                </div>
                                <PortalButton primary onClick={() => setUpload(true)}>
                                    <Upload size={16} />
                                    上传文档
                                </PortalButton>
                            </div>
                            <div className="overflow-hidden rounded-[9px] border border-[var(--line)]">
                                <div className={cn(tableRowClass, 'min-h-[38px] bg-[#fafafa] text-[9px] text-[#9c99a1]')}>
                                    <span>文档名称</span>
                                    <span>切片数</span>
                                    <span>更新时间</span>
                                    <span>状态</span>
                                    <span>操作</span>
                                </div>
                                {activeLibrary.documents.map((doc, index) => (
                                    <div
                                        className={`${tableRowClass} cursor-pointer transition-colors duration-150 hover:bg-[#faf9ff]`}
                                        key={doc.id}
                                        onClick={() => openDocument(doc)}
                                    >
                                        <button
                                            className="flex items-center gap-2.5 border-0 bg-transparent text-left"
                                            onClick={() => openDocument(doc)}
                                        >
                                            <i
                                                className={cn(
                                                    fileTypeClass,
                                                    index % 3 === 1
                                                        ? 'bg-[#e9f0ff] text-[#527cca]'
                                                        : index % 3 === 2
                                                          ? 'bg-[#eeeaff] text-[#725bd0]'
                                                          : ''
                                                )}
                                            >
                                                {doc.name.split('.').pop()?.toUpperCase()}
                                            </i>
                                            <span className="flex flex-col gap-1">
                                                <strong className="text-[10px] text-[#403d45]">{doc.name}</strong>
                                                <small className="text-[8px] text-[#aaa7af]">{doc.size}</small>
                                            </span>
                                        </button>
                                        <span>{doc.slices} 个</span>
                                        <span>{doc.time}</span>
                                        <span className={readyClass}>
                                            <i />
                                            {doc.status === 'COMPLETED' ? '已解析' : '待解析'}
                                        </span>
                                        <span className="flex items-center gap-[3px] [&_button]:grid [&_button]:size-7 [&_button]:place-items-center [&_button]:rounded-[7px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[#898c9d] [&_button:hover]:bg-[#eeecff] [&_button:hover]:text-[#5f53d4]">
                                            <button aria-label={`查看${doc.name}`} onClick={() => openDocument(doc)}>
                                                <FileText size={15} />
                                            </button>
                                            <button
                                                aria-label={`删除${doc.name}`}
                                                className="hover:!bg-[#fff0f1] hover:!text-[#cc5561]"
                                                onClick={event => {
                                                    event.stopPropagation()
                                                    setDeletingDoc(doc)
                                                }}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </span>
                                    </div>
                                ))}
                                {activeLibrary.documents.length === 0 && (
                                    <p className={emptyStateClass}>暂无文档，上传文件开始构建知识库。</p>
                                )}
                            </div>
                        </>
                    )}
                    {section === 'recall' && (
                        <>
                            <div className={sectionHeadClass}>
                                <div>
                                    <h2>召回测试</h2>
                                    <p>输入问题，测试知识库的检索效果与切片匹配度</p>
                                </div>
                            </div>
                            <RecallTest id={id} onError={setNotice} />
                        </>
                    )}
                    {section === 'settings' && (
                        <>
                            <div className={sectionHeadClass}>
                                <div>
                                    <h2>知识库设置</h2>
                                    <p>修改基本信息与文档处理配置</p>
                                </div>
                            </div>
                            <KnowledgeSettingsForm
                                library={activeLibrary}
                                onError={setNotice}
                                onSaved={updateLibrary}
                                onDelete={() => setDeleteLibrary(true)}
                            />
                        </>
                    )}
                </section>
            </div>
            <PortalDialog open={upload} onOpenChange={setUpload} title="上传知识文档" description={`文档将添加到“${activeLibrary.name}”`}>
                <input
                    ref={fileInput}
                    type="file"
                    accept=".pdf,.doc,.docx,.md,.txt"
                    multiple
                    hidden
                    onChange={event => {
                        if (event.target.files) void importFiles(event.target.files)
                        event.target.value = ''
                    }}
                />
                <button
                    className="flex h-[170px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d8d5dc] bg-[#fbfafb] text-[#938f98]"
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                    onDragOver={event => event.preventDefault()}
                    onDrop={event => {
                        event.preventDefault()
                        void importFiles(event.dataTransfer.files)
                    }}
                >
                    <span className="grid size-10 place-items-center rounded-[10px] bg-[var(--orange-soft)] text-[var(--orange)]">
                        <Upload size={20} />
                    </span>
                    <strong className="text-[11px] text-[#4a4750]">{uploading ? '正在读取本地文件…' : '点击选择，或将文件拖拽至此'}</strong>
                    <small className="text-[9px]">支持 PDF、Word、Markdown、TXT，单个文件不超过 20MB</small>
                </button>
            </PortalDialog>
            <Dialog
                open={!!selectedDoc}
                onOpenChange={open => {
                    if (!open) {
                        setSelectedDoc(null)
                        setExpandedChunks(new Set())
                    }
                }}
            >
                <DialogContent className="document-drawer !left-auto !right-0 !top-0 flex !h-dvh !max-h-none !w-[640px] !max-w-full !translate-x-0 !translate-y-0 transform-none animate-[portal-slide-in_0.24s_ease-out] flex-col !rounded-none !p-0 [&>.modal-close]:top-[26px]">
                    {selectedDoc &&
                        (() => {
                            const chunks = chunkData?.chunks ?? []
                            const stats = chunkData?.documentStats

                            return (
                                <>
                                    <div className="flex min-h-[72px] items-center gap-[11px] border-b border-[var(--line)] pl-5 pr-11">
                                        <span className={fileTypeClass}>DOC</span>
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <DialogTitle className="m-0 truncate text-[11px]">{selectedDoc.name}</DialogTitle>
                                            <DialogDescription className="m-0 text-[8px] text-[#9a9dad]">文档详情</DialogDescription>
                                        </div>
                                    </div>
                                    <div className="flex h-[45px] flex-none items-center justify-between border-b border-[var(--line)] bg-[#fafafe] px-5 text-[9px]">
                                        <span className={readyClass}>
                                            <i />
                                            {selectedDoc.status === 'COMPLETED' ? '已解析' : '待解析'}
                                        </span>
                                        <small className="text-[8px] text-[#a0a3b1]">最后更新：{selectedDoc.time}</small>
                                    </div>
                                    <section className="grid grid-cols-4 gap-4 border-b border-[var(--line)] bg-[#fafafe] px-5 py-4 [&_span]:block [&_span]:text-[8px] [&_span]:text-[#999cab] [&_strong]:mt-1 [&_strong]:block [&_strong]:truncate [&_strong]:text-[10px] [&_strong]:font-medium [&_strong]:text-[#505365]">
                                        <span>
                                            切片数<strong>{chunkLoading ? '—' : chunks.length}</strong>
                                        </span>
                                        <span>
                                            总字符<strong>{stats ? stats.totalChars.toLocaleString() : '—'}</strong>
                                        </span>
                                        <span>
                                            嵌入模型
                                            <strong title={stats?.embeddingModel ?? library.embeddingModel}>
                                                {(stats?.embeddingModel ?? library.embeddingModel).split(':')[0]}
                                            </strong>
                                        </span>
                                        <span>
                                            向量维度<strong>{stats?.embeddingDimensions ?? library.dimensions}</strong>
                                        </span>
                                    </section>
                                    <section className="flex-1 overflow-auto border-b border-[var(--line)] p-5">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="m-0 text-[10px]">切片预览</h3>
                                            <span className="text-[8px] text-[#9a9dad]">{selectedDoc.slices} 个切片</span>
                                        </div>
                                        {chunkLoading && <p className={emptyStateClass}>正在加载切片信息…</p>}
                                        {!chunkLoading && chunkError && <p className={emptyStateClass}>{chunkError}</p>}
                                        {chunks.map((chunk, index) => {
                                            const chunkId = chunk.chunkId
                                            const expanded = expandedChunks.has(chunkId)
                                            return (
                                                <article
                                                    className="mb-[9px] overflow-hidden rounded-[9px] border border-[var(--line)] bg-white"
                                                    key={chunkId}
                                                >
                                                    <button
                                                        aria-expanded={expanded}
                                                        className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-[#fafafe]"
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedChunks(current => {
                                                                const next = new Set(current)
                                                                if (next.has(chunkId)) next.delete(chunkId)
                                                                else next.add(chunkId)
                                                                return next
                                                            })
                                                        }
                                                    >
                                                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#eceaff] text-[10px] font-medium text-[#6257d7]">
                                                            {index + 1}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-[9px] leading-[1.65] text-[#676a7c] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                                                                {chunk.content}
                                                            </span>
                                                            <span className="mt-2 flex gap-1.5 [&_span]:rounded-full [&_span]:bg-[#f8f8fb] [&_span]:px-1.5 [&_span]:py-0.5 [&_span]:text-[8px] [&_span]:text-[#777b8e]">
                                                                <span>{chunk.charCount} 字符</span>
                                                                <span>{chunk.wordCount} 词</span>
                                                            </span>
                                                        </span>
                                                        <ChevronDown
                                                            className={`size-3.5 shrink-0 text-[#a3a6b4] transition-transform ${expanded ? 'rotate-180' : ''}`}
                                                        />
                                                    </button>
                                                    {expanded && (
                                                        <div className="border-t border-[var(--line)] bg-[#fafafe]">
                                                            <div className="border-b border-[var(--line)] p-3">
                                                                <p className="mb-2 text-[8px] font-medium text-[#777b8e]">完整内容</p>
                                                                <div className="rounded-md border border-[var(--line)] bg-white p-3">
                                                                    <p className="whitespace-pre-wrap text-[9px] leading-[1.65] text-[#676a7c]">
                                                                        {chunk.content}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {chunk.embeddingStats && (
                                                                <div className="border-b border-[var(--line)] p-3">
                                                                    <p className="mb-2 flex items-center gap-1 text-[8px] font-medium text-[#777b8e]">
                                                                        <Brain className="size-3" />
                                                                        Embedding 统计
                                                                    </p>
                                                                    <div className="grid grid-cols-6 gap-2 text-center [&_span]:block [&_span]:rounded-md [&_span]:border [&_span]:border-[var(--line)] [&_span]:bg-white [&_span]:p-2 [&_span]:text-[8px] [&_span]:text-[#999cab] [&_strong]:mt-1 [&_strong]:block [&_strong]:text-[9px] [&_strong]:text-[#505365]">
                                                                        <span>
                                                                            维度<strong>{chunk.embeddingStats.dimensions}</strong>
                                                                        </span>
                                                                        <span>
                                                                            L2范数<strong>{chunk.embeddingStats.norm}</strong>
                                                                        </span>
                                                                        <span>
                                                                            均值<strong>{chunk.embeddingStats.mean}</strong>
                                                                        </span>
                                                                        <span>
                                                                            标准差<strong>{chunk.embeddingStats.std}</strong>
                                                                        </span>
                                                                        <span>
                                                                            最小值<strong>{chunk.embeddingStats.min}</strong>
                                                                        </span>
                                                                        <span>
                                                                            最大值<strong>{chunk.embeddingStats.max}</strong>
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-2">
                                                                        <p className="mb-1 text-[8px] text-[#999cab]">向量预览 (前10维)</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {chunk.embeddingStats.preview.map((value, valueIndex) => (
                                                                                <span
                                                                                    className="rounded border border-[var(--line)] bg-white px-1.5 py-0.5 font-mono text-[8px] text-[#676a7c]"
                                                                                    key={valueIndex}
                                                                                >
                                                                                    {value}
                                                                                </span>
                                                                            ))}
                                                                            <span className="text-[8px] text-[#a3a6b4]">...</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="p-3">
                                                                <p className="mb-2 text-[8px] font-medium text-[#777b8e]">元数据</p>
                                                                <div className="grid grid-cols-2 gap-2 [&_span]:flex [&_span]:items-center [&_span]:justify-between [&_span]:gap-2 [&_span]:rounded-md [&_span]:border [&_span]:border-[var(--line)] [&_span]:bg-white [&_span]:px-2 [&_span]:py-1.5 [&_span]:text-[8px] [&_span]:text-[#999cab] [&_strong]:text-[9px] [&_strong]:text-[#505365]">
                                                                    <span>
                                                                        Chunk ID
                                                                        <strong className="truncate" title={chunkId}>
                                                                            {chunkId}
                                                                        </strong>
                                                                    </span>
                                                                    <span>
                                                                        索引<strong>{chunk.chunkIndex}</strong>
                                                                    </span>
                                                                    <span>
                                                                        起始位置<strong>{chunk.startOffset}</strong>
                                                                    </span>
                                                                    <span>
                                                                        结束位置<strong>{chunk.endOffset}</strong>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </article>
                                            )
                                        })}
                                        {!selectedDoc.content.length && <p className={emptyStateClass}>暂无可预览的切片</p>}
                                    </section>
                                    <div className="flex min-h-[62px] items-center justify-end gap-2 border-t border-[var(--line)] px-5">
                                        <PortalButton onClick={() => setSelectedDoc(null)}>关闭</PortalButton>
                                        <PortalButton
                                            className={dangerButtonClass}
                                            onClick={() => {
                                                setDeletingDoc(selectedDoc)
                                                setSelectedDoc(null)
                                            }}
                                        >
                                            <Trash2 size={14} />
                                            删除文档
                                        </PortalButton>
                                    </div>
                                </>
                            )
                        })()}
                </DialogContent>
            </Dialog>
            <PortalDialog
                open={!!deletingDoc}
                onOpenChange={() => setDeletingDoc(null)}
                title="确认删除文档？"
                description={`即将删除“${deletingDoc?.name || ''}”。删除后，相关知识切片也会一并移除，且无法恢复。`}
            >
                <div className="flex min-h-[38px] items-center gap-[7px] rounded-lg bg-[#fff8ea] px-[11px] py-2 text-[8px] text-[#a9792c]">
                    <CircleHelp size={15} />
                    已使用此文档的应用可能会受到影响
                </div>
                <div className={modalActionsClass}>
                    <PortalButton onClick={() => setDeletingDoc(null)}>取消</PortalButton>
                    <PortalButton
                        variant="destructive"
                        onClick={() => {
                            if (deletingDoc) {
                                void (async () => {
                                    try {
                                        await knowledgeService.deleteDocument(id, deletingDoc.id)
                                        const removed = deletingDoc
                                        updateLibrary(item => ({
                                            ...item,
                                            documents: item.documents.filter(doc => doc.id !== removed.id),
                                            docs: Math.max(0, item.docs - 1),
                                            slices: Math.max(0, item.slices - removed.slices),
                                            time: '刚刚',
                                        }))
                                        setDeletingDoc(null)
                                    } catch (error) {
                                        setNotice(error instanceof Error ? error.message : '删除文档失败')
                                    }
                                })()
                            }
                        }}
                    >
                        确认删除
                    </PortalButton>
                </div>
            </PortalDialog>
            <PortalDialog
                open={deleteLibrary}
                onOpenChange={setDeleteLibrary}
                title="确认删除知识库？"
                description={`“${activeLibrary.name}”及其中的全部本地文档将被永久移除。`}
            >
                <div className={modalActionsClass}>
                    <PortalButton onClick={() => setDeleteLibrary(false)}>取消</PortalButton>
                    <PortalButton
                        variant="destructive"
                        onClick={() => {
                            void (async () => {
                                try {
                                    await knowledgeService.delete(id)
                                    setLibraries(old => old.filter(item => item.id !== id))
                                    router.push('/knowledge')
                                } catch (error) {
                                    setNotice(error instanceof Error ? error.message : '删除知识库失败')
                                }
                            })()
                        }}
                    >
                        确认删除
                    </PortalButton>
                </div>
            </PortalDialog>
            {notice && (
                <div
                    className="fixed top-[82px] right-[22px] z-[60] flex max-w-[410px] items-center gap-[10px] rounded-[10px] border border-[#e4e1ef] bg-white p-[14px] text-[12px] leading-[1.7] shadow-[0_10px_35px_#39345d1a]"
                    role="status"
                >
                    {noticeType === 'error' ? (
                        <CircleAlert size={17} className="shrink-0 text-[#d18282]" />
                    ) : (
                        <Check size={17} className="shrink-0 text-[#6eaf94]" />
                    )}
                    <span>{notice}</span>
                    <button className={iconButtonClass} aria-label="关闭提示" onClick={() => setNotice('')}>
                        <X size={15} />
                    </button>
                </div>
            )}
        </>
    )
}

function RecallTest({ id, onError }: { id: string; onError: (message: string) => void }) {
    const [query, setQuery] = useState('')
    const [mode, setMode] = useState('VECTOR')
    const [topK, setTopK] = useState(5)
    const [threshold, setThreshold] = useState(0.2)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<SearchResponse | null>(null)

    async function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!query.trim()) return
        setLoading(true)
        try {
            setResult(await knowledgeService.search(id, { query: query.trim(), mode, topK, threshold }))
        } catch (error) {
            onError(error instanceof Error ? error.message : '召回测试失败')
        } finally {
            setLoading(false)
        }
    }

    const modeLabels: Record<string, string> = { VECTOR: '向量检索', FULLTEXT: '全文检索', HYBRID: '混合检索' }

    return (
        <div className="grid min-h-[420px] grid-cols-[280px_1fr] gap-5 max-[900px]:grid-cols-1">
            <form className="flex h-fit flex-col gap-3 rounded-[10px] border border-[var(--line)] bg-[#fafafe] p-[17px]" onSubmit={search}>
                <label className="flex flex-col gap-[7px] text-[9px] font-[650] text-[#55596b]">
                    查询内容
                    <textarea
                        className="h-14 resize-none rounded-lg border border-[#dcdee8] bg-white p-2.5 text-[10px] outline-none"
                        placeholder="输入要查询的内容..."
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-[7px] text-[9px] font-[650] text-[#55596b]">
                    检索模式
                    <span className="relative block">
                        <select
                            className="h-[38px] w-full appearance-none rounded-lg border border-[#dcdee7] bg-white px-[11px] pr-8 text-[10px] text-[#4c5062] outline-none"
                            value={mode}
                            onChange={event => setMode(event.target.value)}
                        >
                            <option value="VECTOR">向量检索</option>
                            <option value="FULLTEXT">全文检索</option>
                            <option value="HYBRID">混合检索</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8d8a93]" />
                    </span>
                </label>
                <label className="flex flex-col gap-[7px] text-[9px] font-[650] text-[#55596b]">
                    <span className="flex items-center justify-between">
                        Top K<strong className="font-medium text-[#777b8e]">{topK}</strong>
                    </span>
                    <input max={20} min={1} step={1} type="range" value={topK} onChange={event => setTopK(Number(event.target.value))} />
                </label>
                <label className="flex flex-col gap-[7px] text-[9px] font-[650] text-[#55596b]">
                    <span className="flex items-center justify-between">
                        相似度阈值<strong className="font-medium text-[#777b8e]">{threshold.toFixed(2)}</strong>
                    </span>
                    <input
                        max={1}
                        min={0}
                        step={0.05}
                        type="range"
                        value={threshold}
                        onChange={event => setThreshold(Number(event.target.value))}
                    />
                </label>
                <PortalButton primary type="submit" disabled={loading || !query.trim()}>
                    <Search size={15} />
                    {loading ? '检索中...' : '开始检索'}
                </PortalButton>
            </form>
            <div className="min-w-0">
                {result ? (
                    <>
                        <div className="mb-3 flex items-center justify-between rounded-[9px] border border-[var(--line)] bg-[#fafafe] p-4 text-[9px]">
                            <span>
                                找到 <strong className="text-[10px] text-[#505365]">{result.total}</strong> 个相关切片，耗时{' '}
                                {result.duration}ms
                            </span>
                            <span className="text-[#777b8e]">
                                {modeLabels[result.mode] || result.mode} · Top K {result.topK} · 阈值 {result.threshold}
                            </span>
                        </div>
                        {result.results.map((item, index) => (
                            <article className="mb-[9px] rounded-[9px] border border-[var(--line)] bg-white p-[14px]" key={item.chunkId}>
                                <div className="mb-2 flex items-center justify-between">
                                    <strong className="flex items-center gap-2 text-[9px]">
                                        <span className="grid size-5 place-items-center rounded-full bg-[#eceaff] text-[8px] text-[#6257d7]">
                                            {index + 1}
                                        </span>
                                        {item.documentName}
                                    </strong>
                                    <span className="rounded-full bg-[#eaf7f1] px-1.5 py-0.5 text-[8px] font-medium text-[#57a181]">
                                        {(item.score * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <p className="whitespace-pre-wrap text-[9px] leading-[1.7] text-[#696d7e]">{item.content}</p>
                                <small className="mt-2 block text-[8px] text-[#a2a5b2]">切片 #{item.chunkIndex + 1}</small>
                            </article>
                        ))}
                        {!result.results.length && <p className={emptyStateClass}>未找到相关内容，请调整检索参数。</p>}
                    </>
                ) : (
                    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[10px] border border-dashed border-[var(--line)] text-[#9da0af]">
                        <span className="grid size-[50px] place-items-center rounded-[14px] bg-[#f0eeff] text-[#685bdd]">
                            <Search size={25} />
                        </span>
                        <strong className="mb-[5px] mt-[11px] text-[11px] text-[#5b5e70]">输入查询开始测试</strong>
                        <p className="m-0 text-[8px]">左侧配置检索参数后开始测试</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function KnowledgeSettingsForm({
    library,
    onError,
    onSaved,
    onDelete,
}: {
    library: KnowledgeLibrary
    onError: (message: string) => void
    onSaved: (update: (item: KnowledgeLibrary) => KnowledgeLibrary) => void
    onDelete: () => void
}) {
    const [form, setForm] = useState({
        name: library.name,
        desc: library.desc,
        mode: library.mode.toUpperCase(),
        vectorWeight: library.vectorWeight,
        topK: library.topK,
        threshold: library.threshold,
        chunkSize: library.chunkSize,
        chunkOverlap: library.chunkOverlap,
    })
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    useEffect(() => {
        if (!message) return
        const timer = window.setTimeout(() => setMessage(null), 2200)
        return () => window.clearTimeout(timer)
    }, [message])

    async function save() {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            await knowledgeService.update(library.id, {
                name: form.name.trim(),
                description: form.desc,
                retrievalMode: form.mode,
                vectorWeight: form.vectorWeight,
                topK: form.topK,
                threshold: form.threshold,
                chunkSize: form.chunkSize,
                chunkOverlap: form.chunkOverlap,
            })
            onSaved(item =>
                item.id === library.id
                    ? {
                          ...item,
                          ...form,
                          mode: form.mode.toLowerCase(),
                          time: '刚刚',
                      }
                    : item
            )
            setMessage('保存成功')
        } catch (error) {
            onError(error instanceof Error ? error.message : '保存设置失败')
        } finally {
            setSaving(false)
        }
    }

    const labelClass = 'flex flex-col gap-[7px] text-[9px] font-[650] text-[#55596b]'
    const fieldClass = 'h-[38px] rounded-lg border border-[#dcdee7] bg-white px-[11px] text-[10px] text-[#4c5062] outline-none'

    return (
        <div className="flex w-[min(680px,100%)] flex-col gap-5">
            {message && (
                <div className="fixed left-1/2 top-6 z-[80] -translate-x-1/2 rounded-lg border border-[#d7efe3] bg-white px-4 py-2 text-[11px] text-[#3f9e7c] shadow-[0_8px_20px_rgba(16,24,40,.10)]">
                    {message}
                </div>
            )}
            <section className="rounded-[10px] border border-[var(--line)] bg-white p-5">
                <h3 className="m-0 text-[10px]">基本信息</h3>
                <div className="mt-3 flex flex-col gap-3">
                    <label className={labelClass}>
                        知识库名称
                        <input
                            className={fieldClass}
                            maxLength={60}
                            value={form.name}
                            onChange={event => setForm({ ...form, name: event.target.value })}
                        />
                    </label>
                    <label className={labelClass}>
                        描述
                        <textarea
                            className="h-[72px] resize-none rounded-lg border border-[#dcdee7] bg-white p-2.5 text-[10px] outline-none"
                            value={form.desc}
                            onChange={event => setForm({ ...form, desc: event.target.value })}
                        />
                    </label>
                </div>
            </section>
            <section className="rounded-[10px] border border-[var(--line)] bg-white p-5">
                <h3 className="m-0 text-[10px]">检索配置</h3>
                <div className="mt-3 flex flex-col gap-3">
                    <label className={labelClass}>
                        检索模式
                        <span className="relative block">
                            <select
                                className={`${fieldClass} w-full appearance-none pr-8`}
                                value={form.mode}
                                onChange={event => setForm({ ...form, mode: event.target.value })}
                            >
                                <option value="VECTOR">向量检索</option>
                                <option value="FULLTEXT">全文检索</option>
                                <option value="HYBRID">混合检索</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8d8a93]" />
                        </span>
                    </label>
                    {form.mode === 'HYBRID' && (
                        <label className={labelClass}>
                            <span className="flex items-center justify-between">
                                向量权重<strong className="font-medium text-[#777b8e]">{(form.vectorWeight * 100).toFixed(0)}%</strong>
                            </span>
                            <input
                                max={1}
                                min={0}
                                step={0.05}
                                type="range"
                                value={form.vectorWeight}
                                onChange={event => setForm({ ...form, vectorWeight: Number(event.target.value) })}
                            />
                        </label>
                    )}
                    <label className={labelClass}>
                        <span className="flex items-center justify-between">
                            Top K<strong className="font-medium text-[#777b8e]">{form.topK}</strong>
                        </span>
                        <input
                            max={20}
                            min={1}
                            step={1}
                            type="range"
                            value={form.topK}
                            onChange={event => setForm({ ...form, topK: Number(event.target.value) })}
                        />
                    </label>
                    <label className={labelClass}>
                        <span className="flex items-center justify-between">
                            相似度阈值<strong className="font-medium text-[#777b8e]">{form.threshold.toFixed(2)}</strong>
                        </span>
                        <input
                            max={1}
                            min={0}
                            step={0.05}
                            type="range"
                            value={form.threshold}
                            onChange={event => setForm({ ...form, threshold: Number(event.target.value) })}
                        />
                    </label>
                </div>
            </section>
            <section className="rounded-[10px] border border-[var(--line)] bg-white p-5">
                <h3 className="m-0 text-[10px]">切分配置</h3>
                <p className="mb-3 mt-1 text-[8px] text-[#999cab]">修改后需要重新处理所有文档才能生效</p>
                <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
                    <label className={labelClass}>
                        切片大小
                        <input
                            className={fieldClass}
                            max={2000}
                            min={100}
                            type="number"
                            value={form.chunkSize}
                            onChange={event => setForm({ ...form, chunkSize: Number(event.target.value) })}
                        />
                    </label>
                    <label className={labelClass}>
                        重叠字符数
                        <input
                            className={fieldClass}
                            max={500}
                            min={0}
                            type="number"
                            value={form.chunkOverlap}
                            onChange={event => setForm({ ...form, chunkOverlap: Number(event.target.value) })}
                        />
                    </label>
                </div>
            </section>
            <section className="rounded-[10px] border border-[var(--line)] bg-[#fafafe] p-5 [&_span]:text-[8px] [&_span]:text-[#999cab] [&_strong]:mt-1 [&_strong]:block [&_strong]:text-[10px] [&_strong]:text-[#505365]">
                <h3 className="m-0 text-[10px]">嵌入模型</h3>
                <div className="mt-3 grid grid-cols-3 gap-4 max-[520px]:grid-cols-1">
                    <span>
                        模型<strong className="truncate">{library.embeddingModel}</strong>
                    </span>
                    <span>
                        提供商<strong>{library.embeddingProvider}</strong>
                    </span>
                    <span>
                        维度<strong>{library.dimensions}</strong>
                    </span>
                </div>
            </section>
            <div className="border-t border-[var(--line)] pt-5">
                <p className="mb-3 mt-0 text-[8px] text-[#999caa]">删除后，所有本地文档与知识切片都将永久移除。</p>
                <div className="flex items-center justify-between gap-3">
                    <PortalButton className={dangerButtonClass} onClick={onDelete}>
                        删除知识库
                    </PortalButton>
                    <PortalButton primary onClick={save} disabled={saving || !form.name.trim()}>
                        {saving ? '保存中...' : '保存设置'}
                    </PortalButton>
                </div>
            </div>
        </div>
    )
}
