import { Flow } from '@/components/flow'
import { getWorkflowAppName } from '@/mocks/workflow'

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <Flow key={id} appId={id} appName={getWorkflowAppName(id)} />
}
