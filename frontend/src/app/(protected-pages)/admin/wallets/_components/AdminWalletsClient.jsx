'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { apiGetAllWallets, apiGetWalletTransactionsByUser } from '@/services/AdminService'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Dialog from '@/components/ui/Dialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Skeleton from '@/components/ui/Skeleton'
import { PiWalletDuotone, PiMagnifyingGlassDuotone, PiEyeDuotone, PiDownloadSimpleDuotone, PiArrowUpDuotone, PiArrowDownDuotone } from 'react-icons/pi'
import {
    useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender,
} from '@tanstack/react-table'
import { useTranslations } from 'next-intl'

const txTypeColor = { TOP_UP: 'bg-emerald-500', PAYMENT: 'bg-blue-500', REFUND: 'bg-amber-500' }

const AdminWalletsClient = () => {
    const t = useTranslations('admin.wallets')
    const tCommon = useTranslations('admin.common')
    const [wallets, setWallets] = useState([])
    const [loading, setLoading] = useState(true)
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState([])

    // Transactions dialog
    const [txDialogOpen, setTxDialogOpen] = useState(false)
    const [txUser, setTxUser] = useState(null)
    const [transactions, setTransactions] = useState([])
    const [txLoading, setTxLoading] = useState(false)
    const [txTypeFilter, setTxTypeFilter] = useState('')

    const fetchWallets = useCallback(async () => {
        try {
            const res = await apiGetAllWallets()
            setWallets(res?.data || [])
        } catch (error) {
            toast.push(<Notification type="danger" title={tCommon('error')}>{t('loadFailed')}</Notification>)
        } finally { setLoading(false) }
    }, [t, tCommon])

    const txFilterOptions = useMemo(() => [
        { value: '', label: t('allTypes') },
        { value: 'TOP_UP', label: t('topUp') },
        { value: 'PAYMENT', label: t('payment') },
        { value: 'REFUND', label: t('refund') },
    ], [t])

    useEffect(() => { fetchWallets() }, [fetchWallets])

    const handleViewTransactions = async (wallet) => {
        setTxUser(wallet)
        setTxDialogOpen(true)
        setTxLoading(true)
        setTxTypeFilter('')
        try {
            const res = await apiGetWalletTransactionsByUser(wallet.userId)
            setTransactions(res?.data || [])
        } catch (error) {
            toast.push(<Notification type="danger" title={tCommon('error')}>{t('loadTxFailed')}</Notification>)
        } finally { setTxLoading(false) }
    }

    const filteredTx = useMemo(() => {
        if (!txTypeFilter) return transactions
        return transactions.filter((tx) => tx.type === txTypeFilter)
    }, [transactions, txTypeFilter])

    const totalBalance = useMemo(() => wallets.reduce((s, w) => s + (w.balance || 0), 0), [wallets])

    const exportCSV = () => {
        const headers = [t('walletRef'), t('user'), t('email'), t('balance'), t('lastUpdated')]
        const rows = wallets.map((w) => [`WLT-${String(w.id).padStart(5, '0')}`, w.fullName, w.email, w.balance, w.updatedAt ? new Date(w.updatedAt).toLocaleString() : ''])
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'wallets.csv'; a.click()
    }

    const columns = useMemo(() => [
        { accessorKey: 'id', header: tCommon('ref'), cell: ({ getValue }) => <span className="font-mono text-sm text-primary">WLT-{String(getValue()).padStart(5, '0')}</span>, size: 110 },
        { accessorKey: 'fullName', header: t('user'), cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
        { accessorKey: 'email', header: t('email') },
        { accessorKey: 'balance', header: t('balance'), cell: ({ getValue }) => <span className={`font-bold ${getValue() > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{(getValue() || 0).toFixed(2)} MAD</span> },
        { accessorKey: 'updatedAt', header: t('lastUpdated'), cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleString() : '—' },
        {
            id: 'actions', header: tCommon('actions'),
            cell: ({ row }) => (
                <Button size="xs" variant="twoTone" icon={<PiEyeDuotone />}
                    onClick={() => handleViewTransactions(row.original)}>{t('transactions')}</Button>
            ),
            size: 140,
        },
    ], [t, tCommon])

    const table = useReactTable({
        data: wallets, columns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter, onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    })

    if (loading) return (<div className="flex flex-col gap-4 sm:gap-6"><Skeleton width={200} height={28} /><Card>{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="mt-3" height={40} />))}</Card></div>)

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h3 className="text-xl sm:text-2xl font-bold">{t('title')}</h3><p className="text-gray-500">{t('subtitle', { count: wallets.length })}</p></div>
                <div className="flex items-center gap-3">
                    <Card className="!p-3"><div className="text-sm text-gray-500">{t('totalBalance')}</div><div className="font-bold text-lg text-emerald-500">{totalBalance.toFixed(2)} MAD</div></Card>
                    <Button size="sm" variant="twoTone" icon={<PiDownloadSimpleDuotone />} onClick={exportCSV}>{tCommon('export')}</Button>
                </div>
            </div>
            <Card>
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-full sm:flex-1 sm:max-w-md">
                        <PiMagnifyingGlassDuotone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input className="pl-9" placeholder={t('user') + ', ' + t('email')} value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
                    </div>
                </div>
                {wallets.length === 0 ? (
                    <div className="text-center py-12"><PiWalletDuotone className="text-6xl text-gray-300 mx-auto mb-4" /><p className="text-gray-400">{t('empty')}</p></div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="block md:hidden space-y-3">
                            {table.getRowModel().rows.map((row) => {
                                const w = row.original
                                return (
                                    <div key={row.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate">{w.fullName}</p>
                                                <p className="text-xs text-gray-400 truncate">{w.email}</p>
                                            </div>
                                            <span className={`font-bold ${w.balance > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{(w.balance || 0).toFixed(2)} MAD</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <span className="font-mono text-xs text-gray-400">WLT-{String(w.id).padStart(5, '0')}</span>
                                            <Button size="xs" variant="twoTone" className="min-h-[44px]" icon={<PiEyeDuotone />}
                                                onClick={() => handleViewTransactions(w)}>{t('transactions')}</Button>
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
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 text-sm gap-2">
                            <span className="text-gray-500">{tCommon('pageOf', { page: table.getState().pagination.pageIndex + 1, total: table.getPageCount() })}</span>
                            <div className="flex gap-2">
                                <Button size="xs" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>{tCommon('previous')}</Button>
                                <Button size="xs" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>{tCommon('next')}</Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>

            {/* Transactions Dialog */}
            <Dialog isOpen={txDialogOpen} onClose={() => setTxDialogOpen(false)} width={700}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div>
                        <h5 className="font-bold text-base sm:text-lg">{t('history')}</h5>
                        <p className="text-sm text-gray-500 break-all">{txUser?.fullName} ({txUser?.email})</p>
                    </div>
                    <Tag className="bg-emerald-500 text-white border-0 text-sm w-fit">{(txUser?.balance || 0).toFixed(2)} MAD</Tag>
                </div>

                <div className="mb-4 w-full sm:w-48">
                    <Select options={txFilterOptions} value={txFilterOptions.find((o) => o.value === txTypeFilter)} onChange={(o) => setTxTypeFilter(o?.value || '')} placeholder={t('filterByType')} />
                </div>

                {txLoading ? (
                    <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={50} />)}</div>
                ) : filteredTx.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">{t('noTransactions')}</div>
                ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {filteredTx.map((tx) => (
                            <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 gap-2">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${tx.type === 'TOP_UP' ? 'bg-emerald-100 text-emerald-600' : tx.type === 'PAYMENT' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {tx.type === 'TOP_UP' ? <PiArrowUpDuotone /> : <PiArrowDownDuotone />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{tx.description || tx.type}</p>
                                        <p className="text-xs text-gray-500">
                                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                                             {tx.cardLast4 && <span> • {t('cardLast4', { last4: tx.cardLast4 })}</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold text-sm ${tx.type === 'TOP_UP' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {tx.type === 'TOP_UP' ? '+' : '-'}{tx.amount} MAD
                                    </span>
                                     <Tag className={`${txTypeColor[tx.type] || 'bg-gray-500'} text-white border-0 text-xs`}>{txFilterOptions.find((o) => o.value === tx.type)?.label || tx.type}</Tag>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <Button size="sm" onClick={() => setTxDialogOpen(false)}>{tCommon('close')}</Button>
                </div>
            </Dialog>
        </div>
    )
}

export default AdminWalletsClient

