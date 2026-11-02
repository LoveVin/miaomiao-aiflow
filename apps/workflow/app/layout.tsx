import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { MonitorProvider } from '@/components/providers/monitor-provider'

export const metadata: Metadata = {
    title: '喵喵AI引擎',
    description: '连接模型、知识与工具，用可视化流程构建属于你的智能应用。',
    icons: {
        icon: {
            url: '/logo.svg',
            type: 'image/svg+xml',
        },
    },
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="zh-CN">
            <body>
                <MonitorProvider>{children}</MonitorProvider>
            </body>
        </html>
    )
}
