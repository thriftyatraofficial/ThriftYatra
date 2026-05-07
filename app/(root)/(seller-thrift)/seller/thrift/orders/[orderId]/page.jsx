'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, Truck, Receipt, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'

const getStatusColor = (s) => {
    const c = { pending: 'bg-yellow-600', accepted: 'bg-green-600', packed: 'bg-blue-600', shipped: 'bg-purple-600', in_transit: 'bg-orange-600', delivered: 'bg-green-600', cancelled: 'bg-red-600' }
    return c[s] || 'bg-gray-600'
}

const ThriftSellerOrderDetails = () => {
    const params = useParams(); const router = useRouter()
    const [loading, setLoading] = useState(true); const [order, setOrder] = useState(null)
    const [accepting, setAccepting] = useState(false)

    useEffect(() => { if (params.orderId) fetchOrderDetails() }, [params.orderId])

    const fetchOrderDetails = async () => {
        try { setLoading(true); const { data } = await axios.get(`/api/seller/orders/${params.orderId}`); if (data.success) setOrder(data.data); else { showToast('error', 'Order not found'); router.back() } }
        catch { showToast('error', 'Failed to load order') } finally { setLoading(false) }
    }

    const handleAcceptOrder = async () => {
        try {
            setAccepting(true)
            const { data } = await axios.put('/api/seller/orders/accept', { orderId: order._id })
            if (data.success) {
                showToast('success', 'Order accepted! Admin notified.')
                if (data.adminWhatsAppLink) window.open(data.adminWhatsAppLink, '_blank')
                fetchOrderDetails()
            }
        } catch (error) { showToast('error', 'Failed to accept order') }
        finally { setAccepting(false) }
    }

    if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
    if (!order) return <div className="p-5 text-center"><Package className="h-12 w-12 mx-auto text-gray-300 mb-3" /><p>Order not found</p></div>

    return (
        <div className='w-full max-w-3xl mx-auto'>
            <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>

            <div className='flex justify-between items-center mb-6'>
                <div><h1 className='text-2xl font-bold'>Order #{order.orderId?.slice(-8)}</h1><p className='text-gray-500'>{formatDate(order.createdAt)}</p></div>
                <Badge className={`${getStatusColor(order.deliveryStatus)} text-white text-sm px-3 py-1`}>{order.deliveryStatus?.replace(/_/g, ' ') || 'pending'}</Badge>
            </div>

            <Card className="mb-6">
                <CardHeader><h2 className='text-lg font-semibold flex items-center gap-2'><Package className="h-5 w-5" /> Product</h2></CardHeader>
                <CardContent>
                    <div className='flex gap-4'>
                        <Image src={order.productImage ? getImageUrl(order.productImage) : imgPlaceholder.src} width={120} height={160} alt="" className='rounded border object-cover bg-gray-100' onError={(e) => { e.target.src = imgPlaceholder.src }} />
                        <div className='flex-1 space-y-3'>
                            <h3 className='font-semibold text-lg'>{order.productName}</h3>
                            <div className='bg-gray-50 p-3 rounded'><p className='text-xs text-gray-500'>SKU</p><code className='text-sm font-mono font-semibold'>{order.uniqueCode || '—'}</code></div>
                            {order.condition && <Badge variant="outline" className='capitalize'>{order.condition.replace(/_/g, ' ')}</Badge>}
                            <div className='grid grid-cols-2 gap-3'>
                                <div className='bg-gray-50 p-3 rounded text-center'><p className='text-xs text-gray-500'>Price</p><p className='font-semibold'>{formatCurrency(order.sellingPrice)}</p></div>
                                <div className='bg-gray-50 p-3 rounded text-center'><p className='text-xs text-gray-500'>Qty</p><p className='font-semibold'>{order.quantity || 1}</p></div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                <Card>
                    <CardHeader><h2 className='text-lg font-semibold flex items-center gap-2'><Truck className="h-5 w-5" /> Tracking</h2></CardHeader>
                    <CardContent>
                        {order.trackingNumber ? (
                            <div className='space-y-3'><div className='bg-gray-50 p-3 rounded'><p className='text-sm text-gray-500'>Courier</p><p className='font-medium'>{order.courierName}</p></div><div className='bg-gray-50 p-3 rounded'><p className='text-sm text-gray-500'>Tracking #</p><code className='font-mono text-sm'>{order.trackingNumber}</code></div></div>
                        ) : <p className='text-gray-500 text-center py-4'>Admin will update tracking</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><h2 className='text-lg font-semibold flex items-center gap-2'><Receipt className="h-5 w-5" /> Earnings</h2></CardHeader>
                    <CardContent className='space-y-2'>
                        <div className='flex justify-between'><span className='text-gray-500'>Total</span><span>{formatCurrency(order.totalAmount)}</span></div>
                        <div className='flex justify-between text-red-500'><span className='text-gray-500'>Commission</span><span>-{formatCurrency(order.commission || 0)}</span></div>
                        <div className='flex justify-between border-t pt-2 font-semibold'><span>You Earn</span><span className='text-green-600'>{formatCurrency(order.sellerEarnings || order.totalAmount)}</span></div>
                    </CardContent>
                </Card>
            </div>

            {/* ✅ Accept Button or Status */}
            {order.deliveryStatus === 'pending' && (
                <div className="text-center mb-4">
                    <Button onClick={handleAcceptOrder} disabled={accepting} className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8 py-4 text-lg">
                        {accepting ? 'Accepting...' : <><CheckCircle className="h-5 w-5" /> ✅ Accept Order</>}
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">Accept to notify admin for pickup</p>
                </div>
            )}

            {order.deliveryStatus === 'accepted' && (
                <div className='text-center bg-green-50 p-4 rounded-lg'>
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className='font-medium text-green-800'>Order Accepted!</p>
                    <p className='text-sm text-green-600 mt-1'>Admin will pick, pack & ship soon.</p>
                </div>
            )}

            {order.deliveryStatus !== 'pending' && order.deliveryStatus !== 'accepted' && (
                <div className='text-center bg-blue-50 p-4 rounded-lg'>
                    <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className='font-medium text-blue-800'>Order in progress</p>
                    <p className='text-sm text-blue-600 mt-1'>Status: {order.deliveryStatus?.replace(/_/g, ' ')}</p>
                </div>
            )}
        </div>
    )
}

export default ThriftSellerOrderDetails