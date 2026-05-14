'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { apiGetAllParkings } from '@/services/ParkingService'
import { apiGetSlotsByParking, apiCreateSlot, apiUpdateSlot, apiDeleteSlot } from '@/services/ParkingSlotService'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Dialog from '@/components/ui/Dialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Skeleton from '@/components/ui/Skeleton'
import Segment from '@/components/ui/Segment'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { PiSquaresFourDuotone, PiPlusBold, PiPencilDuotone, PiTrashDuotone, PiStackDuotone, PiGridFourDuotone, PiListDashesDuotone } from 'react-icons/pi'
import logger from '@/utils/logger'
import {
    useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender,
} from '@tanstack/react-table'

const statusColorMap = { AVAILABLE: 'bg-emerald-500', OCCUPIED: 'bg-red-500', RESERVED: 'bg-amber-500', MAINTENANCE: 'bg-gray-400' }
const statusDotColorMap = { AVAILABLE: 'bg-emerald-400', OCCUPIED: 'bg-red-400', RESERVED: 'bg-amber-400', MAINTENANCE: 'bg-gray-400' }
const typeOptions = [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'HANDICAPPED', label: 'Handicapped' },
    { value: 'VIP', label: 'VIP' },
    { value: 'ELECTRIC', label: 'Electric' },
]
const statusOptions = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'OCCUPIED', label: 'Occupied' },
    { value: 'RESERVED', label: 'Reserved' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
]

const AdminParkingSlotsClient = () => {
    const [parkings, setParkings] = useState([])
    const [selectedParking, setSelectedParking] = useState(null)
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [viewMode, setViewMode] = useState('grid')
    const [sorting, setSorting] = useState([])

    // Single slot form
    const [formOpen, setFormOpen] = useState(false)
    const [formData, setFormData] = useState({ slotNumber: '', floor: '', slotType: 'STANDARD', status: 'AVAILABLE' })
    const [editSlotId, setEditSlotId] = useState(null)
    const [formLoading, setFormLoading] = useState(false)

    // Bulk form
    const [bulkOpen, setBulkOpen] = useState(false)
    const [bulkData, setBulkData] = useState({ prefix: 'A', count: 10, floor: '1', slotType: 'STANDARD' })
    const [bulkLoading, setBulkLoading] = useState(false)

    // Delete
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    useEffect(() => {
        const loadParkings = async () => {
            try {
                const res = await apiGetAllParkings()
                setParkings(res?.data || [])
            } catch (e) { logger.error(e) } finally { setLoading(false) }
        }
        loadParkings()
    }, [])

    const fetchSlots = useCallback(async (parkingId) => {
        setSlotsLoading(true)
        try {
            const res = await apiGetSlotsByParking(parkingId)
            setSlots(res?.data || [])
        } catch (e) {
            toast.push(<Notification type="danger" title="Error">Failed to load slots</Notification>)
        } finally { setSlotsLoading(false) }
    }, [])

    useEffect(() => {
        if (selectedParking) fetchSlots(selectedParking.value)
    }, [selectedParking, fetchSlots])

    const parkingSelectOptions = useMemo(() => parkings.map((p) => ({ value: p.id, label: `${p.name} (${p.totalSlots} slots)` })), [parkings])

    const handleSlotSubmit = async () => {
        if (!formData.slotNumber.trim()) { toast.push(<Notification type="warning" title="Warning">Slot number required</Notification>); return }
        setFormLoading(true)
        try {
            const payload = { ...formData, parkingId: selectedParking.value }
            if (editSlotId) {
                await apiUpdateSlot(editSlotId, payload)
                toast.push(<Notification type="success" title="Success">Slot updated</Notification>)
            } else {
                await apiCreateSlot(payload)
                toast.push(<Notification type="success" title="Success">Slot created</Notification>)
            }
            setFormOpen(false)
            fetchSlots(selectedParking.value)
        } catch (e) {
            toast.push(<Notification type="danger" title="Error">{e?.response?.data?.message || 'Failed'}</Notification>)
        } finally { setFormLoading(false) }
    }

    const handleBulkCreate = async () => {
        if (!bulkData.prefix.trim() || bulkData.count <= 0) return
        setBulkLoading(true)
        try {
            const promises = []
            for (let i = 1; i <= bulkData.count; i++) {
                const slotNumber = `${bulkData.prefix}-${String(i).padStart(2, '0')}`
                promises.push(apiCreateSlot({ slotNumber, floor: bulkData.floor, slotType: bulkData.slotType, status: 'AVAILABLE', parkingId: selectedParking.value }))
            }
            await Promise.all(promises)
            toast.push(<Notification type="success" title="Success">{bulkData.count} slots created</Notification>)
            setBulkOpen(false)
            fetchSlots(selectedParking.value)
        } catch (e) {
            toast.push(<Notification type="danger" title="Error">Bulk creation failed</Notification>)
        } finally { setBulkLoading(false) }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleteLoading(true)
        try {
            await apiDeleteSlot(deleteTarget.id)
            toast.push(<Notification type="success" title="Success">Slot deleted</Notification>)
            setDeleteOpen(false)
            fetchSlots(selectedParking.value)
        } catch (e) {
            toast.push(<Notification type="danger" title="Error">Failed to delete slot</Notification>)
        } finally { setDeleteLoading(false) }
    }

    const columns = useMemo(() => [
        { accessorKey: 'id', header: 'Ref', cell: ({ getValue }) => <span className="font-mono text-sm text-primary">SLT-{String(getValue()).padStart(5, '0')}</span>, size: 110 },
        { accessorKey: 'slotNumber', header: 'Slot #', cell: ({ getValue }) => <span className="font-bold">{getValue()}</span> },
        { accessorKey: 'floor', header: 'Floor', cell: ({ getValue }) => getValue() || '—' },
        { accessorKey: 'slotType', header: 'Type', cell: ({ getValue }) => <Tag className="bg-indigo-100 text-indigo-700 border-0 dark:bg-indigo-900/40 dark:text-indigo-300">{getValue()}</Tag> },
        { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <Tag className={`${statusColorMap[getValue()] || 'bg-gray-500'} text-white border-0`}>{getValue()}</Tag> },
        {
            id: 'actions', header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button size="xs" variant="twoTone" icon={<PiPencilDuotone />} onClick={() => {
                        setEditSlotId(row.original.id)
                        setFormData({ slotNumber: row.original.slotNumber, floor: row.original.floor || '', slotType: row.original.slotType, status: row.original.status })
                        setFormOpen(true)
                    }}>Edit</Button>
                    <Button size="xs" variant="plain" className="text-red-500" icon={<PiTrashDuotone />}
                        onClick={() => { setDeleteTarget(row.original); setDeleteOpen(true) }} />
                </div>
            ),
            size: 150,
        },
    ], [])

    const table = useReactTable({
        data: slots, columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 20 } },
    })

    // Group slots by floor for grid view
    const slotsByFloor = useMemo(() => {
        const map = {}
        slots.forEach((s) => {
            const floor = s.floor || 'Unknown'
            if (!map[floor]) map[floor] = []
            map[floor].push(s)
        })
        return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    }, [slots])

    if (loading) return <div className="flex flex-col gap-4 sm:gap-6"><Skeleton width={200} height={28} /><Skeleton height={48} /></div>

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div><h3 className="text-xl sm:text-2xl font-bold">Manage Parking Slots</h3><p className="text-gray-500">Select a parking to manage its slots</p></div>
            </div>

            {/* Parking Selector */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
                    <div className="w-full sm:flex-1 sm:min-w-[250px]">
                        <Select options={parkingSelectOptions} value={selectedParking} onChange={setSelectedParking} placeholder="Select a parking..." />
                    </div>
                    {selectedParking && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Segment value={viewMode} onChange={(val) => setViewMode(val)}>
                                <Segment.Item value="grid"><PiGridFourDuotone className="text-lg" /></Segment.Item>
                                <Segment.Item value="list"><PiListDashesDuotone className="text-lg" /></Segment.Item>
                            </Segment>
                            <Button size="sm" variant="twoTone" icon={<PiStackDuotone />} onClick={() => setBulkOpen(true)}>Bulk Create</Button>
                            <Button size="sm" variant="solid" icon={<PiPlusBold />} onClick={() => { setEditSlotId(null); setFormData({ slotNumber: '', floor: '', slotType: 'STANDARD', status: 'AVAILABLE' }); setFormOpen(true) }}>Add Slot</Button>
                        </div>
                    )}
                </div>
            </Card>

            {!selectedParking && (
                <Card><div className="text-center py-16"><PiSquaresFourDuotone className="text-6xl text-gray-300 mx-auto mb-4" /><p className="text-gray-400">Select a parking above to view its slots</p></div></Card>
            )}

            {selectedParking && slotsLoading && (
                <Card><div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">{Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} height={56} />)}</div></Card>
            )}

            {selectedParking && !slotsLoading && slots.length === 0 && (
                <Card><div className="text-center py-12"><PiSquaresFourDuotone className="text-6xl text-gray-300 mx-auto mb-4" /><p className="text-gray-400">No slots found. Create some!</p></div></Card>
            )}

            {/* Grid View */}
            {selectedParking && !slotsLoading && slots.length > 0 && viewMode === 'grid' && (
                <div className="flex flex-col gap-4">
                    {/* Legend */}
                    <Card className="!py-3">
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="font-semibold text-gray-500">Legend:</span>
                            {Object.entries(statusColorMap).map(([k, v]) => (
                                <div key={k} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded-full ${statusDotColorMap[k]}`} /><span>{k}</span></div>
                            ))}
                        </div>
                    </Card>
                    {slotsByFloor.map(([floor, floorSlots]) => (
                        <Card key={floor}>
                            <h6 className="font-bold mb-3 text-gray-600">Floor {floor} <span className="text-sm font-normal text-gray-400">({floorSlots.length} slots)</span></h6>
                            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-12 gap-2">
                                {floorSlots.map((slot) => (
                                    <button key={slot.id}
                                        className={`relative rounded-lg p-2 text-center text-xs font-bold text-white transition-all hover:scale-105 hover:shadow-md ${statusColorMap[slot.status] || 'bg-gray-500'}`}
                                        title={`${slot.slotNumber} — ${slot.status} — ${slot.slotType}`}
                                        onClick={() => {
                                            setEditSlotId(slot.id)
                                            setFormData({ slotNumber: slot.slotNumber, floor: slot.floor || '', slotType: slot.slotType, status: slot.status })
                                            setFormOpen(true)
                                        }}
                                    >
                                        <div>{slot.slotNumber}</div>
                                        <div className="text-[10px] opacity-80 mt-0.5">{slot.slotType?.charAt(0)}</div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Table View */}
            {selectedParking && !slotsLoading && slots.length > 0 && viewMode === 'list' && (
                <Card>
                    {/* Mobile card view */}
                    <div className="block md:hidden space-y-3">
                        {table.getRowModel().rows.map((row) => {
                            const s = row.original
                            return (
                                <div key={row.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-mono text-sm text-primary">SLT-{String(s.id).padStart(5, '0')}</span>
                                            <span className="font-bold ml-2">{s.slotNumber}</span>
                                        </div>
                                        <Tag className={`${statusColorMap[s.status] || 'bg-gray-500'} text-white border-0 text-[10px]`}>{s.status}</Tag>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>Floor: {s.floor || '—'}</span>
                                        <Tag className="bg-indigo-100 text-indigo-700 border-0 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px]">{s.slotType}</Tag>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <Button size="xs" variant="twoTone" className="min-h-[44px]" icon={<PiPencilDuotone />} onClick={() => {
                                            setEditSlotId(s.id)
                                            setFormData({ slotNumber: s.slotNumber, floor: s.floor || '', slotType: s.slotType, status: s.status })
                                            setFormOpen(true)
                                        }}>Edit</Button>
                                        <Button size="xs" variant="plain" className="text-red-500 min-h-[44px]" icon={<PiTrashDuotone />}
                                            onClick={() => { setDeleteTarget(s); setDeleteOpen(true) }} />
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
                        <span className="text-gray-500">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
                        <div className="flex gap-2">
                            <Button size="xs" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button>
                            <Button size="xs" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Single Slot Dialog */}
            <Dialog isOpen={formOpen} onClose={() => setFormOpen(false)} width={450}>
                <h5 className="mb-4 font-bold">{editSlotId ? 'Edit Slot' : 'Add Slot'}</h5>
                <div className="flex flex-col gap-4">
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Slot Number *</label><Input value={formData.slotNumber} onChange={(e) => setFormData({ ...formData, slotNumber: e.target.value })} placeholder="e.g. A-01" /></div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Floor</label><Input value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} placeholder="e.g. 1" /></div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Type</label><Select options={typeOptions} value={typeOptions.find((o) => o.value === formData.slotType)} onChange={(o) => setFormData({ ...formData, slotType: o.value })} /></div>
                    {editSlotId && <div><label className="text-sm font-medium text-gray-600 mb-1 block">Status</label><Select options={statusOptions} value={statusOptions.find((o) => o.value === formData.status)} onChange={(o) => setFormData({ ...formData, status: o.value })} /></div>}
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
                    <Button size="sm" variant="solid" loading={formLoading} onClick={handleSlotSubmit}>{editSlotId ? 'Update' : 'Create'}</Button>
                </div>
            </Dialog>

            {/* Bulk Create Dialog */}
            <Dialog isOpen={bulkOpen} onClose={() => setBulkOpen(false)} width={450}>
                <h5 className="mb-4 font-bold">Bulk Create Slots</h5>
                <div className="flex flex-col gap-4">
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Prefix (e.g. A, B, C)</label><Input value={bulkData.prefix} onChange={(e) => setBulkData({ ...bulkData, prefix: e.target.value })} /></div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Count</label><Input type="number" value={bulkData.count} onChange={(e) => setBulkData({ ...bulkData, count: parseInt(e.target.value) || 0 })} /></div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Floor</label><Input value={bulkData.floor} onChange={(e) => setBulkData({ ...bulkData, floor: e.target.value })} /></div>
                    <div><label className="text-sm font-medium text-gray-600 mb-1 block">Type</label><Select options={typeOptions} value={typeOptions.find((o) => o.value === bulkData.slotType)} onChange={(o) => setBulkData({ ...bulkData, slotType: o.value })} /></div>
                </div>
                <p className="text-sm text-gray-500 mt-3">Will create: {bulkData.prefix}-01 to {bulkData.prefix}-{String(bulkData.count).padStart(2, '0')}</p>
                <div className="flex justify-end gap-2 mt-4">
                    <Button size="sm" onClick={() => setBulkOpen(false)}>Cancel</Button>
                    <Button size="sm" variant="solid" loading={bulkLoading} onClick={handleBulkCreate}>Create {bulkData.count} Slots</Button>
                </div>
            </Dialog>

            {/* Delete Confirm */}
            <ConfirmDialog isOpen={deleteOpen} type="danger" title="Delete Slot" confirmText="Delete"
                confirmButtonProps={{ variant: 'solid', color: 'red-600', loading: deleteLoading }}
                onClose={() => setDeleteOpen(false)} onCancel={() => setDeleteOpen(false)} onConfirm={handleDelete}>
                <p>Delete slot <strong>{deleteTarget?.slotNumber}</strong>?</p>
            </ConfirmDialog>
        </div>
    )
}

export default AdminParkingSlotsClient

