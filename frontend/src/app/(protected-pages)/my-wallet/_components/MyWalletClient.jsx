'use client'
import { useState, useMemo } from 'react'
import {
    useWalletBalance,
    useWalletTransactions,
    useTopUpWallet,
    usePayWithWallet,
} from '@/hooks/useWallet'
import { useMyReservations } from '@/hooks/useReservations'
import { useTranslations } from 'next-intl'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import Dialog from '@/components/ui/Dialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import Skeleton from '@/components/ui/Skeleton'
import dayjs from 'dayjs'
import {
    PiWalletDuotone,
    PiCreditCardDuotone,
    PiArrowUpBold,
    PiArrowDownBold,
    PiArrowCounterClockwiseBold,
    PiCheckCircleDuotone,
    PiWarningDuotone,
    PiFunnelBold,
    PiTrendUpBold,
    PiReceiptDuotone,
    PiShieldCheckDuotone,
    PiChartLineUpBold,
} from 'react-icons/pi'

const PRESET_AMOUNTS = [50, 100, 200, 500]

// --- Balance Card ---
const BalanceCard = ({ balance, isLoading, t }) => (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-4 right-4">
            <PiShieldCheckDuotone className="text-2xl text-white/30" />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <PiWalletDuotone className="text-xl" />
                </div>
                <span className="text-sm font-medium opacity-80">{t('balance.available')}</span>
            </div>
            {isLoading ? (
                <Skeleton width="60%" height={40} className="bg-white/20 rounded-lg" />
            ) : (
                <div className="text-4xl font-bold mb-1">
                    {(balance || 0).toFixed(2)} <span className="text-xl font-normal opacity-80">MAD</span>
                </div>
            )}
            <p className="text-xs opacity-50 mt-2">{t('balance.label')}</p>
        </div>
    </div>
)

// --- Top Up Form ---
const TopUpForm = ({ balance, t }) => {
    const topUpMutation = useTopUpWallet()
    const [amount, setAmount] = useState('')
    const [cardNumber, setCardNumber] = useState('')
    const [cardHolder, setCardHolder] = useState('')
    const [expiryDate, setExpiryDate] = useState('')
    const [cvv, setCvv] = useState('')

    const formatCard = (val) => {
        const nums = val.replace(/\D/g, '').slice(0, 16)
        return nums.replace(/(\d{4})(?=\d)/g, '$1 ')
    }

    /** MM/YY with slash, e.g. 12/25 */
    const formatExpiry = (val) => {
        const nums = val.replace(/\D/g, '').slice(0, 4)
        if (nums.length <= 2) return nums
        return `${nums.slice(0, 2)}/${nums.slice(2)}`
    }

    const handleTopUp = async (e) => {
        e.preventDefault()
        const amt = parseFloat(amount)
        if (!amt || amt < 10) {
            toast.push(<Notification title={t('topUp.toast.invalidAmountTitle')} type="danger">{t('topUp.toast.invalidAmountMsg')}</Notification>)
            return
        }
        const rawCard = cardNumber.replaceAll(' ', '')
        if (!rawCard || rawCard.length < 13 || rawCard.length > 19) {
            toast.push(<Notification title={t('topUp.toast.invalidCardTitle')} type="danger">{t('topUp.toast.invalidCardMsg')}</Notification>)
            return
        }
        if (!cardHolder.trim()) {
            toast.push(<Notification title={t('topUp.toast.missingInfoTitle')} type="danger">{t('topUp.toast.missingInfoMsg')}</Notification>)
            return
        }
        if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
            toast.push(<Notification title={t('topUp.toast.invalidExpiryTitle')} type="danger">{t('topUp.toast.invalidExpiryMsg')}</Notification>)
            return
        }
        if (!cvv || cvv.length < 3 || cvv.length > 4) {
            toast.push(<Notification title={t('topUp.toast.invalidCvvTitle')} type="danger">{t('topUp.toast.invalidCvvMsg')}</Notification>)
            return
        }
        try {
            await topUpMutation.mutateAsync({ amount: amt, cardNumber: rawCard, cardHolder, expiryDate, cvv })
            setAmount(''); setCardNumber(''); setCardHolder(''); setExpiryDate(''); setCvv('')
            toast.push(<Notification title={t('topUp.toast.successTitle')} type="success">{t('topUp.toast.successMsg', { amount: amt })}</Notification>)
        } catch (e) {
            const msg = e?.response?.data?.message || ''
            toast.push(<Notification title={t('topUp.toast.failedTitle')} type="danger">{msg}</Notification>)
        }
    }

    return (
        <div className="space-y-5">
            <h5 className="font-bold text-lg">{t('topUp.title')}</h5>

            {/* Preset amounts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((a) => (
                    <button key={a} onClick={() => setAmount(String(a))}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                            amount === String(a)
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {a} MAD
                    </button>
                ))}
            </div>

            {/* Custom amount */}
            <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{t('topUp.customAmount')}</label>
                <input type="number" min="10" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder={t('topUp.enterAmount')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition" />
            </div>

            {/* Credit Card Visual */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-5 text-white">
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-medium opacity-50 tracking-wider">CREDIT CARD</span>
                    <div className="flex gap-1">
                        <div className="w-6 h-6 rounded-full bg-red-500 opacity-80" />
                        <div className="w-6 h-6 rounded-full bg-amber-500 opacity-80 -ml-2" />
                    </div>
                </div>
                <div className="mb-5">
                    <input value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))}
                        placeholder="0000 0000 0000 0000"
                        className="w-full bg-transparent text-xl font-mono tracking-[0.2em] outline-none placeholder-gray-500" maxLength={19} />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] uppercase opacity-40 block mb-0.5 tracking-wider">Card Holder</label>
                        <input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)}
                            placeholder={t('topUp.holderPlaceholder')}
                            className="w-full bg-transparent text-sm font-medium outline-none placeholder-gray-500" />
                    </div>
                    <div className="w-24">
                        <label className="text-[10px] uppercase opacity-40 block mb-0.5 tracking-wider">Expiry</label>
                        <input value={expiryDate} onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                            placeholder="00/00" inputMode="numeric" autoComplete="cc-exp"
                            className="w-full bg-transparent text-sm font-mono font-medium tracking-wide outline-none placeholder-gray-500" maxLength={5} />
                    </div>
                    <div className="w-16">
                        <label className="text-[10px] uppercase opacity-40 block mb-0.5 tracking-wider">CVV</label>
                        <input type="password" value={cvv} onChange={(e) => setCvv(e.target.value)}
                            placeholder="***"
                            className="w-full bg-transparent text-sm font-medium outline-none placeholder-gray-500" maxLength={4} />
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-400 text-center">{t('topUp.secureNote')}</p>

            <button onClick={handleTopUp} disabled={topUpMutation.isPending || !amount}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50">
                {topUpMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('topUp.processing')}
                    </span>
                ) : (
                    t('topUp.addBtn', { amount: amount || '0' })
                )}
            </button>
        </div>
    )
}

// --- Pay Reservation Form ---
const PayReservationForm = ({ balance, t }) => {
    const payMutation = usePayWithWallet()
    const { data: reservations = [] } = useMyReservations()
    const [selectedReservation, setSelectedReservation] = useState('')
    const [confirmOpen, setConfirmOpen] = useState(false)

    // Active reservations (potential pending payments)
    const pendingReservations = useMemo(
        () => reservations.filter((r) => r.status === 'ACTIVE'),
        [reservations],
    )

    const selectedRes = pendingReservations.find((r) => String(r.id) === selectedReservation)
    const insufficientBalance = selectedRes && balance < selectedRes.totalPrice

    const handlePay = async () => {
        try {
            await payMutation.mutateAsync({ reservationId: parseInt(selectedReservation) })
            setSelectedReservation('')
            setConfirmOpen(false)
            toast.push(<Notification title={t('pay.toast.successTitle')} type="success">{t('pay.toast.successMsg')}</Notification>)
        } catch (e) {
            toast.push(<Notification title={t('pay.toast.failedTitle')} type="danger">{e?.response?.data?.message || ''}</Notification>)
        }
    }

    return (
        <div className="space-y-5">
            <h5 className="font-bold text-lg">{t('pay.title')}</h5>

            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl px-4 py-3">
                <PiWalletDuotone className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm text-indigo-700 dark:text-indigo-300">
                    {t('pay.yourBalance', { amount: (balance || 0).toFixed(2) })}
                </span>
            </div>

            {pendingReservations.length === 0 ? (
                <EmptyState icon={PiCheckCircleDuotone} title={t('pay.noActiveTitle')} description={t('pay.noActiveDesc')} />
            ) : (
                <>
                    <div className="space-y-2">
                        {pendingReservations.map((r) => (
                            <button key={r.id} onClick={() => setSelectedReservation(String(r.id))}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                    selectedReservation === String(r.id)
                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <PiReceiptDuotone className="text-lg text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                {r.parkingName} — {t('pay.slot')} {r.slotNumber}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {dayjs(r.startTime).format('MMM DD HH:mm')} → {dayjs(r.endTime).format('HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-gray-100">{r.totalPrice} MAD</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Insufficient balance warning */}
                    {insufficientBalance && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3">
                            <PiWarningDuotone className="text-red-500 text-lg flex-shrink-0" />
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {t('pay.insufficientBalance', { amount: (selectedRes.totalPrice - balance).toFixed(2) })}
                            </p>
                        </div>
                    )}

                    <button onClick={() => setConfirmOpen(true)}
                        disabled={payMutation.isPending || !selectedReservation || insufficientBalance}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50">
                        {t('pay.payBtn')}
                    </button>
                </>
            )}

            {/* Confirm dialog */}
            <Dialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onRequestClose={() => setConfirmOpen(false)} width={420}>
                <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-4">
                        <PiWalletDuotone className="text-3xl text-emerald-500" />
                    </div>
                    <h5 className="font-bold mb-2">{t('pay.confirmTitle')}</h5>
                    <p className="text-gray-500 text-sm mb-1">
                        {t('pay.confirmDesc', { amount: selectedRes?.totalPrice })}
                    </p>
                    <p className="text-xs text-gray-400 mb-6">
                        {t('pay.remainingBalance', { amount: ((balance || 0) - (selectedRes?.totalPrice || 0)).toFixed(2) })}
                    </p>
                    <div className="flex gap-3 w-full">
                        <Button className="flex-1" onClick={() => setConfirmOpen(false)}>{t('pay.cancelBtn')}</Button>
                        <Button className="flex-1" variant="solid" loading={payMutation.isPending} onClick={handlePay}>
                            {payMutation.isPending ? t('pay.processingBtn') : t('pay.confirmBtn')}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

// --- Transaction History ---
const TransactionHistory = ({ transactions, isLoading, t }) => {
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [dateRange, setDateRange] = useState([null, null])

    const TX_FILTER_OPTIONS = [
        { value: 'ALL', label: t('history.allTransactions') },
        { value: 'TOP_UP', label: t('history.topUps') },
        { value: 'PAYMENT', label: t('history.payments') },
        { value: 'REFUND', label: t('history.refunds') },
    ]

    const filtered = useMemo(() => {
        let list = [...transactions]
        if (typeFilter !== 'ALL') list = list.filter((tx) => tx.type === typeFilter)
        const [from, to] = dateRange
        if (from) list = list.filter((tx) => tx.createdAt && dayjs(tx.createdAt).isAfter(dayjs(from).startOf('day')))
        if (to) list = list.filter((tx) => tx.createdAt && dayjs(tx.createdAt).isBefore(dayjs(to).endOf('day')))
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        return list
    }, [transactions, typeFilter, dateRange])

    const weeklySpent = useMemo(() => {
        const oneWeekAgo = dayjs().subtract(7, 'day')
        return transactions
            .filter((tx) => tx.type === 'PAYMENT' && tx.createdAt && dayjs(tx.createdAt).isAfter(oneWeekAgo))
            .reduce((sum, tx) => sum + (tx.amount || 0), 0)
    }, [transactions])

    const TX_TYPE_CONFIG = {
        TOP_UP: { color: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: PiArrowUpBold, sign: '+', label: t('txLabels.TOP_UP'), textColor: 'text-emerald-600' },
        PAYMENT: { color: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-500/10', icon: PiArrowDownBold, sign: '-', label: t('txLabels.PAYMENT'), textColor: 'text-red-500' },
        REFUND: { color: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-500/10', icon: PiArrowCounterClockwiseBold, sign: '+', label: t('txLabels.REFUND'), textColor: 'text-emerald-600' },
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h5 className="font-bold text-base sm:text-lg">{t('history.title')}</h5>
                {weeklySpent > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                        <PiChartLineUpBold />
                        <span>{t('history.weeklySpent', { amount: weeklySpent.toFixed(2) })}</span>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                <div className="w-full sm:w-40">
                    <Select instanceId="wallet-tx-type-filter" size="sm" options={TX_FILTER_OPTIONS}
                        value={TX_FILTER_OPTIONS.find((o) => o.value === typeFilter)}
                        onChange={(opt) => setTypeFilter(opt?.value || 'ALL')} isSearchable={false} />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:w-32 sm:flex-none">
                        <DatePicker size="sm" placeholder={t('history.from')} value={dateRange[0]}
                            onChange={(d) => setDateRange([d, dateRange[1]])} clearable />
                    </div>
                    <div className="flex-1 sm:w-32 sm:flex-none">
                        <DatePicker size="sm" placeholder={t('history.to')} value={dateRange[1]}
                            onChange={(d) => setDateRange([dateRange[0], d])} clearable />
                    </div>
                </div>
            </div>

            {/* Transactions list */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse">
                            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                            </div>
                            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={PiCreditCardDuotone}
                    title={transactions.length === 0 ? t('history.empty.title') : t('history.empty.titleFiltered')}
                    description={transactions.length === 0 ? t('history.empty.description') : t('history.empty.descFiltered')}
                    action={
                        transactions.length > 0 ? (
                            <Button size="sm" variant="plain" onClick={() => { setTypeFilter('ALL'); setDateRange([null, null]) }}>
                                {t('history.empty.clearFilters')}
                            </Button>
                        ) : null
                    }
                />
            ) : (
                <div className="space-y-2">
                    {filtered.map((tx) => {
                        const cfg = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.PAYMENT
                        const Icon = cfg.icon
                        return (
                            <div key={tx.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <div className={`w-10 h-10 rounded-xl ${cfg.color} flex items-center justify-center text-white flex-shrink-0`}>
                                    <Icon className="text-lg" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                        {tx.description || cfg.label}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {tx.createdAt ? dayjs(tx.createdAt).format('MMM DD, YYYY HH:mm') : '—'}
                                        {tx.cardLast4 && (
                                            <span className="ml-2 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                                •••• {tx.cardLast4}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className={`text-sm font-bold ${cfg.textColor}`}>
                                        {cfg.sign}{tx.amount?.toFixed(2)} MAD
                                    </p>
                                    <StatusBadge status={tx.type} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// --- Spending Chart ---
const SpendingChart = ({ transactions, t }) => {
    const chartData = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = dayjs().subtract(6 - i, 'day')
            return { label: d.format('ddd'), date: d, amount: 0 }
        })
        transactions.filter((tx) => tx.type === 'PAYMENT' && tx.createdAt).forEach((tx) => {
            const txDay = dayjs(tx.createdAt).format('YYYY-MM-DD')
            const item = days.find((d) => d.date.format('YYYY-MM-DD') === txDay)
            if (item) item.amount += tx.amount || 0
        })
        return days
    }, [transactions])

    const maxAmount = Math.max(...chartData.map((d) => d.amount), 1)

    return (
        <div>
            <h6 className="font-bold text-sm text-gray-600 dark:text-gray-400 mb-4">{t('chart.title')}</h6>
            <div className="flex items-end gap-2 h-32">
                {chartData.map((d) => (
                    <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-bold text-gray-500">
                            {d.amount > 0 ? `${d.amount.toFixed(0)}` : ''}
                        </span>
                        <div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-purple-400 transition-all duration-500"
                            style={{ height: `${Math.max((d.amount / maxAmount) * 100, 4)}%`, minHeight: 4 }} />
                        <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- Main Component ---
const MyWalletClient = () => {
    const { data: walletData, isLoading: walletLoading } = useWalletBalance()
    const { data: transactions = [], isLoading: txLoading } = useWalletTransactions()
    const t = useTranslations('myWallet')

    const balance = walletData?.balance ?? 0
    const [activeTab, setActiveTab] = useState('topup')

    const stats = useMemo(() => {
        const totalIn = transactions.filter((t) => t.type === 'TOP_UP' || t.type === 'REFUND').reduce((s, t) => s + (t.amount || 0), 0)
        const totalOut = transactions.filter((t) => t.type === 'PAYMENT').reduce((s, t) => s + (t.amount || 0), 0)
        return { totalIn, totalOut, txCount: transactions.length }
    }, [transactions])

    return (
        <div className="flex flex-col gap-4 sm:gap-6 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h3 className="font-bold text-lg sm:text-xl">{t('title')}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">{t('subtitle')}</p>
            </div>

            {/* Top section: Balance + Mini stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <BalanceCard balance={balance} isLoading={walletLoading} t={t} />
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex-1 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                            <PiTrendUpBold className="text-lg text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">{t('stats.totalIn')}</p>
                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{stats.totalIn.toFixed(2)} MAD</p>
                        </div>
                    </div>
                    <div className="flex-1 rounded-2xl bg-red-50 dark:bg-red-500/10 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                            <PiArrowDownBold className="text-lg text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-red-600/70 dark:text-red-400/70 font-medium">{t('stats.totalOut')}</p>
                            <p className="text-lg font-bold text-red-700 dark:text-red-400">{stats.totalOut.toFixed(2)} MAD</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spending chart */}
            {transactions.length > 0 && (
                <Card>
                    <SpendingChart transactions={transactions} t={t} />
                </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {[
                    { key: 'topup', label: t('tabs.topUp'), icon: PiArrowUpBold },
                    { key: 'pay', label: t('tabs.pay'), icon: PiReceiptDuotone },
                    { key: 'history', label: t('tabs.history'), icon: PiCreditCardDuotone },
                ].map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === tab.key
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <tab.icon className="text-base" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <Card>
                <div className="p-1">
                    {activeTab === 'topup' && <TopUpForm balance={balance} t={t} />}
                    {activeTab === 'pay' && <PayReservationForm balance={balance} t={t} />}
                    {activeTab === 'history' && <TransactionHistory transactions={transactions} isLoading={txLoading} t={t} />}
                </div>
            </Card>
        </div>
    )
}

export default MyWalletClient

