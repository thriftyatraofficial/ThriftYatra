'use client'
import WebsiteBreadcrumb from "@/components/Application/Website/WebsiteBreadcrumb"
import axios from "axios"
import Image from "next/image"
import placeholderImg from '@/public/assets/images/img-placeholder.webp'
import Link from "next/link"
import { WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from "@/routes/WebsiteRoute"
import { getImageUrl } from '@/lib/imageUtils'
import React, { useEffect, useState } from 'react'
import OrderTimeline from '@/components/Application/Website/OrderTimeline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Package, Truck, CheckCircle, Clock, Phone, MessageCircle } from 'lucide-react'
import { getAdminWhatsAppLink } from '@/lib/notifications'
import { useParams } from 'next/navigation'

const STATUS_INFO = {
    pending_verification: { label: 'Payment Pending', icon: Clock, color: 'bg-yellow-600' },
    awaiting_seller: { label: 'Seller Preparing', icon: Package, color: 'bg-blue-600' },
    ready_to_ship: { label: 'Ready to Ship', icon: Package, color: 'bg-purple-600' },
    in_transit: { label: 'In Transit', icon: Truck, color: 'bg-orange-600' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'bg-green-600' },
    settlement_pending: { label: 'Completed', icon: CheckCircle, color: 'bg-teal-600' },
    completed: { label: 'Completed', icon: CheckCircle, color: 'bg-gray-600' },
    cancelled: { label: 'Cancelled', icon: CheckCircle, color: 'bg-red-600' },
    pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-600' },
    processing: { label: 'Processing', icon: Package, color: 'bg-blue-600' },
    shipped: { label: 'Shipped', icon: Truck, color: 'bg-purple-600' }
}

const OrderDetails = () => {
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const { orderid } = useParams()

    useEffect(() => {
        if (orderid) fetchOrder()
    }, [orderid])

    const fetchOrder = async () => {
        try {
            const { data } = await axios.get(`/api/orders/get/${orderid}`)
            console.log('Order response:', data)
            // ✅ Fix: data.data is the order, not data.data.data
            if (data.success && data.data) {
                setOrder(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch order:', error)
        } finally {
            setLoading(false)
        }
    }

    const breadcrumb = { title: 'Order Details', links: [{ label: 'Order Details' }] }

    const getProductImage = (product) => {
        return product?.variantId?.media?.[0]?.secure_url || 
               product?.variantId?.media?.[0] || 
               product?.productId?.media?.[0]?.secure_url || 
               product?.productId?.media?.[0]
    }

    const status = STATUS_INFO[order?.status] || STATUS_INFO.pending_verification

    // ✅ WhatsApp contact admin
    const handleContactAdmin = () => {
        const msg = `Hi ThriftYatra, I have a question about my order #${order?.order_id?.slice(-8)}`
        window.open(getAdminWhatsAppLink(msg), '_blank')
    }

    if (loading) return (
        <div className="flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )

    if (!order) return (
        <div className="flex justify-center items-center h-[400px]">
            <div className="text-center">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h4 className="text-xl font-semibold mb-2">Order Not Found</h4>
                <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
                <Link href={WEBSITE_SHOP}><Button variant="outline">Browse Shop</Button></Link>
            </div>
        </div>
    )

    return (
        <div>
            <WebsiteBreadcrumb props={breadcrumb} />
            <div className="lg:px-32 px-5 my-20">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge className={`${status.color} text-white text-sm px-4 py-2`}>
                            <status.icon className="h-4 w-4 mr-1 inline" />
                            {status.label}
                        </Badge>
                    </div>
                    <h1 className="text-2xl font-bold">Order #{order?.order_id?.slice(-8)}</h1>
                    <p className="text-gray-500">Placed on {new Date(order?.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    
                    {/* ✅ Payment Info */}
                    <div className="flex gap-4 mt-3">
                        <Badge variant="outline">{order?.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}</Badge>
                        {order?.trackingNumber && (
                            <Badge variant="outline" className="bg-blue-50">📦 {order.courierName}: {order.trackingNumber}</Badge>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                <OrderTimeline order={order} />

                {/* Products */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Items</h2>
                        {order?.products?.map((product, i) => (
                            <div key={product.variantId?._id || product.productId || i} className="flex items-center gap-4 py-4 border-b last:border-0">
                                <Image src={getImageUrl(getProductImage(product))} width={80} height={106} alt="product" className="rounded object-cover" onError={(e) => { e.target.src = placeholderImg.src }} />
                                <div className="flex-1">
                                    <Link href={WEBSITE_PRODUCT_DETAILS(product?.productId?.slug)} className="font-medium hover:text-[#E8B931]">
                                        {product?.productId?.name || product?.name}
                                    </Link>
                                    {product?.productId?.uniqueCode && (
                                        <p className="text-xs text-gray-400">SKU: {product.productId.uniqueCode}</p>
                                    )}
                                    {product?.variantId?.color && <p className="text-sm text-gray-500">Color: {product?.variantId?.color}</p>}
                                    {product?.variantId?.size && <p className="text-sm text-gray-500">Size: {product?.variantId?.size}</p>}
                                    <p className="text-sm text-gray-500">Qty: {product.qty}</p>
                                </div>
                                <p className="font-semibold">{(product.qty * product.sellingPrice).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Shipping Address */}
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold mb-4">📋 Shipping Address</h2>
                            <div className="space-y-1 text-sm">
                                <p className="font-medium">{order?.name}</p>
                                <p className="text-gray-500">📱 {order?.phone}</p>
                                {order?.altPhone && <p className="text-gray-500">📱 Alt: {order.altPhone}</p>}
                                <p className="text-gray-500">{order?.landmark && `${order.landmark}, `}{order?.city}, {order?.state} - {order?.pincode}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Summary */}
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold mb-4">💰 Order Summary</h2>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr><td className="py-2">Subtotal</td><td className="text-end">{order?.subtotal?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td></tr>
                                    <tr><td className="py-2 text-green-600">Discount</td><td className="text-end text-green-600">-{order?.discount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td></tr>
                                    {order?.codFee > 0 && <tr><td className="py-2">COD Fee</td><td className="text-end">{order?.codFee?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td></tr>}
                                    <tr className="border-t font-bold text-lg"><td className="py-2">Total</td><td className="text-end">{order?.totalAmount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td></tr>
                                </tbody>
                            </table>
                            
                            {/* ✅ Contact Admin Button */}
                            <div className="mt-4 pt-4 border-t">
                                <Button onClick={handleContactAdmin} variant="outline" className="w-full gap-2">
                                    <MessageCircle className="h-4 w-4" /> Have questions? Contact us on WhatsApp
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default OrderDetails
