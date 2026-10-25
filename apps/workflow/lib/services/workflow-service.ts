import { apiRequest } from '@/lib/services/api-client'
import type { DemoExecution, FlowEdge, FlowNode } from '@/types/workflow'

export type WorkflowResponse = { version: number; nodes: FlowNode[]; edges: FlowEdge[]; updatedAt: string }
export type RunWorkflowResponse = DemoExecution & { totalTokens: number; status: 'SUCCESS' | 'ERROR' }

export const workflowService = {
    get: (appId: string) => apiRequest<WorkflowResponse>(`/api/apps/${appId}/workflow`),
    save: (appId: string, data: { nodes: FlowNode[]; edges: FlowEdge[]; name?: string }) =>
        apiRequest<WorkflowResponse>(`/api/apps/${appId}/workflow`, { method: 'PUT', body: JSON.stringify(data) }),
    run: (appId: string, input: Record<string, string>) =>
        apiRequest<RunWorkflowResponse>(`/api/apps/${appId}/workflow/run`, {
            method: 'POST',
            body: JSON.stringify({ inputs: input }),
        }),
    getExecutions: (appId: string) => apiRequest<{ items: RunWorkflowResponse[] }>(`/api/apps/${appId}/workflow/executions`),
    publish: (appId: string) => apiRequest<{ version: number }>(`/api/apps/${appId}/publish`, { method: 'POST' }),
    unpublish: (appId: string) => apiRequest<void>(`/api/apps/${appId}/unpublish`, { method: 'POST' }),
}
