export type Plugin = { name: string; desc: string; icon: string; color: string; tag: string; category: string }

export const initialPlugins: Plugin[] = [
    { name: '联网搜索', desc: '实时检索全网信息，获取最新、准确的搜索结果', icon: '搜', color: 'blue', tag: '热门', category: '效率工具' },
    { name: '网页解析器', desc: '提取网页正文、标题与结构化内容', icon: '网', color: 'violet', tag: '官方', category: '效率工具' },
    { name: '代码执行器', desc: '安全运行 Python 和 JavaScript 代码片段', icon: '</>', color: 'coral', tag: '官方', category: '数据分析' },
    { name: '图像生成', desc: '根据自然语言描述生成高质量创意图片', icon: '图', color: 'pink', tag: '热门', category: '内容创作' },
    { name: '邮件助手', desc: '连接邮箱，自动发送与管理邮件内容', icon: '邮', color: 'green', tag: '效率', category: '效率工具' },
    { name: '数据分析', desc: '读取表格数据并生成洞察与可视化图表', icon: '数', color: 'amber', tag: '数据', category: '数据分析' },
]

export const initialInstalledPlugins: string[] = ['联网搜索']
