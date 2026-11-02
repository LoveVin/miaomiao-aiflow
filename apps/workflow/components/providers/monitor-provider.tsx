'use client'

import { MiaoMiaoProvider } from '@miaomiao/monitor-react'
import type { ReactNode } from 'react'

export function MonitorProvider({ children }: { children: ReactNode }) {
    return <MiaoMiaoProvider dsn={process.env.NEXT_PUBLIC_MONITOR_DSN ?? ''}>{children}</MiaoMiaoProvider>
}
