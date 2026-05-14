import AuthSideVideoPanel from './AuthSideVideoPanel'
import Link from 'next/link'
import { PiArrowLeftBold } from 'react-icons/pi'

/** Served from /public/video */
const AUTH_SIDE_VIDEO_SRC = '/video/auth-side-park.mp4'
export default function SignUpMarketingLayout({ children }) {
    return (
        <div className="flex min-h-[100dvh] flex-col bg-[#1a1c1e] text-[#f0f0f3]">
            <main className="flex w-full flex-1 overflow-hidden">
                {/* Left — hero (desktop) */}
                <section className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-park-teal to-park-teal-mid p-16 lg:flex">
                    <div className="pointer-events-none absolute -right-[10%] -top-[10%] h-96 w-96 rounded-full bg-[#94d0dc]/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-[5%] -left-[5%] h-64 w-64 rounded-full bg-park-gold/5 blur-2xl" />

                    <div className="relative z-10">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-black/30 transition-all hover:bg-white/15 hover:shadow-md hover:-translate-y-[1px] active:translate-y-0"
                        >
                            <PiArrowLeftBold className="text-base" aria-hidden />
                            Back to home
                        </Link>
                    </div>

                    {/* Animation first */}
                    <div className="relative z-10 mt-10 flex w-full items-center justify-center">
                        <div className="w-3/4 overflow-hidden rounded-2xl drop-shadow-2xl">
                            <div className="relative aspect-square w-full">
                                <AuthSideVideoPanel src={AUTH_SIDE_VIDEO_SRC} />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h1 className="mt-12 font-display text-5xl font-extrabold leading-tight tracking-tight text-white">
                            Find your space <br /> in the <span className="text-[#94d0dc]">urban flux.</span>
                        </h1>
                        <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-[#83bfcb]">
                            Experience the next evolution of city mobility. Precise, automated, and seamlessly integrated
                            into your journey.
                        </p>
                    </div>

                    <div className="relative z-10">
                        <p className="text-sm font-medium uppercase tracking-widest text-[#94d0dc]/60">
                            The Urban Flux Series © 2024
                        </p>
                    </div>
                </section>

                {/* Right — form column */}
                <section className="flex w-full flex-col items-center justify-center bg-[#1a1c1e] px-8 py-12 lg:w-[55%]">
                    {children}
                </section>
            </main>
        </div>
    )
}

