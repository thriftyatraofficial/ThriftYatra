'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Package, Search, Truck, CheckCircle } from 'lucide-react'

const TrackOrderPage = () => {
    const [orderId, setOrderId] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [order, setOrder] = useState(null)

    const handleTrack = async (e) => {
        e.preventDefault()
        if (!orderId || !phone) {
            showToast('error', 'Please enter order ID and phone number')
            return
        }

        try {
            setLoading(true)
            const { data } = await axios.get(`/api/track-order?orderId=${orderId}&phone=${phone}`)
            if (data.success) {
                setOrder(data.data)
            } else {
                showToast('error', data.message || 'Order not found')
                setOrder(null)
            }
        } catch (error) {
            showToast('error', 'Failed to track order')
            setOrder(null)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className='min-h-screen bg-gray-50 py-10'>
            <div className='max-w-2xl mx-auto px-4'>
                <h1 className='text-3xl font-bold text-center mb-8'>track your order</h1>
                
                <Card>
                    <CardHeader>
                        <h2 className='text-xl font-semibold'>Enter order details</h2>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTrack} className='space-y-4'>
                            <div>
                                <Label>Order ID</Label>
                                <Input 
                                    placeholder="e.g., ORD25041234" 
                                    value={orderId} 
                                    onChange={(e) => setOrderId(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Phone Number</Label>
                                <Input 
                                    placeholder="Enter phone number used for order" 
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className='w-full bg-[#E8B931] hover:bg-[#d4a520] text-black' disabled={loading}>
                                <Search className="h-4 w-4 mr-2" />
                                {loading ? 'Tracking...' : 'Track Order'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {order && (
                    <Card className='mt-8'>
                        <CardHeader>
                            <h2 className='text-xl font-semibold'>Order Status</h2>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='flex justify-between items-center'>
                                <span className='text-gray-600'>Order ID:</span>
                                <span className='font-mono font-semibold'>{order.orderId}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-gray-600'>Status:</span>
                                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-gray-600'>Order Date:</span>
                                <span>{formatDate(order.createdAt)}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-gray-600'>Total Amount:</span>
                                <span className='font-semibold'>{formatCurrency(order.totalAmount)}</span>
                            </div>
                            
                            {order.trackingNumber && (
                                <>
                                    <div className='border-t pt-4 mt-4'>
                                        <p className='font-semibold mb-2 flex items-center gap-2'>
                                            <Truck className="h-4 w-4" /> Tracking Information
                                        </p>
                                        <div className='bg-gray-100 p-3 rounded'>
                                            <p className='text-sm text-gray-600'>Courier: {order.courierName}</p>
                                            <p className='font-mono font-semibold'>Tracking #: {order.trackingNumber}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {/* Timeline */}
                            <div className='border-t pt-4 mt-4'>
                                <p className='font-semibold mb-3'>Order Timeline</p>
                                <div className='space-y-3'>
                                    {['pending', 'processing', 'shipped', 'delivered'].map((status, i) => {
                                        const isCompleted = order.trackingHistory?.some(h => h.status === status) || 
                                                          (status === 'pending' && order.status !== 'cancelled')
                                        const isCurrent = order.status === status
                                        
                                        return (
                                            <div key={status} className='flex items-center gap-3'>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200'
                                                }`}>
                                                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : i + 1}
                                                </div>
                                                <span className={`${isCurrent ? 'font-semibold' : 'text-gray-600'}`}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default TrackOrderPage