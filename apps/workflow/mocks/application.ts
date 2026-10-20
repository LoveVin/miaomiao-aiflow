import type { ApplicationDemoKey, ApplicationLogRecord, ApplicationMonitorData } from '@/types/application'

export const initialApplicationKeys: ApplicationDemoKey[] = [
    {
        id: 'design-production',
        name: '生产环境',
        active: true,
        created: '2025/05/21',
        key: 'DEMO-ONLY-NOT-A-CREDENTIAL-8X2k',
        calls: 683,
        lastUsed: '2 分钟前（演示）',
    },
]

export function createApplicationDemoKey(name: string, id: string, now: number): ApplicationDemoKey {
    return {
        id,
        name: name.trim(),
        active: true,
        created: new Date(now).toLocaleDateString('zh-CN'),
        key: `DEMO-ONLY-NOT-A-CREDENTIAL-${id}`,
        calls: 0,
        lastUsed: '从未使用',
    }
}

export function makeApplicationDemoLogs(now: number): ApplicationLogRecord[] {
    const rows: [string, number, number, string, number][] = [
        ['今天 14:32:18', 1.82, 320, '林小喵', 0],
        ['今天 11:06:42', 2.14, 386, '林小喵', 0],
        ['昨天 18:24:09', 1.65, 298, 'API 调用', 1],
        ['昨天 16:48:31', 2.37, 412, 'API 调用', 1],
        ['5月20日 10:15:26', 1.94, 354, '林小喵', 3],
        ['5月19日 17:42:08', 2.05, 377, 'API 调用', 4],
    ]
    return rows.map((row, index) => ({
        id: `design-demo-${index}`,
        time: new Date(now - row[4] * 86400000).toISOString(),
        displayTime: row[0],
        duration: row[1] * 1000,
        success: true,
        input: { topic: '小红书文案示例' },
        output: '这是设计稿演示输出，没有调用真实模型。',
        steps: [{ id: 'demo', label: '设计稿示例', detail: '示例执行成功，非真实服务调用。' }],
        demo: true,
        tokens: row[2],
        user: row[3],
        source: index > 1 ? 'API' : '网页应用',
    }))
}

export function getApplicationDemoMonitor(range: string, now: number): ApplicationMonitorData {
    const days = range === 'all' ? 30 : Number(range)
    const factor = days === 1 ? 0.16 : days === 7 ? 1 : 4.2
    return {
        days,
        stats: [
            { label: '总调用次数', value: Math.round(1286 * factor).toLocaleString('zh-CN'), note: '+18.2%', icon: 'workflow' },
            { label: 'Token 消耗', value: `${(82.4 * factor).toFixed(1)}K`, note: '+12.6%', icon: 'sparkles' },
            { label: 'API Key 数', value: '3', note: '2 个活跃', icon: 'key' },
            { label: '成功率', value: '99.8%', note: '+0.3%', icon: 'check' },
            { label: '平均耗时', value: '1.92s', note: '-8.4%', icon: 'clock' },
        ],
        dates: Array.from({ length: 7 }, (_, index) => {
            const date = new Date(now - (6 - index) * (days === 1 ? 3600000 : Math.max(1, Math.round(days / 7)) * 86400000))
            return days === 1 ? `${date.getHours()}:00` : `${date.getMonth() + 1}/${date.getDate()}`
        }),
        line:
            days === 1
                ? 'M0 170 C70 180,100 80,160 110 S260 180,320 100 S450 140,500 80 S560 100,600 62'
                : days === 7
                  ? 'M0 182 C55 165,80 174,120 146 S205 134,245 112 S325 125,370 85 S455 102,500 60 S565 68,600 36'
                  : 'M0 190 C70 120,100 160,160 140 S250 80,320 110 S430 40,500 65 S570 20,600 12',
        axis: [400, 300, 200, 100].map(label => Math.round(label * factor)),
        bars: [46, 62, 51, 78, 67, 88, 74].map(height => ({
            input: Math.min(96, height + (days === 1 ? -12 : days === 7 ? 0 : 8)),
            output: Math.round(height * 0.58),
        })),
        ranking: [
            { name: '生产环境', calls: Math.round(683 * factor), tokens: `${(42.8 * factor).toFixed(1)}K`, lastUsed: '2 分钟前' },
            { name: '测试环境', calls: Math.round(412 * factor), tokens: `${(28.6 * factor).toFixed(1)}K`, lastUsed: '1 小时前' },
        ],
    }
}
