import type { ReactNode } from 'react'

import { PortalShell } from '@/components/shared'

export default function KnowledgeLayout({ children }: { children: ReactNode }) {
    return <PortalShell>{children}</PortalShell>
}
