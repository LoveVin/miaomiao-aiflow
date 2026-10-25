import { Database, GitBranch, Globe, Play, Sparkles, Square } from 'lucide-react'

import type { NodeKind } from '@/types/workflow'

export const ICON_MAP = {
    start: Play,
    output: Square,
    model: Sparkles,
    knowledge: Database,
    http: Globe,
    condition: GitBranch,
}

const nodeColors: Record<NodeKind, string> = {
    start: 'bg-[#3d7de0]',
    output: 'bg-[#e7944d]',
    model: 'bg-[#7b61d6]',
    knowledge: 'bg-[#3d94a8]',
    http: 'bg-[#45a274]',
    condition: 'bg-[#7b61d6]',
}

export function getNodeColor(type: NodeKind) {
    return nodeColors[type]
}

export const getColor = getNodeColor
