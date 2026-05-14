/**
 * Production-safe logger utility.
 * Logs are suppressed in production builds.
 */
const isDev = process.env.NODE_ENV !== 'production'

const logger = {
    log: (...args) => isDev && console.log(...args),
    warn: (...args) => isDev && console.warn(...args),
    error: (...args) => isDev && console.error(...args),
    debug: (...args) => isDev && console.debug(...args),
}

export default logger

