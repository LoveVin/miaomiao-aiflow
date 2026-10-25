type ApiResponse<T> = { success: true; data: T; message?: string } | { success: false; code: string; message: string }

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
    const result = (await response.json()) as ApiResponse<T>
    if (!response.ok || !result.success) throw new Error(result.message || '请求失败')
    return result.data
}
