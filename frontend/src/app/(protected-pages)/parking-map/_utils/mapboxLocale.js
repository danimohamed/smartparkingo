/**
 * Mapbox locale helpers — Arabic RTL + dynamic label switching.
 *
 * Two problems we fix here:
 *  1. Without the official `mapbox-gl-rtl-text` plugin, Arabic letters render
 *     disconnected and reversed because Mapbox uses HarfBuzz only when the
 *     plugin is present. The plugin must be registered ONCE per page load,
 *     BEFORE any map instance is created (Mapbox enforces this).
 *  2. Mapbox styles default to `name` (English/Latin). When the app locale is
 *     Arabic we must rewrite every symbol layer's `text-field` to `name_ar`
 *     (with a `name` fallback for places that have no Arabic translation).
 */

const RTL_PLUGIN_URL =
    'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.3.0/mapbox-gl-rtl-text.js'

let rtlPluginLoaded = false

/**
 * Register the RTL text plugin on the global `mapboxgl`. Safe to call many
 * times — only the first call actually triggers the network request.
 */
export function ensureRtlPlugin(mapboxgl) {
    if (!mapboxgl || rtlPluginLoaded) return
    try {
        // setRTLTextPlugin signature: (url, callback, lazy)
        // `lazy=true` defers the actual fetch until the first RTL glyph is
        // requested, which keeps non-Arabic users from paying the cost.
        mapboxgl.setRTLTextPlugin(RTL_PLUGIN_URL, null, true)
        rtlPluginLoaded = true
    } catch (_) {
        // Plugin already set in another component — that's fine.
        rtlPluginLoaded = true
    }
}

/**
 * Apply a `name_<locale>` field with a `name` fallback to every symbol layer
 * in the current style. Call this inside a `style.load` handler.
 *
 * IMPORTANT: We must only rewrite layers whose existing `text-field` already
 * reads from a `name` / `name_*` property. Road-shield layers (highway refs
 * like "N1", "A7") use `ref` as their text source — overwriting those with
 * `name` blanks them out, leaving empty white shield icons on the map.
 */
export function applyMapLanguage(map, locale) {
    if (!map || !locale) return
    const lang = String(locale).toLowerCase().slice(0, 2)
    // Mapbox supports: ar, en, es, fr, de, it, ja, ko, mul, pt, ru, vi, zh-Hans, zh-Hant
    const supported = ['ar', 'en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'pt', 'ru', 'vi', 'zh']
    if (!supported.includes(lang)) return

    const field = ['coalesce', ['get', `name_${lang}`], ['get', 'name']]

    // Recursively check whether a `text-field` expression references a `name`
    // property (i.e. this is a place/POI/street label, not a road shield ref).
    const referencesName = (expr) => {
        if (expr == null) return false
        if (typeof expr === 'string') {
            // Token form: "{name}" or "{name_en}" etc.
            return /\{name(_[a-z-]+)?\}/i.test(expr)
        }
        if (Array.isArray(expr)) {
            // Expression form: ["get", "name"] / ["get", "name_en"] / nested
            if (expr[0] === 'get' && typeof expr[1] === 'string') {
                return /^name(_[a-z-]+)?$/i.test(expr[1])
            }
            return expr.some(referencesName)
        }
        return false
    }

    try {
        const layers = map.getStyle()?.layers || []
        for (const layer of layers) {
            if (layer.type !== 'symbol') continue
            const current = map.getLayoutProperty(layer.id, 'text-field')
            if (!referencesName(current)) continue
            try {
                map.setLayoutProperty(layer.id, 'text-field', field)
            } catch (_) {
                /* some layers reject this — ignore */
            }
        }
    } catch (_) {
        /* style not ready — caller will retry on next style.load */
    }
}

export function getCurrentLocale() {
    if (typeof document === 'undefined') return 'en'
    try {
        const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/)
        if (match && match[1]) return decodeURIComponent(match[1])
    } catch (_) { /* ignore */ }
    if (document.documentElement?.lang) return document.documentElement.lang
    if (typeof navigator !== 'undefined' && navigator.language) return navigator.language
    return 'en'
}
