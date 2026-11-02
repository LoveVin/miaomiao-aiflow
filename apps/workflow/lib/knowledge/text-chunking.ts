// 知识库文档的通用切片与检索打分工具
// 供上传切片（documents route）与检索打分（search route）共用，保证两边一致

export const KNOWLEDGE_CHUNK_SIZE = 500

const splitCells = (line: string) => line.split(/\s+/).filter(Boolean)

// 判断多行文本是否呈现"表格式"结构（如：姓名 语文成绩 数学成绩）
function looksLikeTable(lines: string[]): boolean {
    if (lines.length < 3) return false
    const headerCells = splitCells(lines[0])
    if (headerCells.length < 2) return false
    const tabularRows = lines.slice(1).filter(line => splitCells(line).length >= Math.max(2, headerCells.length - 1)).length
    return tabularRows >= Math.ceil((lines.length - 1) * 0.6)
}

/**
 * 切分文档文本：
 * - 表格类文本：表头 + 每行数据组成一个自包含 chunk，检索"某人某科成绩"才有上下文
 * - 普通文本：按行合并，超过 chunkSize 时落块
 */
export function sliceKnowledgeText(text: string): string[] {
    const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
    if (lines.length === 0) return []

    if (looksLikeTable(lines)) {
        const [header, ...rows] = lines
        return rows.map(row => `${header}\n${row}`)
    }

    const chunks: string[] = []
    let current = ''
    for (const line of lines) {
        const candidate = current ? `${current}\n${line}` : line
        if (current && candidate.length > KNOWLEDGE_CHUNK_SIZE) {
            chunks.push(current)
            current = line
        } else {
            current = candidate
        }
    }
    if (current) chunks.push(current)
    return chunks
}

const STOPWORDS = new Set(['的', '了', '是', '吗', '呢', '啊', '请问', '多少', '什么', '怎么', '查询', '一下'])

/**
 * 将自然语言查询拆成可匹配的 token：
 * - 中英文/数字分段
 * - 较长的中文段拆成滑动 2-gram（"小红成绩" -> 小红/红成/成绩），容忍语序与虚词
 */
export function tokenizeQuery(query: string): string[] {
    const segments = query.toLowerCase().match(/[\u4e00-\u9fff]+|[a-z0-9]+/g) ?? []
    const tokens: string[] = []
    for (const segment of segments) {
        if (STOPWORDS.has(segment)) continue
        if (segment.length <= 2 || !/[\u4e00-\u9fff]/.test(segment)) {
            tokens.push(segment)
            continue
        }
        for (let i = 0; i < segment.length - 1; i++) {
            const gram = segment.slice(i, i + 2)
            if (!STOPWORDS.has(gram)) tokens.push(gram)
        }
    }
    return Array.from(new Set(tokens))
}

/**
 * 对单个 chunk 打分：
 * - 命中全部 token -> 1
 * - 命中部分 token -> 线性得分（低于常见阈值 0.2 时被过滤）
 * - 完全未命中 -> 0.1
 */
export function scoreChunk(content: string, query: string): number {
    const lowerContent = content.toLowerCase()
    const tokens = tokenizeQuery(query)
    if (tokens.length === 0) {
        return lowerContent.includes(query.toLowerCase()) ? 1 : 0.1
    }
    const matched = tokens.filter(token => lowerContent.includes(token)).length
    return 0.1 + 0.9 * (matched / tokens.length)
}
