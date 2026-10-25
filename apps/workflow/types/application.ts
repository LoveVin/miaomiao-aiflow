import type { DemoExecution } from './workflow'

export type ApplicationLogRecord = DemoExecution & {
    tokens: number
    user: string
    source: string
    displayTime?: string
}

export type ApplicationDemoKey = {
    id: string
    name: string
    active: boolean
    created: string
    key: string
    calls: number
    lastUsed: string
}

export type ApplicationMetric = {
    label: string
    value: string
    note: string
    icon: 'workflow' | 'sparkles' | 'key' | 'check' | 'clock'
}

export type ApplicationMonitorData = {
    days: number
    stats: ApplicationMetric[]
    dates: string[]
    line: string
    axis: number[]
    bars: { input: number; output: number }[]
    ranking: { name: string; calls: number; tokens: string; lastUsed: string }[]
}
