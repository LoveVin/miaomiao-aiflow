export type Document = { id: string; name: string; size: string; slices: number; time: string; content: string[]; demo: boolean }
export type Library = {
    id: string
    name: string
    desc: string
    docs: number
    slices: number
    time: string
    color: string
    icon?: string
    mode: string
    documents: Document[]
}
export type RecallResult = { doc: Document; content: string; index: number; score: number }

const preview = [
    '本产品适用于日常办公及家庭使用。首次使用前，请完整阅读产品使用说明，并按照操作步骤完成初始化设置……',
    '设备连接电源后，长按启动键 3 秒。状态指示灯由白色变为蓝色时，表示设备已进入待机状态……',
    '如遇到设备无法正常启动的情况，请先检查电源连接状态，并确认适配器符合产品规定的电压标准……',
]
const seedDocuments: Document[] = [
    {
        id: 'manual',
        name: '产品使用手册.pdf',
        size: '2.4 MB',
        slices: 128,
        time: '今天 14:32',
        content: [...preview, '如需办理退换货，请在订单详情页提交售后申请，并按照页面提示上传相关凭证。'],
        demo: true,
    },
    {
        id: 'faq',
        name: '品牌常见问题.docx',
        size: '860 KB',
        slices: 46,
        time: '昨天 18:20',
        content: ['产品支持日常办公、家庭使用与便携场景。更多常见问题请查阅产品说明。'],
        demo: true,
    },
    {
        id: 'policy',
        name: '售后服务政策.md',
        size: '124 KB',
        slices: 18,
        time: '5月18日',
        content: ['自产品签收之日起 7 天内，在商品完好且不影响二次销售的情况下，用户可申请无理由退换货。售后服务请在订单详情页提交申请。'],
        demo: true,
    },
]
export const initialLibraries: Library[] = [
    {
        id: 'products',
        name: '产品与售后知识库',
        desc: '产品说明、使用指南和售后服务政策',
        docs: 12,
        slices: 728,
        time: '今天 14:32',
        color: 'violet',
        mode: 'auto',
        documents: seedDocuments,
    },
    {
        id: 'brand',
        name: '品牌内容知识库',
        desc: '品牌规范、内容案例与营销素材',
        docs: 8,
        slices: 386,
        time: '昨天 18:20',
        color: 'blue',
        mode: 'auto',
        documents: [{ ...seedDocuments[1], content: ['品牌内容规范：以真实、清晰、温暖的表达传递产品价值，营销素材应符合品牌视觉规范。'] }],
    },
    {
        id: 'team',
        name: '团队内部手册',
        desc: '团队制度、工作流程与新人培训资料',
        docs: 4,
        slices: 172,
        time: '5月18日',
        color: 'green',
        mode: 'auto',
        documents: [
            {
                ...seedDocuments[2],
                name: '新人培训手册.md',
                content: ['新人入职请完成账号开通、团队介绍及工作流程培训。团队每周进行一次项目进度同步。'],
            },
        ],
    },
]

export function recallKnowledge(documents: Document[], query: string): RecallResult[] {
    if (!query) return []
    const terms = Array.from(new Set(query.toLowerCase().match(/[a-z0-9]+|[\u4e00-\u9fff]{1,2}/g) || []))
    return documents
        .flatMap(doc =>
            doc.content.map((content, index) => ({
                doc,
                content,
                index,
                score: terms.reduce((score, term) => score + (content.toLowerCase().includes(term) ? 1 : 0), 0),
            }))
        )
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
}

export function sliceKnowledgeText(text: string): string[] {
    return text.match(/[\s\S]{1,500}/g) || []
}

export async function importKnowledgeFiles(files: FileList | File[]): Promise<{ imported: Document[]; rejected: string[] }> {
    const imported: Document[] = []
    const rejected: string[] = []
    for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024 || !/\.(pdf|docx?|md|txt)$/i.test(file.name)) {
            rejected.push(file.name)
            continue
        }
        const chunks = /\.(md|txt)$/i.test(file.name) ? sliceKnowledgeText(await file.text()) : []
        imported.push({
            id: crypto.randomUUID(),
            name: file.name,
            size:
                file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`,
            slices: chunks.length,
            time: '刚刚',
            content: chunks,
            demo: false,
        })
    }
    return { imported, rejected }
}
