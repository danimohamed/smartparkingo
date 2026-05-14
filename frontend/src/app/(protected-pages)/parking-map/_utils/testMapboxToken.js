export async function testMapboxToken(token) {
    if (!token) {
        return { valid: false, error: 'No token provided' }
    }

    try {
        const res = await fetch(
            `https://api.mapbox.com/tokens/v2?access_token=${token}`
        )

        if (res.ok) {
            const data = await res.json()
            return { valid: true, data }
        }

        return { valid: false, error: `HTTP ${res.status}: ${res.statusText}` }
    } catch (err) {
        return { valid: false, error: err.message }
    }
}

