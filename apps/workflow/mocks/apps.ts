export type App = {
    id: string
    name: string
    desc: string
    icon?: string
    color: string
    status: string
    time: string
    owner: string
}

export const initialApps: App[] = [
    {
        id: '1',
        name: '小红书爆款文案助手',
        desc: '输入产品卖点，自动生成种草文案与热门标题',
        icon: '文',
        color: 'coral',
        status: '已发布',
        time: '10 分钟前',
        owner: 'mine',
    },
    {
        id: '2',
        name: '智能客服助手',
        desc: '基于企业知识库，精准回答客户常见问题',
        icon: '客',
        color: 'violet',
        status: '草稿',
        time: '昨天',
        owner: 'mine',
    },
    {
        id: '3',
        name: '每日资讯摘要',
        desc: '聚合行业资讯，每天生成一份精炼早报',
        icon: '讯',
        color: 'blue',
        status: '已发布',
        time: '3 天前',
        owner: 'shared',
    },
]
