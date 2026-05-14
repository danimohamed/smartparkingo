import AuthSideVideoPanel from './AuthSideVideoPanel'
import Link from 'next/link'
import { PiArrowLeftBold } from 'react-icons/pi'

/** Served from /public/video */
const AUTH_SIDE_VIDEO_SRC = '/video/auth-side-park.mp4'

/**
 * Stitch desktop sign-in shell: left hero + right column for form.
 * Hero image is optional; falls back to a gradient-only panel if missing.
 */
export default function SignInMarketingLayout({ children }) {
    return (
        <div className="flex min-h-[100dvh] flex-col bg-park-surface text-[#1a1c1e]">
            <main className="flex w-full flex-1 overflow-hidden">
                {/* Left — hero (desktop) */}
                <section className="relative hidden w-[45%] flex-col items-center justify-center overflow-hidden bg-park-teal p-12 lg:flex">
                    <div className="absolute inset-0 bg-gradient-to-br from-park-teal via-park-teal-mid to-[#276771] opacity-95" />
                    <div className="relative z-10 w-full max-w-lg">
                        <div className="mb-6">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-black/30 transition-all hover:bg-white/15 hover:shadow-md hover:-translate-y-[1px] active:translate-y-0"
                            >
                                <PiArrowLeftBold className="text-base" aria-hidden />
                                Back to home
                            </Link>
                        </div>
                        <div className="mx-auto w-3/4">
                            <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-2xl">
                                <AuthSideVideoPanel src={AUTH_SIDE_VIDEO_SRC} />
                            </div>
                        </div>
                        <div className="mt-10 space-y-4">
                            <h2 className="font-display text-4xl font-black leading-tight tracking-tight text-white">
                                Effortless Urban <span className="text-park-gold">Mobility.</span>
                            </h2>
                            <p className="max-w-md font-sans text-lg leading-relaxed text-[#83bfcb]">
                                Experience the next generation of city parking. Precise, automated, and always available
                                when you need it.
                            </p>
                        </div>
                    </div>
                    <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-park-gold opacity-10 blur-[120px]" />
                    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#276771] opacity-20 blur-[100px]" />
                </section>

                {/* Right — form column */}
                <section className="flex w-full flex-col items-center justify-center bg-park-surface-low px-6 py-10 sm:p-12 lg:w-[55%]">
                    {children}
                </section>
            </main>

            <footer className="flex w-full flex-col items-center justify-between gap-4 border-t border-[#bfc8ca]/20 bg-park-surface px-4 py-6 text-sm font-medium text-[#5c6063] sm:flex-row sm:px-8 lg:py-8">
                <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-2 sm:text-left">
                    <span className="font-display text-lg font-bold text-park-teal">Parkingo</span>
                    <span className="text-[#5c6063]">© {new Date().getFullYear()} Parkingo Technologies. All rights reserved.</span>
                </div>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                    <span className="cursor-not-allowed text-[#5c6063] opacity-80">Privacy Policy</span>
                    <span className="cursor-not-allowed text-[#5c6063] opacity-80">Terms of Service</span>
                    <span className="cursor-not-allowed text-[#5c6063] opacity-80">Help Center</span>
                    <a className="font-semibold text-park-teal transition-colors hover:text-park-gold" href="/sign-up">
                        Sign up
                    </a>
                </div>
            </footer>
        </div>
    )
}
