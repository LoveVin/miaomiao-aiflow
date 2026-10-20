export function readMockStorage<T>(key: string, fallback: T): T {
    try {
        const saved = localStorage.getItem(key)
        return saved ? (JSON.parse(saved) as T) : fallback
    } catch {
        return fallback
    }
}

export function writeMockStorage<T>(key: string, value: T) {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch {
        // Keep changes in memory when browser storage is unavailable.
    }
}
