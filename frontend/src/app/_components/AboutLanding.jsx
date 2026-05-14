'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    PiArrowRightBold,
    PiCalendarCheckDuotone,
    PiChatCircleDuotone,
    PiLightningDuotone,
    PiListDuotone,
    PiMapPinDuotone,
    PiRobotDuotone,
    PiShieldCheckDuotone,
    PiTranslateDuotone,
    PiWalletDuotone,
    PiXBold,
} from 'react-icons/pi'

import brandLogo from '@/image/3.png'

/**
 * Drop your exported assets into `frontend/public/landing/` using these names
 * (PNG or JPG — keep the extension matching the file you add):
 *
 * - driver.png            → Drivers card
 * - parkingOwner.png      → Lot owners card
 * - guard.png             → Guards card
 * - 1.png                 → phone screen content in download section (falls back to Unsplash if missing)
 * - appStore.png, googlePlay.png → store badges in download section
 * - visa.png, Mastercard.png, paypal.png → “One-click pay” row (badges)
 * - findNearby.png, reserveSlot.png, oneClickPay.png → “Built for drivers” feature rows
 *
 * If a file is missing, the UI automatically falls back to the Unsplash URLs below.
 */
const FALLBACK = {
    hero: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1400&q=80',
    findNearby: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    reserveSlot: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80',
    oneClickPay: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    audienceDriver: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80',
    audienceLot: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
    audienceGuard: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
}

/** Tries `/landing/{file}` first; on 404/error swaps to `fallback`. */
function LandingImg({ file, fallback, alt, className, loading }) {
    const localSrc = `/landing/${file}`
    const [src, setSrc] = useState(localSrc)

    useEffect(() => {
        setSrc(localSrc)
    }, [localSrc])

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            loading={loading}
            onError={() => setSrc(fallback)}
        />
    )
}

const glassCard =
    'rounded-xl border border-white/20 bg-white/80 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#1a1c1e]/75'

const AboutLanding = () => {
    const [menuOpen, setMenuOpen] = useState(false)
    const year = new Date().getFullYear()
    const t = useTranslations('landing')

    return (
        <div className="flex min-h-[100dvh] flex-col bg-park-surface text-[#1a1c1e] selection:bg-park-gold selection:text-park-teal dark:bg-[#121416] dark:text-[#f3f3f6]">
            {/* Top nav */}
            <header className="fixed top-0 z-50 w-full border-b border-black/5 bg-park-surface/80 backdrop-blur-md dark:border-white/10 dark:bg-[#1a1c1e]/80">
                <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                        <Image
                            src={brandLogo}
                            alt="Parkingo"
                            width={160}
                            height={48}
                            className="h-9 w-auto object-contain sm:h-10"
                            priority
                        />
                    </Link>

                    <div className="hidden items-center gap-6 md:flex">
                        <a
                            href="#download"
                            className="text-sm font-medium text-park-muted transition-colors hover:text-park-teal-mid dark:text-[#bfc8ca] dark:hover:text-[#94d0dc]"
                        >
                            {t('nav.downloadApp')}
                        </a>
                        <Link
                            href="/sign-in"
                            className="text-sm font-medium text-park-muted transition-colors hover:text-park-teal-mid dark:text-[#bfc8ca] dark:hover:text-[#94d0dc]"
                        >
                            {t('nav.signIn')}
                        </Link>
                        <Link
                            href="/sign-up"
                            className="rounded-lg bg-[linear-gradient(135deg,#00373e_0%,#004f59_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
                        >
                            {t('nav.signUp')}
                        </Link>
                    </div>

                    <button
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-park-teal md:hidden"
                        aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
                        onClick={() => setMenuOpen((o) => !o)}
                    >
                        {menuOpen ? <PiXBold className="text-xl" /> : <PiListDuotone className="text-xl" />}
                    </button>
                </nav>

                {menuOpen ? (
                    <div className="border-t border-black/5 bg-park-surface px-4 py-4 dark:border-white/10 dark:bg-[#1a1c1e] md:hidden">
                        <div className="flex flex-col gap-3">
                            <a
                                href="#download"
                                className="rounded-lg px-3 py-2 text-sm font-medium text-park-muted hover:bg-park-surface-low dark:text-[#bfc8ca] dark:hover:bg-white/5"
                                onClick={() => setMenuOpen(false)}
                            >
                                {t('nav.downloadApp')}
                            </a>
                            <Link
                                href="/sign-in"
                                className="rounded-lg px-3 py-2 text-sm font-medium text-park-muted hover:bg-park-surface-low dark:text-[#bfc8ca] dark:hover:bg-white/5"
                                onClick={() => setMenuOpen(false)}
                            >
                                {t('nav.signIn')}
                            </Link>
                            <Link
                                href="/sign-up"
                                className="rounded-lg bg-[linear-gradient(135deg,#00373e_0%,#004f59_100%)] px-3 py-2.5 text-center text-sm font-semibold text-white"
                                onClick={() => setMenuOpen(false)}
                            >
                                {t('nav.signUp')}
                            </Link>
                        </div>
                    </div>
                ) : null}
            </header>

            <main className="flex-1 pt-[4.25rem] sm:pt-20">
                {/* Hero */}
                <section className="relative overflow-hidden bg-park-surface px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28 dark:bg-[#121416]">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute right-0 top-0 -z-10 hidden h-full w-1/2 skew-x-12 translate-x-24 bg-park-surface-low dark:bg-white/5 lg:block"
                    />
                    <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
                        <div className="z-10">
                            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-park-teal sm:text-5xl md:text-6xl lg:text-7xl dark:text-white">
                                {t('hero.title1')}
                                <br />
                                {t('hero.title2')}
                            </h1>
                            <p className="mt-6 max-w-xl text-lg leading-relaxed text-park-muted dark:text-[#bfc8ca] sm:text-xl">
                                {t('hero.subtitle')}
                            </p>
                            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                                <Link
                                    href="/sign-in"
                                    className="inline-flex items-center justify-center rounded-lg bg-[linear-gradient(135deg,#00373e_0%,#004f59_100%)] px-8 py-4 text-center text-lg font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
                                >
                                    {t('hero.ctaSignIn')}
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-8 py-4 text-center text-lg font-bold text-park-teal shadow-sm transition-colors hover:bg-park-surface-low dark:border-white/10 dark:bg-[#1e2124] dark:text-white dark:hover:bg-white/5"
                                >
                                    {t('hero.ctaCreate')}
                                </Link>
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-xl shadow-2xl lg:h-[min(600px,70vh)]">
                            <img
                                src={FALLBACK.hero}
                                alt={t('hero.imageAlt')}
                                className="h-full min-h-[280px] w-full object-cover sm:min-h-[360px] lg:min-h-0"
                                loading="eager"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-park-teal/25 to-transparent" />
                            <div className={`absolute bottom-4 left-4 right-4 p-5 sm:bottom-6 sm:left-6 sm:right-6 ${glassCard}`}>
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-park-gold">
                                        <span className="font-display text-lg font-extrabold text-park-teal">P</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-park-teal dark:text-white">{t('hero.badgeTitle')}</p>
                                        <p className="text-xs text-park-muted dark:text-[#bfc8ca]">
                                            {t('hero.badgeSubtitle')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Parkingo */}
                <section className="bg-park-surface-low px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 dark:bg-[#1a1c1e]">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-12 max-w-2xl md:mb-16">
                            <h2 className="font-display text-3xl font-bold text-park-teal sm:text-4xl dark:text-white">
                                {t('why.title')}
                            </h2>
                            <p className="mt-3 text-lg text-park-muted dark:text-[#bfc8ca]">
                                {t('why.subtitle')}
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
                            {[
                                {
                                    icon: PiWalletDuotone,
                                    title: t('why.clarityTitle'),
                                    body: t('why.clarityBody'),
                                    box: 'bg-[#c9e3f7] dark:bg-[#314a5a]/40',
                                },
                                {
                                    icon: PiLightningDuotone,
                                    title: t('why.speedTitle'),
                                    body: t('why.speedBody'),
                                    box: 'bg-park-gold',
                                },
                                {
                                    icon: PiShieldCheckDuotone,
                                    title: t('why.supportTitle'),
                                    body: t('why.supportBody'),
                                    box: 'bg-[#afedf9] dark:bg-[#004f58]/40',
                                },
                            ].map(({ icon: Icon, title, body, box }) => (
                                <div
                                    key={title}
                                    className="rounded-xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border dark:border-white/10 dark:bg-[#1e2124]"
                                >
                                    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-lg ${box}`}>
                                        <Icon className="text-3xl text-park-teal dark:text-white" />
                                    </div>
                                    <h3 className="font-display text-2xl font-bold text-park-teal dark:text-white">{title}</h3>
                                    <p className="mt-3 leading-relaxed text-park-muted dark:text-[#bfc8ca]">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ParkBot */}
                <section className="overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 dark:bg-[#121416]">
                    <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
                            <div className="relative w-full max-w-md">
                                <div
                                    aria-hidden
                                    className="absolute -inset-4 rounded-full bg-park-teal/5 blur-3xl dark:bg-white/5"
                                />
                                <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-b from-park-surface-low to-white shadow-2xl dark:border-white/10 dark:from-[#1e2124] dark:to-[#121416]">
                                    <div className="border-b border-black/5 bg-park-teal px-4 py-3 dark:border-white/10">
                                        <div className="flex items-center gap-2">
                                            <PiRobotDuotone className="text-xl text-park-gold" />
                                            <span className="font-display text-sm font-bold text-white">ParkBot</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3 p-4">
                                        <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-park-teal px-3 py-2 text-sm text-white">
                                            {t('parkbot.demoUser')}
                                        </div>
                                        <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-park-surface-low px-3 py-2 text-sm text-[#1a1c1e] dark:bg-[#2a2d31] dark:text-[#e8e8ea]">
                                            {t('parkbot.demoBot')}
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {[t('parkbot.chip1'), t('parkbot.chip2'), t('parkbot.chip3')].map((label) => (
                                                <span
                                                    key={label}
                                                    className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-park-muted dark:border-white/10 dark:bg-[#1e2124] dark:text-[#bfc8ca]"
                                                >
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#afedf9] px-3 py-1 text-sm font-bold text-[#004f58] dark:bg-[#004f58] dark:text-[#afedf9]">
                                <PiRobotDuotone className="text-base" />
                                {t('parkbot.badge')}
                            </div>
                            <h2 className="font-display text-3xl font-bold leading-tight text-park-teal sm:text-4xl lg:text-5xl dark:text-white">
                                {t('parkbot.title')}
                            </h2>
                            <p className="mt-5 text-lg leading-relaxed text-park-muted dark:text-[#bfc8ca] sm:text-xl">
                                {t.rich('parkbot.intro', {
                                    strong: (chunks) => (
                                        <strong className="text-park-teal dark:text-white">{chunks}</strong>
                                    ),
                                })}
                            </p>
                            <ul className="mt-8 space-y-6">
                                <li className="flex gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c9e3f7] dark:bg-[#314a5a]/50">
                                        <PiTranslateDuotone className="text-xl text-park-teal dark:text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-display font-bold text-park-teal dark:text-white">
                                            {t('parkbot.feature1Title')}
                                        </h4>
                                        <p className="mt-1 text-park-muted dark:text-[#bfc8ca]">
                                            {t('parkbot.feature1Body')}
                                        </p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-park-gold">
                                        <PiChatCircleDuotone className="text-xl text-park-teal" />
                                    </div>
                                    <div>
                                        <h4 className="font-display font-bold text-park-teal dark:text-white">
                                            {t('parkbot.feature2Title')}
                                        </h4>
                                        <p className="mt-1 text-park-muted dark:text-[#bfc8ca]">
                                            {t('parkbot.feature2Body')}
                                        </p>
                                    </div>
                                </li>
                            </ul>
                            <div className="mt-10">
                                <Link
                                    href="/sign-in"
                                    className="inline-flex items-center gap-2 font-bold text-park-teal transition-all hover:gap-3 dark:text-[#94d0dc]"
                                >
                                    {t('parkbot.cta')}
                                    <PiArrowRightBold className="text-lg" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bento */}
                <section className="bg-park-surface px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 dark:bg-[#121416]">
                    <div className="mx-auto max-w-7xl">
                        <h2 className="font-display mb-10 text-center text-3xl font-bold text-park-teal sm:mb-12 sm:text-4xl dark:text-white">
                            {t('bento.title')}
                        </h2>
                        <div className="flex flex-col gap-8 lg:gap-10">
                            {/* Row 1 — Find nearby */}
                            <article className="overflow-hidden rounded-2xl border border-black/5 bg-park-teal shadow-sm dark:border-white/10">
                                <div className="grid items-stretch lg:grid-cols-2">
                                    <div className="flex flex-col justify-center gap-4 p-8 text-white sm:p-10 lg:p-12">
                                        <PiMapPinDuotone className="text-4xl text-park-gold sm:text-5xl" />
                                        <h3 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
                                            {t('bento.findTitle')}
                                        </h3>
                                        <p className="max-w-xl text-sm leading-relaxed text-[#83bfcb] sm:text-base">
                                            {t('bento.findBody')}
                                        </p>
                                    </div>
                                    <div className="relative min-h-[220px] bg-black/15 sm:min-h-[260px] lg:min-h-[min(100%,380px)]">
                                        <LandingImg
                                            file="findNearby.png"
                                            fallback={FALLBACK.findNearby}
                                            alt={t('bento.findAlt')}
                                            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            </article>

                            {/* Row 2 — Reserve slot */}
                            <article className="overflow-hidden rounded-2xl border border-black/5 bg-park-gold shadow-sm dark:border-white/10">
                                <div className="grid items-stretch lg:grid-cols-2">
                                    <div className="flex flex-col justify-center gap-4 p-8 sm:p-10 lg:order-2 lg:p-12">
                                        <PiCalendarCheckDuotone className="text-4xl text-park-teal sm:text-5xl" />
                                        <h3 className="font-display text-2xl font-bold text-park-teal sm:text-3xl lg:text-4xl">
                                            {t('bento.reserveTitle')}
                                        </h3>
                                        <p className="max-w-xl text-base font-medium leading-relaxed text-park-teal/90">
                                            {t('bento.reserveBody')}
                                        </p>
                                    </div>
                                    <div className="relative min-h-[220px] bg-park-teal/10 sm:min-h-[260px] lg:order-1 lg:min-h-[min(100%,380px)]">
                                        <LandingImg
                                            file="reserveSlot.png"
                                            fallback={FALLBACK.reserveSlot}
                                            alt={t('bento.reserveAlt')}
                                            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            </article>

                            {/* Row 3 — One-click pay */}
                            <article className="overflow-hidden rounded-2xl border border-black/5 bg-park-surface-high shadow-sm dark:border-white/10 dark:bg-[#2a2d31]">
                                <div className="grid items-stretch lg:grid-cols-2">
                                    <div className="flex flex-col justify-center gap-6 p-8 sm:p-10 lg:p-12">
                                        <div>
                                            <PiWalletDuotone className="mb-3 text-4xl text-park-teal dark:text-[#94d0dc] sm:text-5xl" />
                                            <h3 className="font-display text-2xl font-bold text-park-teal dark:text-white sm:text-3xl lg:text-4xl">
                                                {t('bento.payTitle')}
                                            </h3>
                                            <p className="mt-3 max-w-xl text-park-muted dark:text-[#bfc8ca] sm:text-base">
                                                {t('bento.payBody')}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                            {[
                                                { src: '/landing/Mastercard.png', alt: 'Mastercard' },
                                                { src: '/landing/visa.png', alt: 'Visa' },
                                                { src: '/landing/paypal.png', alt: 'PayPal' },
                                            ].map(({ src, alt }) => (
                                                <span
                                                    key={alt}
                                                    className="flex h-14 min-w-[5.5rem] items-center justify-center rounded-lg border border-black/10 bg-white px-4 py-2 shadow-sm dark:border-white/10 dark:bg-[#1e2124]"
                                                >
                                                    <img
                                                        src={src}
                                                        alt={alt}
                                                        className="max-h-9 w-auto max-w-[5.25rem] object-contain sm:max-h-10 sm:max-w-[6rem]"
                                                        loading="lazy"
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="relative min-h-[220px] bg-black/5 sm:min-h-[260px] lg:min-h-[min(100%,380px)] dark:bg-black/20">
                                        <LandingImg
                                            file="oneClickPay.png"
                                            fallback={FALLBACK.oneClickPay}
                                            alt={t('bento.payAlt')}
                                            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                {/* Audiences */}
                <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 dark:bg-[#1a1c1e]">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid gap-10 md:grid-cols-3 md:gap-12">
                            {[
                                {
                                    title: t('audiences.driversTitle'),
                                    body: t('audiences.driversBody'),
                                    file: 'driver.png',
                                    fallback: FALLBACK.audienceDriver,
                                    alt: t('audiences.driversAlt'),
                                },
                                {
                                    title: t('audiences.ownersTitle'),
                                    body: t('audiences.ownersBody'),
                                    file: 'parkingOwner.png',
                                    fallback: FALLBACK.audienceLot,
                                    alt: t('audiences.ownersAlt'),
                                },
                                {
                                    title: t('audiences.guardsTitle'),
                                    body: t('audiences.guardsBody'),
                                    file: 'guard.png',
                                    fallback: FALLBACK.audienceGuard,
                                    alt: t('audiences.guardsAlt'),
                                },
                            ].map(({ title, body, file, fallback, alt }) => (
                                <div key={title} className="group">
                                    <div className="mb-6 h-64 overflow-hidden rounded-xl">
                                        <LandingImg
                                            file={file}
                                            fallback={fallback}
                                            alt={alt}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    </div>
                                    <h4 className="font-display text-2xl font-bold text-park-teal dark:text-white">{title}</h4>
                                    <p className="mt-2 leading-relaxed text-park-muted dark:text-[#bfc8ca]">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Download */}
                <section
                    id="download"
                    className="relative flex min-h-[520px] items-center overflow-hidden bg-park-teal px-4 py-16 sm:px-6 sm:py-20 lg:min-h-[600px] lg:px-8 lg:py-24"
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,79,89,0.35),transparent_55%)] opacity-60"
                    />
                    <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <div className="text-white">
                            <h2 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
                                {t('download.title1')}{' '}
                                <span className="block text-[#83bfcb]">{t('download.title2')}</span>
                            </h2>
                            <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#83bfcb] sm:text-xl">
                                {t('download.subtitle')}
                            </p>
                            <div className="mt-8">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">
                                    {t('download.from')}
                                </p>
                                <div className="flex flex-wrap items-center gap-4">
                                    <span
                                        className="inline-block rounded-xl shadow-xl ring-1 ring-white/15 transition-transform active:scale-[0.98]"
                                        aria-label={t('download.appStoreAria')}
                                    >
                                        <img
                                            src="/landing/appStore.png"
                                            alt=""
                                            className="h-14 w-auto object-contain sm:h-[3.25rem]"
                                            width={180}
                                            height={56}
                                            loading="lazy"
                                        />
                                    </span>
                                    <span
                                        className="inline-flex items-center justify-center rounded-xl shadow-xl ring-1 ring-white/15 transition-transform active:scale-[0.98]"
                                        aria-label={t('download.playStoreAria')}
                                    >
                                        {/* googlePlay.png is the mark-only asset; fixed square keeps it crisp next to the App Store squircle */}
                                        <img
                                            src="/landing/googlePlay.png"
                                            alt=""
                                            className="h-[3.25rem] w-[3.25rem] object-contain p-1 sm:h-14 sm:w-14"
                                            width={56}
                                            height={56}
                                            loading="lazy"
                                        />
                                    </span>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-white/70">
                                {t('download.note')}
                            </p>
                        </div>
                        <div className="flex justify-center lg:justify-end">
                            <div className="relative aspect-[1/2] w-[min(100%,320px)] overflow-hidden rounded-[2.75rem] border-[10px] border-[#1a1c1e] bg-[#1a1c1e] shadow-[0_0_80px_rgba(0,0,0,0.45)] transition-transform duration-500 lg:rotate-2 lg:hover:rotate-0">
                                <LandingImg
                                    file="1.png"
                                    fallback={FALLBACK.hero}
                                    alt={t('download.phoneAlt')}
                                    className="h-full w-full object-cover object-top"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="mt-auto border-t border-black/5 bg-park-surface-low px-4 py-10 dark:border-white/10 dark:bg-[#121416] sm:px-6">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
                    <div className="font-display text-xl font-black text-park-teal dark:text-white">Parkingo</div>
                    <div className="flex flex-wrap justify-center gap-8 text-sm font-medium uppercase tracking-wide text-park-muted dark:text-[#bfc8ca]">
                        <span className="cursor-not-allowed opacity-70">{t('footer.terms')}</span>
                        <span className="cursor-not-allowed opacity-70">{t('footer.privacy')}</span>
                    </div>
                    <p className="text-center text-sm uppercase tracking-wide text-park-muted dark:text-[#bfc8ca]">
                        {t('footer.rights', { year })}
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default AboutLanding
