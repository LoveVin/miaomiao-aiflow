import type { ParamType } from '@/types/workflow'

export const PARAM_TYPE_LABELS: Record<ParamType, string> = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    array: '数组',
    object: '对象',
}

export const PARAM_TYPE_OPTIONS: { value: ParamType; label: string }[] = Object.entries(PARAM_TYPE_LABELS).map(([value, label]) => ({
    value: value as ParamType,
    label,
}))
