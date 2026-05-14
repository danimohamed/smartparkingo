'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { apiGetAllReservations, apiAdminCancelReservation } from '@/services/AdminService'
import { apiGetAllParkings } from '@/services/ParkingService'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Skeleton from '@/components/ui/Skeleton'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { PiCalendarCheckDuotone, PiMagnifyingGlassDuotone, PiXCircleDuotone, PiDownloadSimpleDuotone, PiDownloadSimpleBold } from 'react-icons/pi'
import {
    useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender,
} from '@tanstack/react-table'
import generateInvoicePdf from '@/utils/generateInvoicePdf'
import { useTranslations } from 'next-intl'

const statusColor = { ACTIVE: 'bg-emerald-500', COMPLETED: 'bg-blue-500', CANCELLED: 'bg-red-500', NO_SHOW: 'bg-orange-500' }
const AdminReservationsClient = () => {
    const t = useTranslations('admin.reservations')
    const tCommon = useTranslations('admin.common')
    const tStatus = useTranslations('admin.status')
    const tFilters = useTranslations('admin.filters')
    const [reservations, setReservations] = useState([])
    const [parkings, setParkings] = useState([])
    const [loading, setLoading] = useState(true)
    const [globalFilter, setGlobalFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [parkingFilter, setParkingFilter] = useState('')
    const [sorting, setSorting] = useState([])
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [cancelTarget, setCancelTarget] = useState(null)
    const [cancelLoading, setCancelLoading] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const [resRes, parkRes] = await Promise.all([apiGetAllReservations(), apiGetAllParkings()])
            setReservations(resRes?.data || [])
            setParkings(parkRes?.data || [])
        } catch (error) {
            toast.push(<Notification type="danger" title={tCommon('error')}>{tCommon('failedLoadData')}</Notification>)
        } finally { setLoading(false) }
    }, [tCommon])

    useEffect(() => { fetchData() }, [fetchData])

    const handleCancel = async () => {
        if (!cancelTarget) return
        setCancelLoading(true)
        try {
            await apiAdminCancelReservation(cancelTarget.id)
            toast.push(<Notification type="success" title={tCommon('success')}>{t('cancelled')}</Notification>)
            setCancelDialogOpen(false)
            fetchData()
        } catch (error) {
            toast.push(<Notification type="danger" title={tCommon('error')}>{t('cancelFailed')}</Notification>)
        } finally { setCancelLoading(false) }
    }

    const statusOptions = useMemo(() => [
        { value: '', label: tFilters('allStatuses') },
        { value: 'ACTIVE', label: tStatus('ACTIVE') },
        { value: 'COMPLETED', label: tStatus('COMPLETED') },
        { value: 'CANCELLED', label: tStatus('CANCELLED') },
        { value: 'NO_SHOW', label: tStatus('NO_SHOW') },
    ], [tFilters, tStatus])

    const filteredData = useMemo(() => {
        let data = reservations
        if (statusFilter) data = data.filter((r) => r.status === statusFilter)
        if (parkingFilter) data = data.filter((r) => r.parkingName === parkingFilter)
        return data
    }, [reservations, statusFilter, parkingFilter])

    const parkingOptions = useMemo(() => [
        { value: '', label: tFilters('allParkings') },
        ...parkings.map((p) => ({ value: p.name, label: p.name })),
    ], [parkings, tFilters])

    const exportCSV = () => {
        const headers = [tCommon('ref'), t('user'), t('parking'), t('slot'), t('start'), t('end'), t('price'), tCommon('status')]
        const rows = filteredData.map((r) => [`RES-${String(r.id).padStart(5, '0')}`, r.userFullName, r.parkingName, r.slotNumber, new Date(r.startTime).toLocaleString(), new Date(r.endTime).toLocaleString(), r.totalPrice, r.status])
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'reservations.csv'; a.click()
    }

    const columns = useMemo(() => [
        { accessorKey: 'id', header: tCommon('ref'), cell: ({ getValue }) => <span className="font-mono text-sm text-primary">RES-{String(getValue()).padStart(5, '0')}</span>, size: 110 },
        { accessorKey: 'userFullName', header: t('user'), cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
        { accessorKey: 'parkingName', header: t('parking') },
        { accessorKey: 'slotNumber', header: t('slot') },
        { accessorKey: 'startTime', header: t('start'), cell: ({ getValue }) => <span className="text-sm">{new Date(getValue()).toLocaleString()}</span> },
        { accessorKey: 'endTime', header: t('end'), cell: ({ getValue }) => <span className="text-sm">{new Date(getValue()).toLocaleString()}</span> },
        { accessorKey: 'totalPrice', header: t('price'), cell: ({ getValue }) => <span className="font-bold">{getValue()} MAD</span> },
        { accessorKey: 'status', header: tCommon('status'), cell: ({ getValue }) => <Tag className={`${statusColor[getValue()] || 'bg-gray-500'} text-white border-0`}>{tStatus(getValue())}</Tag> },
        {
            id: 'checkInOut', header: t('checkInOut'),
            cell: ({ row }) => {
                const r = row.original
                return (
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${r.checkedIn ? 'bg-emerald-500' : 'bg-gray-300'}`} title={r.checkedIn ? t('checkedIn') : t('notCheckedIn')} />
                        <span className={`w-2 h-2 rounded-full ${r.checkedOut ? 'bg-blue-500' : 'bg-gray-300'}`} title={r.checkedOut ? t('checkedOut') : t('notCheckedOut')} />
                    </div>
                )
            },
            size: 100,
        },
        {
            id: 'actions', header: tCommon('actions'),
            cell: ({ row }) => {
                const r = row.original
                return (
                    <div className="flex items-center gap-1">
                        {r.paymentStatus === 'COMPLETED' && (
                            <button
                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                title={tCommon('downloadInvoice')}
                                onClick={() => generateInvoicePdf(
                                    { id: r.paymentId || r.id, reservationId: r.id, amount: r.totalPrice, status: r.paymentStatus || 'COMPLETED', paymentMethod: r.paymentMethod, paidAt: r.paidAt },
                                    { parkingName: r.parkingName, slotNumber: r.slotNumber, startTime: r.startTime, endTime: r.endTime, userFullName: r.userFullName }
                                )}
                            >
                                <PiDownloadSimpleBold className="text-lg" />
                            </button>
                        )}
                        {r.status === 'ACTIVE' && (
                            <Button size="xs" variant="plain" className="text-red-500 hover:text-red-600" icon={<PiXCircleDuotone />}
                                onClick={() => { setCancelTarget(r); setCancelDialogOpen(true) }}>{tCommon('cancel')}</Button>
                        )}
                    </div>
                )
            },
            size: 140,
        },
    ], [t, tCommon, tStatus])

    const table = useReactTable({
        data: filteredData, columns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    })

    if (loading) return (<div className="flex flex-col gap-6"><Skeleton width={200} height={28} /><Card>{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="mt-3" height={40} />))}</Card></div>)

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div><h3 className="font-bold text-lg sm:text-xl">{t('title')}</h3><p className="text-gray-500 text-xs sm:text-sm">{t('subtitle', { count: filteredData.length })}</p></div>
                <Button size="sm" variant="twoTone" icon={<PiDownloadSimpleDuotone />} onClick={exportCSV}>{tCommon('exportCsv')}</Button>
            </div>
            <Card>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 mb-4">
                    <div className="relative flex-1 sm:min-w-[200px] sm:max-w-md">
                        <PiMagnifyingGlassDuotone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input className="pl-9" placeholder={tCommon('search')} value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
                    </div>
                    <div className="w-full sm:w-48"><Select options={statusOptions} value={statusOptions.find((o) => o.value === statusFilter)} onChange={(o) => setStatusFilter(o?.value || '')} placeholder={tFilters('status')} /></div>
                    <div className="w-full sm:w-56"><Select options={parkingOptions} value={parkingOptions.find((o) => o.value === parkingFilter)} onChange={(o) => setParkingFilter(o?.value || '')} placeholder={tFilters('parking')} /></div>
                </div>
                {filteredData.length === 0 ? (
                    <div className="text-center py-12"><PiCalendarCheckDuotone className="text-6xl text-gray-300 mx-auto mb-4" /><p className="text-gray-400">{t('empty')}</p></div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="block md:hidden space-y-3">
                            {table.getRowModel().rows.map((row) => {
                                const r = row.original
                                return (
                                    <div key={row.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-sm text-primary">RES-{String(r.id).padStart(5, '0')}</span>
                                            <Tag className={`${statusColor[r.status] || 'bg-gray-500'} text-white border-0 text-[10px]`}>{tStatus(r.status)}</Tag>
                                        </div>
                                        <p className="font-medium text-sm">{r.userFullName}</p>
                                        <p className="text-xs text-gray-500">{r.parkingName} · {t('slot')} {r.slotNumber}</p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                                            <span>{new Date(r.startTime).toLocaleString()}</span>
                                            <span>→</span>
                                            <span>{new Date(r.endTime).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <span className="font-bold">{r.totalPrice} MAD</span>
                                            <div className="flex items-center gap-1">
                                                {r.paymentStatus === 'COMPLETED' && (
                                                    <button
                                                        className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors min-h-[44px]"
                                                        onClick={() => generateInvoicePdf(
                                                            { id: r.paymentId || r.id, reservationId: r.id, amount: r.totalPrice, status: r.paymentStatus || 'COMPLETED', paymentMethod: r.paymentMethod, paidAt: r.paidAt },
                                                            { parkingName: r.parkingName, slotNumber: r.slotNumber, startTime: r.startTime, endTime: r.endTime, userFullName: r.userFullName }
                                                        )}
                                                    >
                                                        <PiDownloadSimpleBold className="text-lg" />
                                                    </button>
                                                )}
                                                {r.status === 'ACTIVE' && (
                                                    <Button size="xs" variant="plain" className="text-red-500 hover:text-red-600 min-h-[44px]" icon={<PiXCircleDuotone />}
                                                        onClick={() => { setCancelTarget(r); setCancelDialogOpen(true) }}>{tCommon('cancel')}</Button>
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
            <ConfirmDialog isOpen={cancelDialogOpen} type="warning" title={t('cancelTitle')} confirmText={t('cancelConfirm')}
                confirmButtonProps={{ variant: 'solid', loading: cancelLoading }}
                onClose={() => setCancelDialogOpen(false)} onCancel={() => setCancelDialogOpen(false)} onConfirm={handleCancel}>
                <p>{t('cancelQuestion', { ref: `RES-${String(cancelTarget?.id).padStart(5, '0')}`, user: cancelTarget?.userFullName })}</p>
            </ConfirmDialog>
        </div>
    )
}

export default AdminReservationsClient
