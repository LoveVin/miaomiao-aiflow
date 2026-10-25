import { redirect } from 'next/navigation'

import { Flow } from '@/components/flow'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const userId = await getAuthenticatedUser()
    const app = await prisma.app.findFirst({ where: { id, userId, isDeleted: false } })
    if (!app) redirect('/')
    return <Flow key={app.id} appId={app.id} appName={app.name} />
}
