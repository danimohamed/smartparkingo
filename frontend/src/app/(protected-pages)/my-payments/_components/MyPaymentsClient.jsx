'use client'
import { useState, useMemo, useCallback, useRef } from 'react'
import { useMyPayments } from '@/hooks/usePayments'
import { useTranslations } from 'next-intl'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import TableRowSkeleton from '@/components/shared/loaders/TableRowSkeleton'
import StatsSkeleton from '@/components/shared/loaders/StatsSkeleton'
import dayjs from 'dayjs'
import Link from 'next/link'
import {
    PiCreditCardDuotone,
    PiReceiptDuotone,
    PiMagnifyingGlassBold,
    PiWalletDuotone,
    PiMoneyDuotone,
    PiArrowSquareOutBold,
    PiDownloadSimpleBold,
    PiFunnelBold,
    PiCarDuotone,
    PiCalendarCheckDuotone,
    PiXBold,
    PiCheckCircleDuotone,
} from 'react-icons/pi'
import generateInvoicePdf from '@/utils/generateInvoicePdf'

const { Tr, Th, Td, THead, TBody } = Table

const methodIcon = {
    WALLET: PiWalletDuotone,
    CREDIT_CARD: PiCreditCardDuotone,
    DEBIT_CARD: PiCreditCardDuotone,
    PAYPAL: PiMoneyDuotone,
    MOBILE_PAYMENT: PiMoneyDuotone,
    CASH: PiMoneyDuotone,
}

// --- PDF Invoice generation (uses shared utility) ---
const generateInvoice = (payment) => generateInvoicePdf(payment)

// --- Payment Detail Modal ---
const PaymentDetailModal = ({ payment, isOpen, onClose, t }) => {
    if (!payment) return null
    const Icon = methodIcon[payment.paymentMethod] || PiMoneyDuotone

    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={480}>
            <div className="flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h5 className="font-bold text-lg">{t('modal.title')}</h5>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <PiXBold className="text-gray-400" />
                    </button>
                </div>

                {/* Amount hero */}
                <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 ${
                        payment.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-500/20' :
                        payment.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-500/20' :
                        'bg-red-100 dark:bg-red-500/20'
                    }`}>
                        {payment.status === 'COMPLETED' ?
                            <PiCheckCircleDuotone className="text-2xl text-emerald-500" /> :
                            <Icon className={`text-2xl ${payment.status === 'PENDING' ? 'text-amber-500' : 'text-red-500'}`} />
                        }
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{payment.amount} <span className="text-lg text-gray-400">MAD</span></div>
                    <StatusBadge status={payment.status} />
                </div>

                {/* Details */}
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                    {[
                        { label: t('modal.invoice'), value: `INV-${String(payment.id).padStart(5, '0')}` },
                        { label: t('modal.reservation'), value: `RES-${String(payment.reservationId).padStart(5, '0')}` },
                        { label: t('modal.method'), value: payment.paymentMethod || t('modal.methodNotSet') },
                        { label: t('modal.date'), value: payment.paidAt ? dayjs(payment.paidAt).format('MMM DD, YYYY HH:mm') : '—' },
                    ].map((d) => (
                        <div key={d.label} className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{d.label}</span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{d.value}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {payment.status === 'COMPLETED' && (
                        <Button className="flex-1" size="sm" variant="solid" onClick={() => generateInvoice(payment)}>
                            <PiDownloadSimpleBold className="mr-1.5" /> {t('modal.downloadInvoice')}
                        </Button>
                    )}
                    <Link href="/my-reservations" className="flex-1">
                        <Button className="w-full" size="sm" variant="plain">
                            <PiArrowSquareOutBold className="mr-1.5" /> {t('modal.viewReservation')}
                        </Button>
                    </Link>
                </div>
            </div>
        </Dialog>
    )
}

// --- Main Component ---
const MyPaymentsClient = () => {
    const { data: payments = [], isLoading } = useMyPayments()
    const t = useTranslations('myPayments')

    const STATUS_OPTIONS = [
        { value: 'ALL', label: t('filter.allStatuses') },
        { value: 'PENDING', label: t('filter.statusPending') },
        { value: 'COMPLETED', label: t('filter.statusCompleted') },
        { value: 'FAILED', label: t('filter.statusFailed') },
        { value: 'REFUNDED', label: t('filter.statusRefunded') },
    ]

    const METHOD_OPTIONS = [
        { value: 'ALL', label: t('filter.allMethods') },
        { value: 'WALLET', label: t('filter.methodWallet') },
        { value: 'CREDIT_CARD', label: t('filter.methodCreditCard') },
        { value: 'DEBIT_CARD', label: t('filter.methodDebitCard') },
        { value: 'PAYPAL', label: t('filter.methodPaypal') },
        { value: 'MOBILE_PAYMENT', label: t('filter.methodMobile') },
        { value: 'CASH', label: t('filter.methodCash') },
    ]

    const [statusFilter, setStatusFilter] = useState('ALL')
    const [methodFilter, setMethodFilter] = useState('ALL')
    const [search, setSearch] = useState('')
    const [dateRange, setDateRange] = useState([null, null])
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [detailOpen, setDetailOpen] = useState(false)

    // --- Filtered data ---
    const filteredData = useMemo(() => {
        let list = [...payments]

        if (statusFilter !== 'ALL') list = list.filter((p) => p.status === statusFilter)
        if (methodFilter !== 'ALL') list = list.filter((p) => p.paymentMethod === methodFilter)

        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter((p) =>
                String(p.id).includes(q) ||
                String(p.reservationId).includes(q) ||
                (p.paymentMethod || '').toLowerCase().includes(q)
            )
        }

        const [from, to] = dateRange
        if (from) list = list.filter((p) => p.paidAt && dayjs(p.paidAt).isAfter(dayjs(from).startOf('day')))
        if (to) list = list.filter((p) => p.paidAt && dayjs(p.paidAt).isBefore(dayjs(to).endOf('day')))

        // Sort newest first
        list.sort((a, b) => new Date(b.paidAt || 0) - new Date(a.paidAt || 0))

        return list
    }, [payments, statusFilter, methodFilter, search, dateRange])

    // --- Stats ---
    const stats = useMemo(() => {
        const total = payments.reduce((s, p) => p.status === 'COMPLETED' ? s + p.amount : s, 0)
        return {
            totalPaid: total,
            completed: payments.filter((p) => p.status === 'COMPLETED').length,
            pending: payments.filter((p) => p.status === 'PENDING').length,
            refunded: payments.filter((p) => p.status === 'REFUNDED').length,
        }
    }, [payments])

    const openDetail = (payment) => {
        setSelectedPayment(payment)
        setDetailOpen(true)
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {/* Header */}
            <div>
                <h3 className="font-bold text-lg sm:text-xl">{t('title')}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">{t('subtitle')}</p>
            </div>

            {/* Stats */}
            {isLoading ? (
                <StatsSkeleton count={4} />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: t('stat.totalPaid'), value: `${stats.totalPaid.toFixed(2)} MAD`, icon: PiMoneyDuotone, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', iconColor: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' },
                        { label: t('stat.completed'), value: stats.completed, icon: PiCheckCircleDuotone, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400', iconColor: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600' },
                        { label: t('stat.pending'), value: stats.pending, icon: PiReceiptDuotone, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400', iconColor: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' },
                        { label: t('stat.refunded'), value: stats.refunded, icon: PiCreditCardDuotone, color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400', iconColor: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600' },
                    ].map((s) => (
                        <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconColor}`}>
                                    <s.icon className="text-lg" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium opacity-70">{s.label}</p>
                                    <p className="text-xl font-bold">{s.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <Card bodyClass="p-3">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <PiFunnelBold className="text-base" />
                        <span className="text-xs font-semibold">{t('filter.label')}</span>
                    </div>
                    <div className="w-full sm:w-52">
                        <Input size="sm" placeholder={t('filter.searchPlaceholder')}
                            prefix={<PiMagnifyingGlassBold className="text-gray-400" />}
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="w-full sm:w-40">
                        <Select instanceId="pay-status-filter" size="sm" options={STATUS_OPTIONS}
                            value={STATUS_OPTIONS.find((o) => o.value === statusFilter)}
                            onChange={(opt) => setStatusFilter(opt?.value || 'ALL')} isSearchable={false} />
                    </div>
                    <div className="w-full sm:w-40">
                        <Select instanceId="pay-method-filter" size="sm" options={METHOD_OPTIONS}
                            value={METHOD_OPTIONS.find((o) => o.value === methodFilter)}
                            onChange={(opt) => setMethodFilter(opt?.value || 'ALL')} isSearchable={false} />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex-1 sm:w-36 sm:flex-none">
                            <DatePicker size="sm" placeholder={t('filter.from')} value={dateRange[0]}
                                onChange={(d) => setDateRange([d, dateRange[1]])} clearable />
                        </div>
                        <div className="flex-1 sm:w-36 sm:flex-none">
                            <DatePicker size="sm" placeholder={t('filter.to')} value={dateRange[1]}
                                onChange={(d) => setDateRange([dateRange[0], d])} clearable />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Table */}
            {isLoading ? (
                <Card bodyClass="p-0">
                    <Table>
                        <THead>
                            <Tr>
                                {[t('table.payment'), t('table.reservation'), t('table.amount'), t('table.method'), t('table.status'), t('table.date'), ''].map((h) => (
                                    <Th key={h}>{h}</Th>
                                ))}
                            </Tr>
                        </THead>
                        <TableRowSkeleton columns={7} rows={6} />
                    </Table>
                </Card>
            ) : filteredData.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={PiCreditCardDuotone}
                        title={payments.length === 0 ? t('empty.title') : t('empty.titleFiltered')}
                        description={payments.length === 0 ? t('empty.description') : ''}
                        action={
                            payments.length > 0 ? (
                                <Button size="sm" variant="plain"
                                    onClick={() => { setStatusFilter('ALL'); setMethodFilter('ALL'); setSearch(''); setDateRange([null, null]) }}>
                                    {t('empty.clearFilters')}
                                </Button>
                            ) : null
                        }
                    />
                </Card>
            ) : (
                <>
                    {/* Mobile card view */}
                    <div className="block md:hidden space-y-3">
                        {filteredData.map((p) => {
                            const Icon = methodIcon[p.paymentMethod] || PiMoneyDuotone
                            return (
                                <Card key={p.id} className="cursor-pointer" bodyClass="p-4" onClick={() => openDetail(p)}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <PiReceiptDuotone className="text-lg text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm">INV-{String(p.id).padStart(5, '0')}</p>
                                            <p className="text-xs text-gray-400">RES-{String(p.reservationId).padStart(5, '0')}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-sm">{p.amount} MAD</p>
                                            <StatusBadge status={p.status} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-1">
                                            <Icon className="text-gray-400" />
                                            <span>{p.paymentMethod || '—'}</span>
                                        </div>
                                        <span>{p.paidAt ? dayjs(p.paidAt).format('MMM DD, HH:mm') : '—'}</span>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Desktop table view */}
                    <Card bodyClass="p-0" className="hidden md:block">
                        <div className="overflow-x-auto">
                        <Table>
                            <THead>
                                <Tr>
                                    <Th>{t('table.payment')}</Th>
                                    <Th>{t('table.reservation')}</Th>
                                    <Th>{t('table.amount')}</Th>
                                    <Th>{t('table.method')}</Th>
                                    <Th>{t('table.status')}</Th>
                                    <Th>{t('table.date')}</Th>
                                    <Th></Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {filteredData.map((p) => {
                                    const Icon = methodIcon[p.paymentMethod] || PiMoneyDuotone
                                    return (
                                        <Tr key={p.id} className="cursor-pointer" onClick={() => openDetail(p)}>
                                            <Td>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                                        <PiReceiptDuotone className="text-lg text-primary" />
                                                    </div>
                                                    <span className="font-semibold text-sm">INV-{String(p.id).padStart(5, '0')}</span>
                                                </div>
                                            </Td>
                                            <Td><span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">RES-{String(p.reservationId).padStart(5, '0')}</span></Td>
                                            <Td><span className="font-bold text-gray-900 dark:text-gray-100">{p.amount} MAD</span></Td>
                                            <Td>
                                                <div className="flex items-center gap-1.5">
                                                    <Icon className="text-gray-400" />
                                                    <span className="text-sm">{p.paymentMethod || '—'}</span>
                                                </div>
                                            </Td>
                                            <Td><StatusBadge status={p.status} /></Td>
                                            <Td className="text-sm text-gray-500">{p.paidAt ? dayjs(p.paidAt).format('MMM DD, YYYY HH:mm') : '—'}</Td>
                                            <Td>
                                                <div className="flex gap-1">
                                                    {p.status === 'COMPLETED' && (
                                                        <Button size="xs" variant="plain"
                                                            onClick={(e) => { e.stopPropagation(); generateInvoice(p) }}
                                                            className="text-gray-400 hover:text-primary">
                                                            <PiDownloadSimpleBold className="text-lg" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </Td>
                                        </Tr>
                                    )
                                })}
                            </TBody>
                        </Table>
                        </div>
                    {/* Summary footer */}
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm text-gray-500">
                            {t('summary.showing', { count: filteredData.length, total: payments.length })}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {t('summary.total', { amount: filteredData.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0).toFixed(2) })}
                        </span>
                    </div>
                </Card>

                    {/* Mobile summary */}
                    <div className="block md:hidden text-center text-xs text-gray-500 mt-2">
                        {t('summary.showing', { count: filteredData.length, total: payments.length })} — {t('summary.total', { amount: filteredData.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0).toFixed(2) })}
                    </div>
                </>
            )}

            {/* Detail Modal */}
            <PaymentDetailModal payment={selectedPayment} isOpen={detailOpen} onClose={() => setDetailOpen(false)} t={t} />
        </div>
    )
}

export default MyPaymentsClient

