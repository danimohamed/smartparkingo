'use client'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { apiGetAllParkings, apiCreateParking, apiUpdateParking, apiDeleteParking } from '@/services/ParkingService'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Switcher from '@/components/ui/Switcher'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Skeleton from '@/components/ui/Skeleton'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Select from '@/components/ui/Select'
import { PiCarDuotone, PiMagnifyingGlassDuotone, PiPlusBold, PiPencilDuotone, PiTrashDuotone, PiDownloadSimpleDuotone, PiShieldCheckDuotone } from 'react-icons/pi'
import {
    useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender,
} from '@tanstack/react-table'

const emptyForm = { name: '', address: '', description: '', imageUrl: '', layoutFloors: '', totalSlots: 50, pricePerHour: 10, pricingTier: 'STANDARD', dailyCapPrice: '', latitude: '', longitude: '', active: true }

const tierOptions = [
    { value: 'ECONOMY', label: 'Economy' },
    { value: 'STANDARD', label: 'Standard' },
    { value: 'PREMIUM', label: 'Premium' },
]

const tierColor = {
    PREMIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    ECONOMY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    STANDARD: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
}

const AdminParkingsClient = () => {
    const [parkings, setParkings] = useState([])
    const [loading, setLoading] = useState(true)
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState([])

    // Form dialog
    const [formOpen, setFormOpen] = useState(false)
    const [formData, setFormData] = useState(emptyForm)
    const [editId, setEditId] = useState(null)
    const [formLoading, setFormLoading] = useState(false)
    const [formErrors, setFormErrors] = useState({})
    const fileInputRef = useRef(null)

    // Delete
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const fetchParkings = useCallback(async () => {
        try {
            const res = await apiGetAllParkings()
            setParkings(res?.data || [])
        } catch (error) {
            toast.push(<Notification type="danger" title="Error">Failed to load parkings</Notification>)
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchParkings() }, [fetchParkings])

    const validateForm = () => {
        const errors = {}
        if (!formData.name.trim()) errors.name = 'Name is required'
        if (!formData.address.trim()) errors.address = 'Address is required'
        if (!formData.totalSlots || formData.totalSlots <= 0) errors.totalSlots = 'Must be > 0'
        if (!formData.pricePerHour || formData.pricePerHour <= 0) errors.pricePerHour = 'Must be > 0'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) return
        setFormLoading(true)
        try {
            const payload = {
                ...formData,
                totalSlots: parseInt(formData.totalSlots),
                layoutFloors: formData.layoutFloors === '' ? null : parseInt(formData.layoutFloors),
                pricePerHour: parseFloat(formData.pricePerHour),
                dailyCapPrice: formData.dailyCapPrice ? parseFloat(formData.dailyCapPrice) : null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            }
            if (editId) {
                await apiUpdateParking(editId, payload)
                toast.push(<Notification type="success" title="Success">Parking updated</Notification>)
            } else {
                await apiCreateParking(payload)
                toast.push(<Notification type="success" title="Success">Parking created</Notification>)
            }
            setFormOpen(false)
            setFormData(emptyForm)
            setEditId(null)
            fetchParkings()
        } catch (error) {
            toast.push(<Notification type="danger" title="Error">{error?.response?.data?.message || 'Operation failed'}</Notification>)
        } finally { setFormLoading(false) }
    }

    const handleEdit = (parking) => {
        setEditId(parking.id)
        setFormData({
            name: parking.name, address: parking.address, description: parking.description || '',
            imageUrl: parking.imageUrl || '',
            layoutFloors: parking.layoutFloors ?? '',
            totalSlots: parking.totalSlots, pricePerHour: parking.pricePerHour,
            pricingTier: parking.pricingTier || 'STANDARD', dailyCapPrice: parking.dailyCapPrice || '',
            latitude: parking.latitude || '', longitude: parking.longitude || '', active: parking.active,
        })
        setFormErrors({})
        setFormOpen(true)
    }

    const handlePickImageFile = (file) => {
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            const url = String(reader.result || '')
            setFormData((p) => ({ ...p, imageUrl: url }))
        }
        reader.readAsDataURL(file)
    }

    const onDropImage = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const file = e.dataTransfer?.files?.[0]
        handlePickImageFile(file)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleteLoading(true)
        try {
            await apiDeleteParking(deleteTarget.id)
            toast.push(<Notification type="success" title="Success">Parking deleted</Notification>)
            setDeleteOpen(false)
            fetchParkings()
        } catch (error) {
            toast.push(<Notification type="danger" title="Error">Failed to delete parking</Notification>)
        } finally { setDeleteLoading(false) }
    }

    const exportCSV = () => {
        const headers = ['Ref', 'Name', 'Address', 'Total Slots', 'Available', 'Price/hr', 'Active']
        const rows = parkings.map((p) => [`PRK-${String(p.id).padStart(5, '0')}`, p.name, `"${p.address}"`, p.totalSlots, p.availableSlots ?? '', p.pricePerHour, p.active])
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'parkings.csv'; a.click()
    }

    const columns = useMemo(() => [
        { accessorKey: 'id', header: 'Ref', cell: ({ getValue }) => <span className="font-mono text-sm text-primary">PRK-{String(getValue()).padStart(5, '0')}</span>, size: 110 },
        { accessorKey: 'name', header: 'Name', cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
        { accessorKey: 'address', header: 'Address', cell: ({ getValue }) => <span className="text-sm truncate max-w-[200px] block">{getValue()}</span> },
        { accessorKey: 'totalSlots', header: 'Slots', size: 80 },
        { accessorKey: 'availableSlots', header: 'Available', cell: ({ getValue }) => <span className="text-emerald-600 font-bold">{getValue() ?? '—'}</span>, size: 90 },
        { accessorKey: 'pricePerHour', header: 'Price/hr', cell: ({ getValue }) => `${getValue()} MAD`, size: 90 },
        { accessorKey: 'pricingTier', header: 'Tier', cell: ({ getValue }) => getValue() ? <Tag className={`${tierColor[getValue()] || ''} border-0`}>{getValue()}</Tag> : '—', size: 90 },
        { accessorKey: 'guardName', header: 'Guard', cell: ({ row }) => row.original.guardName ? <span className="flex items-center gap-1 text-sm"><PiShieldCheckDuotone className="text-indigo-500" />{row.original.guardName}</span> : <span className="text-gray-400">—</span>, size: 140 },
        { accessorKey: 'active', header: 'Status', cell: ({ getValue }) => <Tag className={`${getValue() ? 'bg-emerald-500' : 'bg-gray-400'} text-white border-0`}>{getValue() ? 'Active' : 'Inactive'}</Tag>, size: 90 },
        {
            id: 'actions', header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button size="xs" variant="twoTone" icon={<PiPencilDuotone />} onClick={() => handleEdit(row.original)}>Edit</Button>
                    <Button size="xs" variant="plain" className="text-red-500 hover:text-red-600" icon={<PiTrashDuotone />}
                        onClick={() => { setDeleteTarget(row.original); setDeleteOpen(true) }} />
                </div>
            ),
            size: 150,
        },
    ], [])

    const table = useReactTable({
        data: parkings, columns,
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
                <div><h3 className="font-bold text-lg sm:text-xl">Manage Parkings</h3><p className="text-gray-500 text-xs sm:text-sm">{parkings.length} parkings in total</p></div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="twoTone" icon={<PiDownloadSimpleDuotone />} onClick={exportCSV}>Export</Button>
                    <Button size="sm" variant="solid" icon={<PiPlusBold />} onClick={() => { setEditId(null); setFormData(emptyForm); setFormErrors({}); setFormOpen(true) }}>Add Parking</Button>
                </div>
            </div>
            <Card>
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1 sm:max-w-md">
                        <PiMagnifyingGlassDuotone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input className="pl-9" placeholder="Search parkings..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
                    </div>
                </div>
                {parkings.length === 0 ? (
                    <div className="text-center py-12"><PiCarDuotone className="text-6xl text-gray-300 mx-auto mb-4" /><p className="text-gray-400">No parkings found</p></div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="block md:hidden space-y-3">
                            {table.getRowModel().rows.map((row) => {
                                const p = row.original
                                return (
                                    <div key={row.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <PiCarDuotone className="text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm truncate">{p.name}</p>
                                                    <p className="text-xs text-gray-400 truncate">{p.address}</p>
                                                </div>
                                            </div>
                                            <Tag className={`${p.active ? 'bg-emerald-500' : 'bg-gray-400'} text-white border-0 text-[10px]`}>{p.active ? 'Active' : 'Off'}</Tag>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span><span className="text-emerald-600 font-bold">{p.availableSlots ?? '—'}</span> / {p.totalSlots} slots</span>
                                            <div className="flex items-center gap-2">
                                                {p.pricingTier && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tierColor[p.pricingTier] || ''}`}>{p.pricingTier}</span>}
                                                <span className="font-bold text-primary">{p.pricePerHour} MAD/h</span>
                                            </div>
                                        </div>
                                        {p.guardName && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <PiShieldCheckDuotone className="text-indigo-500" />{p.guardName}
                                                {p.guardPhone && <span className="text-gray-400">· {p.guardPhone}</span>}
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <Button size="xs" variant="twoTone" className="flex-1 min-h-[44px]" icon={<PiPencilDuotone />} onClick={() => handleEdit(p)}>Edit</Button>
                                            <Button size="xs" variant="plain" className="text-red-500 hover:text-red-600 min-h-[44px]" icon={<PiTrashDuotone />}
                                                onClick={() => { setDeleteTarget(p); setDeleteOpen(true) }} />
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
                            <span className="text-gray-500 text-xs sm:text-sm">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
                            <div className="flex gap-2">
                                <Button size="xs" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button>
                                <Button size="xs" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog isOpen={formOpen} onClose={() => setFormOpen(false)} width={600}>
                <h5 className="mb-4 font-bold">{editId ? 'Edit Parking' : 'Add Parking'}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Name *</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} invalid={!!formErrors.name} />{formErrors.name && <span className="text-red-500 text-xs">{formErrors.name}</span>}</div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Address *</label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} invalid={!!formErrors.address} />{formErrors.address && <span className="text-red-500 text-xs">{formErrors.address}</span>}</div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Picture</label>
                        <div className="flex flex-col gap-2">
                            <Input
                                placeholder="Image URL (or use Upload)"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            />
                            <div
                                className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-3 flex items-center justify-between gap-3 bg-gray-50/60 dark:bg-gray-800/30"
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                }}
                                onDrop={onDropImage}
                            >
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        Drag & drop an image here
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                        or click “Upload” (stored as data URL)
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handlePickImageFile(e.target.files?.[0])}
                                    />
                                    <Button
                                        type="button"
                                        size="xs"
                                        variant="twoTone"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Upload
                                    </Button>
                                    {formData.imageUrl ? (
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="h-16 w-28 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                                        />
                                    ) : (
                                        <span className="text-xs text-gray-400">No image</span>
                                    )}
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400">
                                Tip: Upload stores the image as a data URL in DB. For production, prefer a hosted URL.
                            </p>
                        </div>
                    </div>
                    <div className="md:col-span-2"><label className="text-sm font-medium text-gray-600 mb-1 block">Description</label><Input textArea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Total Slots *</label><Input type="number" value={formData.totalSlots} onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })} invalid={!!formErrors.totalSlots} />{formErrors.totalSlots && <span className="text-red-500 text-xs">{formErrors.totalSlots}</span>}</div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Floors</label><Input type="number" value={formData.layoutFloors} onChange={(e) => setFormData({ ...formData, layoutFloors: e.target.value })} /></div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Price/Hour (MAD) *</label><Input type="number" step="0.5" value={formData.pricePerHour} onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })} invalid={!!formErrors.pricePerHour} />{formErrors.pricePerHour && <span className="text-red-500 text-xs">{formErrors.pricePerHour}</span>}</div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Pricing Tier</label><Select options={tierOptions} value={tierOptions.find((o) => o.value === formData.pricingTier)} onChange={(o) => setFormData({ ...formData, pricingTier: o?.value || 'STANDARD' })} /></div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Daily Cap (MAD)</label><Input type="number" step="1" placeholder="e.g. 80" value={formData.dailyCapPrice} onChange={(e) => setFormData({ ...formData, dailyCapPrice: e.target.value })} /></div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Latitude</label><Input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} /></div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Longitude</label><Input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} /></div>
                    <div className="flex items-center gap-3"><label className="text-sm font-medium text-gray-600">Active</label><Switcher checked={formData.active} onChange={(val) => setFormData({ ...formData, active: val })} /></div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
                    <Button size="sm" variant="solid" loading={formLoading} onClick={handleSubmit}>{editId ? 'Update' : 'Create'}</Button>
                </div>
            </Dialog>

            {/* Delete Confirm */}
            <ConfirmDialog isOpen={deleteOpen} type="danger" title="Delete Parking" confirmText="Delete"
                confirmButtonProps={{ variant: 'solid', color: 'red-600', loading: deleteLoading }}
                onClose={() => setDeleteOpen(false)} onCancel={() => setDeleteOpen(false)} onConfirm={handleDelete}>
                <p>Delete <strong>{deleteTarget?.name}</strong>? All slots and reservations will be removed.</p>
            </ConfirmDialog>
        </div>
    )
}

export default AdminParkingsClient

