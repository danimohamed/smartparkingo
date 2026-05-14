'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { apiGetAllUsers, apiDeleteUser, apiChangeUserRole } from '@/services/AdminService'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Select from '@/components/ui/Select'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Skeleton from '@/components/ui/Skeleton'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import {
    PiUsersDuotone,
    PiMagnifyingGlassDuotone,
    PiTrashDuotone,
    PiShieldCheckDuotone,
    PiDownloadSimpleDuotone,
    PiCarDuotone,
} from 'react-icons/pi'
import logger from '@/utils/logger'
import { apiGetAllParkings } from '@/services/ParkingService'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table'

const roleOptions = [
    { value: 'USER', label: 'USER' },
    { value: 'ADMIN', label: 'ADMIN' },
    { value: 'PARKING_OWNER', label: 'PARKING_OWNER' },
    { value: 'GUARD', label: 'GUARD' },
]

const roleColor = {
    ADMIN: 'bg-purple-500',
    GUARD: 'bg-indigo-500',
    PARKING_OWNER: 'bg-amber-500',
    USER: 'bg-blue-500',
}

const AdminUsersClient = () => {
    const [users, setUsers] = useState([])
    const [parkings, setParkings] = useState([])
    const [loading, setLoading] = useState(true)
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState([])

    // Role dialog
    const [roleDialogOpen, setRoleDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [newRole, setNewRole] = useState(null)
    const [assignedParkingId, setAssignedParkingId] = useState(null)
    const [roleLoading, setRoleLoading] = useState(false)

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const fetchUsers = useCallback(async () => {
        try {
            const [usersRes, parkingsRes] = await Promise.all([apiGetAllUsers(), apiGetAllParkings()])
            setUsers(usersRes?.data || [])
            setParkings(parkingsRes?.data || [])
        } catch (error) {
            logger.error('Failed to load users', error)
            toast.push(<Notification type="danger" title="Error">Failed to load users</Notification>)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchUsers() }, [fetchUsers])

    const handleRoleChange = async () => {
        if (!selectedUser || !newRole) return
        setRoleLoading(true)
        try {
            const payload = { role: newRole.value }
            if (newRole.value === 'GUARD' && assignedParkingId) {
                payload.assignedParkingId = assignedParkingId.value
            }
            await apiChangeUserRole(selectedUser.id, payload)
            toast.push(<Notification type="success" title="Success">Role updated to {newRole.value}</Notification>)
            setRoleDialogOpen(false)
            fetchUsers()
        } catch (error) {
            toast.push(<Notification type="danger" title="Error">Failed to update role</Notification>)
        } finally {
            setRoleLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleteLoading(true)
        try {
            await apiDeleteUser(deleteTarget.id)
            toast.push(<Notification type="success" title="Success">User deleted</Notification>)
            setDeleteDialogOpen(false)
            fetchUsers()
        } catch (error) {
            toast.push(<Notification type="danger" title="Error">Failed to delete user</Notification>)
        } finally {
            setDeleteLoading(false)
        }
    }

    const exportCSV = () => {
        const headers = ['Ref', 'Full Name', 'Email', 'Phone', 'Role', 'Joined']
        const rows = users.map((u) => [`USR-${String(u.id).padStart(5, '0')}`, u.fullName, u.email, u.phone || '', u.role, u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''])
        const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'users.csv'
        a.click()
    }

    const columns = useMemo(
        () => [
            { accessorKey: 'id', header: 'Ref', cell: ({ getValue }) => <span className="font-mono text-sm text-primary">USR-{String(getValue()).padStart(5, '0')}</span>, size: 110 },
            { accessorKey: 'fullName', header: 'Full Name', cell: ({ getValue }) => <span className="font-medium">{getValue()}</span> },
            { accessorKey: 'email', header: 'Email' },
            { accessorKey: 'phone', header: 'Phone', cell: ({ getValue }) => getValue() || '—' },
            {
                accessorKey: 'role',
                header: 'Role',
                cell: ({ getValue }) => {
                    const role = getValue()
                    return <Tag className={`${roleColor[role] || 'bg-gray-500'} text-white border-0`}>{role}</Tag>
                },
            },
            {
                accessorKey: 'assignedParkingName',
                header: 'Assigned Parking',
                cell: ({ row }) => {
                    const u = row.original
                    if (u.role !== 'GUARD' || !u.assignedParkingName) return <span className="text-gray-400">—</span>
                    return <span className="flex items-center gap-1 text-sm"><PiCarDuotone className="text-indigo-500" />{u.assignedParkingName}</span>
                },
                size: 160,
            },
            {
                accessorKey: 'createdAt',
                header: 'Joined',
                cell: ({ getValue }) => getValue() ? new Date(getValue()).toLocaleDateString() : '—',
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Button
                            size="xs"
                            variant="twoTone"
                            icon={<PiShieldCheckDuotone />}
                            onClick={() => {
                                const u = row.original
                                setSelectedUser(u)
                                setNewRole(roleOptions.find((o) => o.value === u.role))
                                setAssignedParkingId(u.assignedParkingId ? { value: u.assignedParkingId, label: u.assignedParkingName } : null)
                                setRoleDialogOpen(true)
                            }}
                        >
                            Role
                        </Button>
                        <Button
                            size="xs"
                            variant="plain"
                            className="text-red-500 hover:text-red-600"
                            icon={<PiTrashDuotone />}
                            onClick={() => {
                                setDeleteTarget(row.original)
                                setDeleteDialogOpen(true)
                            }}
                        />
                    </div>
                ),
                size: 160,
            },
        ],
        [],
    )

    const table = useReactTable({
        data: users,
        columns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    })

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <Skeleton width={200} height={28} />
                <Card>{Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="mt-3" height={40} />))}</Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="font-bold text-lg sm:text-xl">Users Management</h3>
                    <p className="text-gray-500 text-xs sm:text-sm">All registered users ({users.length})</p>
                </div>
                <Button size="sm" variant="twoTone" icon={<PiDownloadSimpleDuotone />} onClick={exportCSV}>Export CSV</Button>
            </div>

            <Card>
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative flex-1 sm:max-w-md">
                        <PiMagnifyingGlassDuotone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            className="pl-9"
                            placeholder="Search by name, email..."
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                    </div>
                </div>

                {users.length === 0 ? (
                    <div className="text-center py-12">
                        <PiUsersDuotone className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400">No users found</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="block md:hidden space-y-3">
                            {table.getRowModel().rows.map((row) => {
                                const u = row.original
                                return (
                                    <div key={row.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm truncate">{u.fullName}</p>
                                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                            <Tag className={`${roleColor[u.role] || 'bg-gray-500'} text-white border-0 text-[10px]`}>{u.role}</Tag>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{u.phone || 'No phone'}</span>
                                            <span>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</span>
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <Button
                                                size="xs"
                                                variant="twoTone"
                                                className="flex-1 min-h-[44px]"
                                                icon={<PiShieldCheckDuotone />}
                                                onClick={() => {
                                                    setSelectedUser(u)
                                                    setNewRole(roleOptions.find((o) => o.value === u.role))
                                                    setAssignedParkingId(u.assignedParkingId ? { value: u.assignedParkingId, label: u.assignedParkingName } : null)
                                                    setRoleDialogOpen(true)
                                                }}
                                            >
                                                Role
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant="plain"
                                                className="text-red-500 hover:text-red-600 min-h-[44px]"
                                                icon={<PiTrashDuotone />}
                                                onClick={() => {
                                                    setDeleteTarget(u)
                                                    setDeleteDialogOpen(true)
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Desktop table view */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    {table.getHeaderGroups().map((hg) => (
                                        <tr key={hg.id} className="text-left text-gray-500 text-sm border-b dark:border-gray-700">
                                            {hg.headers.map((h) => (
                                                <th key={h.id} className="pb-3 font-semibold cursor-pointer select-none" onClick={h.column.getToggleSortingHandler()}>
                                                    <div className="flex items-center gap-1">
                                                        {flexRender(h.column.columnDef.header, h.getContext())}
                                                        {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted()] ?? ''}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.map((row) => (
                                        <tr key={row.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            {row.getVisibleCells().map((cell) => (
                                                <td key={cell.id} className="py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 text-sm">
                            <span className="text-gray-500 text-xs sm:text-sm">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </span>
                            <div className="flex gap-2">
                                <Button size="xs" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button>
                                <Button size="xs" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>

            {/* Role Change Dialog */}
            <Dialog isOpen={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} width={400}>
                <h5 className="mb-4 font-bold">Change Role</h5>
                <p className="text-sm text-gray-500 mb-3">User: <strong>{selectedUser?.fullName}</strong></p>
                <Select options={roleOptions} value={newRole} onChange={setNewRole} className="mb-4" />
                {newRole?.value === 'GUARD' && (
                    <div className="mb-4">
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Assigned Parking</label>
                        <Select
                            options={parkings.map((p) => ({ value: p.id, label: p.name }))}
                            value={assignedParkingId}
                            onChange={setAssignedParkingId}
                            placeholder="Select a parking..."
                            isClearable
                        />
                    </div>
                )}
                <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
                    <Button size="sm" variant="solid" loading={roleLoading} onClick={handleRoleChange}>Update Role</Button>
                </div>
            </Dialog>

            {/* Delete Confirm */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                type="danger"
                title="Delete User"
                confirmText="Delete"
                confirmButtonProps={{ variant: 'solid', color: 'red-600', loading: deleteLoading }}
                onClose={() => setDeleteDialogOpen(false)}
                onCancel={() => setDeleteDialogOpen(false)}
                onConfirm={handleDelete}
            >
                <p>Are you sure you want to delete <strong>{deleteTarget?.fullName}</strong>? This action cannot be undone.</p>
            </ConfirmDialog>
        </div>
    )
}

export default AdminUsersClient
