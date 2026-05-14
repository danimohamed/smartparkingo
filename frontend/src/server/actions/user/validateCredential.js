'use server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

const validateCredential = async (values) => {
    const { email, password } = values

    try {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
            return null
        }

        const json = await res.json()
        const data = json.data

        return {
            id: String(data.id),
            userName: data.fullName,
            email: data.email,
            avatar: '',
            authority: [data.role.toLowerCase()],
            token: data.token,
        }
    } catch {
        return null
    }
}

export default validateCredential
