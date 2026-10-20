import { KnowledgeDetail } from '@/components/knowledge'

export default async function RecallPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <KnowledgeDetail id={id} section="recall" />
}
