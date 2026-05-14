// Reads the user's preferred locale from the `locale` cookie (set by the
// LocaleSwitcher / server action). Defaults to French ('fr') so the backend
// returns French copy whenever the user hasn't picked otherwise.
function readLocaleCookie() {
    if (typeof document === 'undefined') return 'fr'
    const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/)
    return m ? decodeURIComponent(m[1]) : 'fr'
}

const AxiosRequestIntrceptorConfigCallback = (config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('sp_token')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        // Forward locale to Spring Boot's AcceptHeaderLocaleResolver
        const locale = readLocaleCookie()
        config.headers['Accept-Language'] = locale
    } else {
        // SSR fallback — always French (per project policy)
        config.headers['Accept-Language'] = 'fr'
    }
    return config
}

export default AxiosRequestIntrceptorConfigCallback
