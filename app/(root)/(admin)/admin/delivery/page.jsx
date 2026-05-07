'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'  // ✅ Add this
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency, formatDate, getDeliveryStatusColor, deliveryStatus } from '@/lib/utils'
import { Truck, Search, Edit } from 'lucide-react'
import Link from 'next/link'
import { ADMIN_ORDER_DETAILS } from '@/routes/AdminPanelRoute'

const AdminDeliveryPage = () => {
    const [orders, setOrders] = useState([])
    const [filteredOrders, setFilteredOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [trackingNumber, setTrackingNumber] = useState('')
    const [courierName, setCourierName] = useState('')
    const [newStatus, setNewStatus] = useState('')
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchOrders()
    }, [])

    useEffect(() => {
        filterOrders()
    }, [searchTerm, statusFilter, orders])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/orders?delivery=true')
            if (data.success) {
                setOrders(data.data)
                setFilteredOrders(data.data)
            }
        } catch (error) {
            showToast('error', 'Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const filterOrders = () => {
        let filtered = orders

        if (statusFilter !== 'all') {
            filtered = filtered.filter(o => o.deliveryStatus === statusFilter)
        }

        if (searchTerm) {
            filtered = filtered.filter(o => 
                o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.phone?.includes(searchTerm) ||
                o.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredOrders(filtered)
    }

    const handleUpdateDelivery = async () => {
        try {
            setUpdating(true)
            const { data } = await axios.put('/api/admin/delivery/update-status', {
                orderId: selectedOrder._id,
                deliveryStatus: newStatus,
                trackingNumber,
                courierName
            })
            if (data.success) {
                showToast('success', 'Delivery status updated')
                setDialogOpen(false)
                fetchOrders()
                resetDialog()
            }
        } catch (error) {
            showToast('error', error.response?.data?.message || 'Update failed')
        } finally {
            setUpdating(false)
        }
    }

    const openUpdateDialog = (order) => {
        setSelectedOrder(order)
        setNewStatus(order.deliveryStatus || 'pending')
        setTrackingNumber(order.trackingNumber || '')
        setCourierName(order.courierName || '')
        setDialogOpen(true)
    }

    const resetDialog = () => {
        setSelectedOrder(null)
        setNewStatus('')
        setTrackingNumber('')
        setCourierName('')
    }

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.deliveryStatus === 'pending').length,
        shipped: orders.filter(o => o.deliveryStatus === 'shipped').length,
        delivered: orders.filter(o => o.deliveryStatus === 'delivered').length
    }

    return (
        <div className='p-5'>
            <div className='flex justify-between items-center mb-5'>
                <div>
                    <h1 className='text-2xl font-bold'>Delivery Management</h1>
                    <p className='text-gray-500'>Track and update order deliveries</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                <Card>
                    <CardContent className='p-4'>
                        <p className='text-gray-500 text-sm'>Total Orders</p>
                        <p className='text-2xl font-bold'>{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className='border-yellow-200'>
                    <CardContent className='p-4'>
                        <p className='text-yellow-600 text-sm'>Pending</p>
                        <p className='text-2xl font-bold text-yellow-600'>{stats.pending}</p>
                    </CardContent>
                </Card>
                <Card className='border-blue-200'>
                    <CardContent className='p-4'>
                        <p className='text-blue-600 text-sm'>Shipped</p>
                        <p className='text-2xl font-bold text-blue-600'>{stats.shipped}</p>
                    </CardContent>
                </Card>
                <Card className='border-green-200'>
                    <CardContent className='p-4'>
                        <p className='text-green-600 text-sm'>Delivered</p>
                        <p className='text-2xl font-bold text-green-600'>{stats.delivered}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className='flex gap-4 mb-4'>
                <div className='relative flex-1 max-w-md'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <Input
                        placeholder="Search by Order ID, Customer, Phone or Tracking..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='pl-10'
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='w-[200px]'>
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        {deliveryStatus.map(status => (
                            <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Orders Table */}
            <Card>
                <CardHeader>
                    <h2 className='text-lg font-semibold'>Orders for Delivery</h2>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className='text-center py-10'>Loading...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className='text-center py-10 text-gray-500'>No orders found</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Tracking Number</TableHead>
                                    <TableHead>Courier</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Order Date</TableHead>
                                    <TableHead className='text-right'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order._id}>
                                        <TableCell>
                                            <code className='text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'>
                                                {order.orderId}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className='font-medium'>{order.name}</p>
                                                <p className='text-xs text-gray-500'>{order.phone}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                                        <TableCell>
                                            {order.trackingNumber || <span className='text-gray-400'>—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {order.courierName || <span className='text-gray-400'>—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getDeliveryStatusColor(order.deliveryStatus)}>
                                                {order.deliveryStatus?.replace(/_/g, ' ') || 'pending'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                                        <TableCell className='text-right'>
                                            <div className='flex justify-end gap-2'>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openUpdateDialog(order)}
                                                >
                                                    <Truck className='h-4 w-4 mr-1' /> Update
                                                </Button>
                                                <Link href={ADMIN_ORDER_DETAILS(order.orderId)}>
                                                    <Button variant="ghost" size="icon">
                                                        <Eye className='h-4 w-4' />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Update Delivery Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Delivery Status</DialogTitle>
                        <DialogDescription>
                            Order ID: {selectedOrder?.orderId}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                        <div>
                            <label className='text-sm font-medium mb-2 block'>Delivery Status</label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {deliveryStatus.map(status => (
                                        <SelectItem key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className='text-sm font-medium mb-2 block'>Tracking Number (Optional)</label>
                            <Input
                                placeholder="Enter tracking number"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className='text-sm font-medium mb-2 block'>Courier Name (Optional)</label>
                            <Input
                                placeholder="e.g., Delhivery, BlueDart"
                                value={courierName}
                                onChange={(e) => setCourierName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateDelivery} disabled={updating}>
                            {updating ? 'Updating...' : 'Update Status'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AdminDeliveryPage