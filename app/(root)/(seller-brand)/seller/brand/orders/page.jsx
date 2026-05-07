'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { Eye, Search, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const getStatusColor = (status) => {
    const colors = { pending: 'bg-yellow-600', packed: 'bg-blue-600', shipped: 'bg-purple-600', in_transit: 'bg-orange-600', delivered: 'bg-green-600', cancelled: 'bg-red-600' }
    return colors[status] || 'bg-gray-600'
}

const BrandSellerOrders = () => {
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [filteredOrders, setFilteredOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [stats, setStats] = useState({ total: 0, pending: 0, shipped: 0, delivered: 0 })

    useEffect(() => { fetchOrders() }, [])
    useEffect(() => { filterOrders() }, [searchTerm, statusFilter, orders])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/seller/orders?type=brand')
            if (data.success) { setOrders(data.data.orders); setFilteredOrders(data.data.orders); setStats(data.data.stats) }
        } catch (error) { showToast('error', 'Failed to load orders') }
        finally { setLoading(false) }
    }

    const filterOrders = () => {
        let filtered = orders
        if (statusFilter !== 'all') filtered = filtered.filter(o => o.deliveryStatus === statusFilter)
        if (searchTerm) filtered = filtered.filter(o => o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) || o.productName?.toLowerCase().includes(searchTerm.toLowerCase()))
        setFilteredOrders(filtered)
    }

    return (
        <div className='w-full'>
            <div className='flex justify-between items-center mb-5'>
                <div><h1 className='text-2xl font-bold'>Orders</h1><p className='text-gray-500'>View your brand orders</p></div>
            </div>

            <div className='grid grid-cols-4 gap-4 mb-6'>
                <Card><CardContent className='p-4'><p className='text-gray-500 text-sm'>Total Orders</p><p className='text-2xl font-bold'>{stats.total}</p></CardContent></Card>
                <Card className='border-yellow-200'><CardContent className='p-4'><p className='text-yellow-600 text-sm'>Pending</p><p className='text-2xl font-bold text-yellow-600'>{stats.pending}</p></CardContent></Card>
                <Card className='border-blue-200'><CardContent className='p-4'><p className='text-blue-600 text-sm'>Shipped</p><p className='text-2xl font-bold text-blue-600'>{stats.shipped}</p></CardContent></Card>
                <Card className='border-green-200'><CardContent className='p-4'><p className='text-green-600 text-sm'>Delivered</p><p className='text-2xl font-bold text-green-600'>{stats.delivered}</p></CardContent></Card>
            </div>

            <div className='flex gap-4 mb-4'>
                <div className='relative flex-1 max-w-md'><Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' /><Input placeholder="Search by Order ID or Product..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' /></div>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className='w-[180px]'><SelectValue placeholder="Filter" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="shipped">Shipped</SelectItem><SelectItem value="delivered">Delivered</SelectItem></SelectContent></Select>
            </div>

            <Card>
                <CardHeader><h2 className='text-lg font-semibold'>Order List</h2></CardHeader>
                <CardContent>
                    {loading ? <div className='text-center py-10'>Loading...</div> : filteredOrders.length === 0 ? (
                        <div className='text-center py-10 text-gray-500'><Package className='h-12 w-12 mx-auto text-gray-300 mb-3' /><p>No orders found</p></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Product</TableHead><TableHead>Variant</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className='text-right'>View</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order._id}>
                                        <TableCell className="font-mono text-xs">#{order.orderId?.slice(-8)}</TableCell>
                                        <TableCell>
                                            <div className='flex items-center gap-2'>
                                                <Image src={order.productImage ? getImageUrl(order.productImage) : imgPlaceholder.src} width={40} height={40} alt="" className='rounded object-cover' onError={(e) => { e.target.src = imgPlaceholder.src }} />
                                                <div><p className='font-medium text-sm'>{order.productName}</p><p className='text-xs text-gray-500'>SKU: {order.uniqueCode}</p></div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{order.size && order.color ? <Badge variant="outline" className='text-xs'>{order.size}/{order.color}</Badge> : '—'}</TableCell>
                                        <TableCell className='text-sm'>{formatDate(order.createdAt)}</TableCell>
                                        <TableCell className='font-semibold text-sm'>{formatCurrency(order.totalAmount)}</TableCell>
                                        <TableCell><Badge className={`${getStatusColor(order.deliveryStatus)} text-white text-xs`}>{order.deliveryStatus}</Badge></TableCell>
                                        <TableCell className='text-right'><Button variant="ghost" size="icon" onClick={() => router.push(`/seller/brand/orders/${order.orderId}`)}><Eye className='h-4 w-4' /></Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default BrandSellerOrders