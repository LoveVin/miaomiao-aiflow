import path from 'node:path'

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // 隔离开发缓存与生产产物，避免并行构建使开发模块失效。
    distDir: process.env.NODE_ENV === 'development' ? '.next' : '.next-production',
    devIndicators: false,
    reactCompiler: true,
    transpilePackages: ['@miaomiao-aiflow/ai-engine'],
    turbopack: {
        root: path.resolve(__dirname, '../..'),
        rules: {
            '*.css': {
                loaders: ['@tailwindcss/turbopack'],
                as: '*.css',
            },
        },
    },
}

export default nextConfig
