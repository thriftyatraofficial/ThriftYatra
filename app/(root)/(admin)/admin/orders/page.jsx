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
import { Eye, Search, Package, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const STATUS_COLORS = {
    pending: 'bg-yellow-600', packed: 'bg-blue-600', shipped: 'bg-purple-600',
    in_transit: 'bg-orange-600', delivered: 'bg-green-600', cancelled: 'bg-red-600',
    unverified: 'bg-gray-500', processing: 'bg-blue-600'
}

const AdminOrdersPage = () => {
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [filteredOrders, setFilteredOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [stats, setStats] = useState({ total: 0, pending: 0, shipped: 0, delivered: 0 })

    useEffect(() => { fetchOrders() }, [])
    useEffect(() => { filterOrders() }, [searchTerm, statusFilter, typeFilter, orders])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const { data } = await axios.get('/api/orders?size=100&deleteType=SD')
            if (data.success) {
                const allOrders = data.data || []
                setOrders(allOrders)
                setFilteredOrders(allOrders)
                setStats({
                    total: allOrders.length,
                    pending: allOrders.filter(o => ['pending', 'unverified', 'processing'].includes(o.status)).length,
                    shipped: allOrders.filter(o => o.status === 'shipped' || o.deliveryStatus === 'shipped').length,
                    delivered: allOrders.filter(o => o.status === 'delivered' || o.deliveryStatus === 'delivered').length
                })
            }
        } catch (error) { showToast('error', 'Failed to load orders') }
        finally { setLoading(false) }
    }

    const filterOrders = () => {
        let filtered = orders
        if (statusFilter !== 'all') {
            filtered = filtered.filter(o => o.status === statusFilter || o.deliveryStatus === statusFilter)
        }
        if (typeFilter !== 'all') {
            filtered = filtered.filter(o => 
                o.products?.some(p => {
                    const pType = p?.productId?.productType || p?.productType
                    return pType === typeFilter
                })
            )
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(o => 
                o.order_id?.toLowerCase().includes(term) ||
                o.payment_id?.toLowerCase().includes(term) ||
                o.name?.toLowerCase().includes(term) ||
                o.phone?.includes(term) ||
                o.city?.toLowerCase().includes(term) ||
                o.products?.some(p => 
                    p?.productId?.uniqueCode?.toLowerCase().includes(term) ||
                    p?.variantId?.sku?.toLowerCase().includes(term) ||
                    p?.name?.toLowerCase().includes(term)
                )
            )
        }
        setFilteredOrders(filtered)
    }

    const getProductTypes = (order) => {
        return [...new Set(order.products?.map(p => p?.productId?.productType || p?.productType || 'unknown'))]
    }

    return (
        <div className='w-full'>
            <div className='flex justify-between items-center mb-5'>
                <div>
                    <h1 className='text-2xl font-bold'>Orders</h1>
                    <p className='text-gray-500'>Manage and ship all orders</p>
                </div>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-4 gap-4 mb-6'>
                <Card><CardContent className='p-4'><p className='text-gray-500 text-sm'>Total Orders</p><p className='text-2xl font-bold'>{stats.total}</p></CardContent></Card>
                <Card className='border-yellow-200'><CardContent className='p-4'><p className='text-yellow-600 text-sm'>Pending</p><p className='text-2xl font-bold text-yellow-600'>{stats.pending}</p></CardContent></Card>
                <Card className='border-blue-200'><CardContent className='p-4'><p className='text-blue-600 text-sm'>Shipped</p><p className='text-2xl font-bold text-blue-600'>{stats.shipped}</p></CardContent></Card>
                <Card className='border-green-200'><CardContent className='p-4'><p className='text-green-600 text-sm'>Delivered</p><p className='text-2xl font-bold text-green-600'>{stats.delivered}</p></CardContent></Card>
            </div>

            {/* Filters */}
            <div className='flex gap-3 mb-4 flex-wrap'>
                <div className='relative flex-1 min-w-[200px] max-w-md'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <Input 
                        placeholder="Search Order ID, Customer, Phone, SKU..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className='pl-10' 
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className='w-[150px]'><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className='w-[150px]'><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="thrift">♻️ Thrift</SelectItem>
                        <SelectItem value="brand_new">✨ Brand New</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Orders Table */}
            <Card>
                <CardHeader><h2 className='text-lg font-semibold'>All Orders ({filteredOrders.length})</h2></CardHeader>
                <CardContent className='p-0'>
                    {loading ? (
                        <div className='text-center py-20'>Loading orders...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className='text-center py-20 text-gray-500'>
                            <Package className='h-16 w-16 mx-auto text-gray-300 mb-4' />
                            <p className='text-lg'>No orders found</p>
                            <p className='text-sm'>Try changing filters</p>
                        </div>
                    ) : (
                        <Table>
                            <TableBody>
                                {filteredOrders.map((order) => {
                                    const productTypes = getProductTypes(order)
                                    
                                    return (
                                        <React.Fragment key={order._id}>
                                            {/* Order Header Row */}
                                            <TableRow className='bg-gray-100 border-t-2 border-gray-300 hover:bg-gray-200'>
                                                <TableCell colSpan={7} className='p-3'>
                                                    <div className='flex flex-wrap justify-between items-center gap-2'>
                                                        <div className='flex items-center gap-3'>
                                                            <span className='font-bold text-sm font-mono'>#{order.order_id?.slice(-12)}</span>
                                                            <span className='text-sm'>{order.name}</span>
                                                            <span className='text-xs text-gray-500'>📱 {order.phone}</span>
                                                            <span className='text-xs text-gray-400'>📍 {order.city}</span>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-xs text-gray-400'>{formatDate(order.createdAt)}</span>
                                                            <div className='flex gap-1'>
                                                                {productTypes.includes('thrift') && <Badge className='bg-purple-600 text-white text-xs'>Thrift</Badge>}
                                                                {productTypes.includes('brand_new') && <Badge className='bg-blue-600 text-white text-xs'>Brand</Badge>}
                                                            </div>
                                                            <Badge className='bg-gray-600 text-white text-xs'>{formatCurrency(order.totalAmount)}</Badge>
                                                            <Badge className={`${STATUS_COLORS[order.deliveryStatus] || STATUS_COLORS[order.status] || 'bg-gray-500'} text-white text-xs`}>
                                                                {order.deliveryStatus || order.status || 'pending'}
                                                            </Badge>
                                                            <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/orders/details/${order.order_id}`)}>
                                                                <Eye className='h-4 w-4' />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Product Sub-Rows */}
                                            {order.products?.map((product, idx) => {
                                                const imgUrl = product?.variantId?.media?.[0] || product?.productId?.media?.[0] || null
                                                const imgStr = typeof imgUrl === 'string' ? imgUrl : (imgUrl?.secure_url || null)
                                                const sku = product?.productId?.uniqueCode || product?.uniqueCode || '—'
                                                const variantSku = product?.variantId?.sku || ''
                                                const type = product?.productId?.productType || product?.productType || 'thrift'
                                                
                                                return (
                                                    <TableRow key={`${order._id}-${idx}`} className='hover:bg-gray-50 border-b'>
                                                        <TableCell className='pl-8 w-[300px]'>
                                                            <div className='flex items-center gap-3'>
                                                                <Image 
                                                                    src={imgStr ? getImageUrl(imgStr) : imgPlaceholder.src} 
                                                                    width={45} height={60} 
                                                                    alt="" 
                                                                    className='rounded border object-cover bg-gray-100 flex-shrink-0' 
                                                                    onError={(e) => { e.target.src = imgPlaceholder.src }} 
                                                                />
                                                                <div className='min-w-0'>
                                                                    <p className='font-medium text-sm line-clamp-1'>{product?.productId?.name || product?.name}</p>
                                                                    <div className='flex flex-wrap gap-1 mt-1'>
                                                                        <code className='bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono'>SKU: {sku}</code>
                                                                        {variantSku && <code className='bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-mono text-blue-700'>VAR: {variantSku}</code>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={`text-[10px] ${type === 'thrift' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                {type === 'thrift' ? 'Thrift' : 'Brand'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className='text-center text-sm'>Qty: {product?.qty}</TableCell>
                                                        <TableCell className='text-sm'>{formatCurrency(product?.sellingPrice)}</TableCell>
                                                        <TableCell className='text-sm font-semibold'>{formatCurrency((product?.sellingPrice || 0) * (product?.qty || 1))}</TableCell>
                                                        <TableCell>
                                                            {product?.variantId && (
                                                                <div className='flex gap-1'>
                                                                    <Badge variant="outline" className='text-[10px] px-1 py-0'>{product.variantId.size}</Badge>
                                                                    <Badge variant="outline" className='text-[10px] px-1 py-0'>{product.variantId.color}</Badge>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className='text-xs text-gray-500'>
                                                            <div className='flex items-center gap-1'>
                                                                <CreditCard className='h-3 w-3' />
                                                                {order.paymentMethod === 'cod' ? 'COD' : 'Online'}
                                                            </div>
                                                            <span className='text-[10px] font-mono'>{order.payment_id?.slice(-8)}</span>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </React.Fragment>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default AdminOrdersPage