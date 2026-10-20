import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
    title: '喵喵AI引擎 · AI 应用工作室',
    description: '连接模型、知识与工具，用可视化流程构建属于你的智能应用。',
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="zh-CN">
            <body>{children}</body>
        </html>
    )
}
