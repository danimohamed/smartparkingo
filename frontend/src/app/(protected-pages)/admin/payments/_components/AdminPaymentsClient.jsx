'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { apiGetAllPayments } from '@/services/AdminService'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Skeleton from '@/components/ui/Skeleton'
import { PiCreditCardDuotone, PiMagnifyingGlassDuotone, PiDownloadSimpleDuotone, PiDownloadSimpleBold } from 'react-icons/pi'
import {
    useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender,
} from '@tanstack/react-table'
import generateInvoicePdf from '@/utils/generateInvoicePdf'
import { useTranslations } from 'next-intl'

const statusColor = { PENDING: 'bg-amber-500', COMPLETED: 'bg-emerald-500', FAILED: 'bg-red-500', REFUNDED: 'bg-blue-500' }

const AdminPaymentsClient = () => {
    const t = useTranslations('admin.payments')
    const tCommon = useTranslations('admin.common')
    const tStatus = useTranslations('admin.paymentStatus')
    const tMethods = useTranslations('admin.paymentMethods')
    const tFilters = useTranslations('admin.filters')
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [globalFilter, setGlobalFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [methodFilter, setMethodFilter] = useState('')
    const [sorting, setSorting] = useState([])

    const fetchPayments = useCallback(async () => {
        try {
            const res = await apiGetAllPayments()
            setPayments(res?.data || [])
        } catch (error) {
            toast.push(<Notification type="danger" title={tCommon('error')}>{t('loadFailed')}</Notification>)
        } finally { setLoading(false) }
    }, [t, tCommon])

    const statusOptions = useMemo(() => [
        { value: '', label: tFilters('allStatuses') },
        { value: 'PENDING', label: tStatus('PENDING') },
        { value: 'COMPLETED', label: tStatus('COMPLETED') },
        { value: 'FAILED', label: tStatus('FAILED') },
        { value: 'REFUNDED', label: tStatus('REFUNDED') },
    ], [tFilters, tStatus])
    const methodOptions = useMemo(() => [
        { value: '', label: tMethods('all') },
        { value: 'WALLET', label: tMethods('WALLET') },
        { value: 'CASH', label: tMethods('CASH') },
        { value: 'CREDIT_CARD', label: tMethods('CREDIT_CARD') },
        { value: 'DEBIT_CARD', label: tMethods('DEBIT_CARD') },
        { value: 'PAYPAL', label: tMethods('PAYPAL') },
        { value: 'MOBILE_PAYMENT', label: tMethods('MOBILE_PAYMENT') },
    ], [tMethods])

    useEffect(() => { fetchPayments() }, [fetchPayments])

    const filteredData = useMemo(() => {
        let data = payments
        if (statusFilter) data = data.filter((p) => p.status === statusFilter)
        if (methodFilter) data = data.filter((p) => p.paymentMethod === methodFilter)
        return data
    }, [payments, statusFilter, methodFilter])

    const totalRevenue = useMemo(() => filteredData.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0), [filteredData])

    const exportCSV = () => {
        const headers = [t('paymentRef'), t('reservationRef'), t('amount'), t('method'), tCommon('status'), t('paidAt')]
        const rows = filteredData.map((p) => [`PAY-${String(p.id).padStart(5, '0')}`, `RES-${String(p.reservationId).padStart(5, '0')}`, p.amount, p.paymentMethod || '', p.status, p.paidAt ? new Date(p.paidAt).toLocaleString() : ''])
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click()
    }

    const columns = useMemo(() => [
        { accessorKey: 'id', header: tCommon('ref'), cell: ({ getValue }) => <span className="font-mono text-sm text-primary">PAY-{String(getValue()).padStart(5, '0')}</span>, size: 110 },
        { accessorKey: 'reservationId', header: t('reservation'), cell: ({ getValue }) => <span className="font-mono text-sm">RES-{String(getValue()).padStart(5, '0')}</span> },
        { accessorKey: 'amount', header: t('amount'), cell: ({ getValue }) => <span className="font-bold">{getValue()} MAD</span> },
        { accessorKey: 'paymentMethod', header: t('method'), cell: ({ getValue }) => getValue() ? tMethods(getValue()) : '—' },
        { accessorKey: 'status', header: tCommon('status'), cell: ({ getValue }) => <Tag className={`${statusColor[getValue()] || 'bg-gray-500'} text-white border-0`}>{tStatus(getValue())}</Tag> },
        { accessorKey: 'paidAt', header: t('paidAt'), cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleString() : '—' },
        {
            id: 'actions', header: '', size: 60, enableSorting: false,
            cell: ({ row }) => row.original.status === 'COMPLETED' ? (
                <button
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                    title={tCommon('downloadInvoice')}
                    onClick={() => generateInvoicePdf(row.original)}
                >
                    <PiDownloadSimpleBold className="text-lg" />
                </button>
            ) : null,
        },
    ], [t, tCommon, tMethods, tStatus])

    const table = useReactTable({
        data: filteredData, columns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter, onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    })

    if (loading) return (<div className="flex flex-col gap-6"><Skeleton width={200} height={28} /><Card>{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="mt-3" height={40} />))}</Card></div>)

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div><h3 className="font-bold text-lg sm:text-xl">{t('title')}</h3><p className="text-gray-500 text-xs sm:text-sm">{t('subtitle', { count: filteredData.length })}</p></div>
                <div className="flex items-center gap-3">
                    <Card className="!p-3"><div className="text-xs sm:text-sm text-gray-500">{t('revenue')}</div><div className="font-bold text-base sm:text-lg text-emerald-500">{totalRevenue.toFixed(2)} MAD</div></Card>
                    <Button size="sm" variant="twoTone" icon={<PiDownloadSimpleDuotone />} onClick={exportCSV}>{tCommon('export')}</Button>
                </div>
            </div>
            <Card>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 mb-4">
                    <div className="relative flex-1 sm:min-w-[200px] sm:max-w-md">
                        <PiMagnifyingGlassDuotone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input className="pl-9" placeholder={tCommon('search')} value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
                    </div>
                    <div className="w-full sm:w-48"><Select options={statusOptions} value={statusOptions.find((o) => o.value === statusFilter)} onChange={(o) => setStatusFilter(o?.value || '')} placeholder={tFilters('status')} /></div>
                    <div className="w-full sm:w-48"><Select options={methodOptions} value={methodOptions.find((o) => o.value === methodFilter)} onChange={(o) => setMethodFilter(o?.value || '')} placeholder={tFilters('method')} /></div>
                </div>
                {filteredData.length === 0 ? (
                    <div className="text-center py-12"><PiCreditCardDuotone className="text-6xl text-gray-300 mx-auto mb-4" /><p className="text-gray-400">{t('empty')}</p></div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="block md:hidden space-y-3">
                            {table.getRowModel().rows.map((row) => {
                                const p = row.original
                                return (
                                    <div key={row.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-sm text-primary">PAY-{String(p.id).padStart(5, '0')}</span>
                                            <Tag className={`${statusColor[p.status] || 'bg-gray-500'} text-white border-0 text-[10px]`}>{tStatus(p.status)}</Tag>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">RES-{String(p.reservationId).padStart(5, '0')}</span>
                                            <span className="text-xs text-gray-400">{p.paymentMethod ? tMethods(p.paymentMethod) : '—'}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <span className="font-bold">{p.amount} MAD</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</span>
                                                {p.status === 'COMPLETED' && (
                                                    <button
                                                        className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 min-h-[44px]"
                                                        onClick={() => generateInvoicePdf(p)}
                                                    >
                                                        <PiDownloadSimpleBold className="text-lg" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {/* Desktop table view */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full">
                                <thead>{table.getHeaderGroups().map((hg) => (<tr key={hg.id} className="text-left text-gray-500 text-sm border-b dark:border-gray-700">{hg.headers.map((h) => (<th key={h.id} className="pb-3 font-semibold cursor-pointer select-none" onClick={h.column.getToggleSortingHandler()}><div className="flex items-center gap-1">{flexRender(h.column.columnDef.header, h.getContext())}{{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted()] ?? ''}</div></th>))}</tr>))}</thead>
                                <tbody>{table.getRowModel().rows.map((row) => (<tr key={row.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">{row.getVisibleCells().map((cell) => (<td key={cell.id} className="py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>))}</tr>))}</tbody>
                            </table>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 text-sm">
                            <span className="text-gray-500 text-xs sm:text-sm">{tCommon('pageOf', { page: table.getState().pagination.pageIndex + 1, total: table.getPageCount() })}</span>
                            <div className="flex gap-2">
                                <Button size="xs" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>{tCommon('previous')}</Button>
                                <Button size="xs" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>{tCommon('next')}</Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}

export default AdminPaymentsClient
