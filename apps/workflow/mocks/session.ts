export type Profile = { name: string; email: string }

export const initialProfile: Profile = { name: '林小喵', email: 'miaomiao@example.com' }

export function createDemoProfile(name: string, email: string): Profile {
    return { name: name.trim() || (email ? email.split('@')[0] : initialProfile.name), email: email || initialProfile.email }
}
