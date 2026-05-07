'use client'
import Image from "next/image"
import placeholderImg from '@/public/assets/images/img-placeholder.webp'
import Link from "next/link"
import { WEBSITE_PRODUCT_DETAILS } from "@/routes/WebsiteRoute"
import useFetch from "@/hooks/useFetch"
import { use, useEffect, useState } from "react"
import { ADMIN_DASHBOARD, ADMIN_ORDER_SHOW } from "@/routes/AdminPanelRoute"
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import Select from "@/components/Application/Select"
import { getImageUrl } from '@/lib/imageUtils'
import ButtonLoading from "@/components/Application/ButtonLoading"
import { showToast } from "@/lib/showToast"
import axios from "axios"
import OrderTimeline from '@/components/Application/Website/OrderTimeline'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, Truck, MapPin, Phone, CreditCard, User, MessageCircle, Send, Store } from 'lucide-react'
import { getWhatsAppLink, WA_TEMPLATES } from '@/lib/notifications'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_ORDER_SHOW, label: 'Orders' },
    { href: '', label: 'Order Details' },
]

const STATUS_LABELS = {
    pending_verification: { label: 'Pending Verification', color: 'bg-yellow-600' },
    awaiting_seller: { label: 'Awaiting Seller', color: 'bg-blue-600' },
    ready_to_ship: { label: 'Ready to Ship', color: 'bg-purple-600' },
    in_transit: { label: 'In Transit', color: 'bg-orange-600' },
    delivered: { label: 'Delivered', color: 'bg-green-600' },
    settlement_pending: { label: 'Settlement Pending', color: 'bg-teal-600' },
    completed: { label: 'Completed', color: 'bg-gray-600' },
    cancelled: { label: 'Cancelled', color: 'bg-red-600' },
    unverified: { label: 'Unverified', color: 'bg-gray-500' },
    pending: { label: 'Pending', color: 'bg-yellow-600' },
    processing: { label: 'Processing', color: 'bg-blue-600' },
    shipped: { label: 'Shipped', color: 'bg-purple-600' }
}

const statusOptions = Object.entries(STATUS_LABELS).map(([value, { label }]) => ({ label, value }))

const AdminOrderDetails = ({ params }) => {
    const { order_id } = use(params)
    const [orderData, setOrderData] = useState()
    const [orderStatusState, setOrderStatusState] = useState()
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [trackingInput, setTrackingInput] = useState('')
    const [courierInput, setCourierInput] = useState('')
    const { data, loading } = useFetch(`/api/orders/get/${order_id}`)

    useEffect(() => {
        if (data && data.success) { 
            setOrderData(data.data)
            setOrderStatusState(data?.data?.status)
            setTrackingInput(data?.data?.trackingNumber || '')
            setCourierInput(data?.data?.courierName || '')
        }
    }, [data])

    const handleOrderStatus = async () => {
        setUpdatingStatus(true)
        try {
            const { data: response } = await axios.put('/api/orders/update-status', { 
                _id: orderData?._id, 
                status: orderStatusState 
            })
            if (!response.success) throw new Error(response.message)
            showToast('success', response.message)
            const refreshed = await axios.get(`/api/orders/get/${order_id}`)
            if (refreshed.data.success) setOrderData(refreshed.data.data)
        } catch (error) { showToast('error', error.message) }
        finally { setUpdatingStatus(false) }
    }

    const handleNotifySeller = () => {
        const seller = orderData?.products?.[0]?.sellerId
        const sellerPhone = seller?.phone || seller?.sellerProfile?.phone
        if (!sellerPhone) { showToast('error', 'Seller phone not found'); return }
        
        const product = orderData?.products?.[0]
        const msg = WA_TEMPLATES.notifySeller(
            orderData.order_id?.slice(-8),
            product?.name || product?.productId?.name || 'Product',
            product?.variantId?.size || '',
            product?.variantId?.color || '',
            orderData.totalAmount?.toLocaleString('en-IN')
        )
        window.open(getWhatsAppLink(sellerPhone, msg), '_blank')
        showToast('success', 'WhatsApp opened for seller')
    }

    const handleSendTracking = async (to = 'customer') => {
        const tracking = trackingInput || orderData?.trackingNumber
        const courier = courierInput || orderData?.courierName
        
        if (!tracking || !courier) { showToast('error', 'Enter tracking number and courier name'); return }
        
        try {
            await axios.put('/api/orders/update-status', {
                _id: orderData?._id,
                status: 'in_transit',
                trackingNumber: tracking,
                courierName: courier
            })
        } catch (e) {}

        if (to === 'customer') {
            const msg = WA_TEMPLATES.trackingCustomer(orderData.order_id?.slice(-8), courier, tracking)
            window.open(getWhatsAppLink(orderData?.phone, msg), '_blank')
        } else {
            const seller = orderData?.products?.[0]?.sellerId
            const sellerPhone = seller?.phone || seller?.sellerProfile?.phone
            if (!sellerPhone) { showToast('error', 'Seller phone not found'); return }
            const msg = WA_TEMPLATES.trackingSeller(orderData.order_id?.slice(-8), courier, tracking)
            window.open(getWhatsAppLink(sellerPhone, msg), '_blank')
        }
        showToast('success', `Tracking sent to ${to === 'customer' ? 'customer' : 'seller'}`)
    }

    const getProductImage = (product) => {
        if (product?.variantId?.media?.[0]) {
            const m = product.variantId.media[0]
            return typeof m === 'string' ? m : m?.secure_url || null
        }
        if (product?.productId?.media?.[0]) {
            const m = product.productId.media[0]
            return typeof m === 'string' ? m : m?.secure_url || null
        }
        if (product?.productId?.base64Media?.[0]) {
            return product.productId.base64Media[0]?.secure_url || null
        }
        return null
    }

    const currentStatus = STATUS_LABELS[orderData?.status] || { label: orderData?.status || 'Unknown', color: 'bg-gray-500' }
    const sellerInfo = orderData?.products?.[0]?.sellerId

    if (loading) return (
        <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    )

    if (!orderData) return (
        <div className="flex justify-center items-center py-32">
            <div className="text-center">
                <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h4 className="text-xl font-semibold text-gray-500">Order Not Found</h4>
            </div>
        </div>
    )

    return (
        <div>
            <BreadCrumb breadcrumbData={breadcrumbData} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Order #{orderData?.order_id?.slice(-8)}</h1>
                        <p className="text-gray-500">
                            {new Date(orderData?.createdAt).toLocaleDateString('en-IN', { 
                                day: '2-digit', month: 'short', year: 'numeric' 
                            })} • {orderData?.paymentMethod === 'cod' ? 'COD' : 'Paid'}
                        </p>
                    </div>
                    <Badge className={`${currentStatus.color} text-white text-sm px-4 py-2`}>
                        {currentStatus.label}
                    </Badge>
                </div>

                {/* Timeline */}
                <OrderTimeline order={orderData} />

                {/* Info Cards - 4 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Customer */}
                    <Card>
                        <CardContent className="p-4 flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-gray-500">👤 Customer</p>
                                <p className="font-semibold">{orderData?.name}</p>
                                <p className="text-sm">📱 {orderData?.phone}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Destination */}
                    <Card>
                        <CardContent className="p-4 flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-gray-500">📦 Deliver To</p>
                                <p className="font-semibold">{orderData?.city}, {orderData?.state}</p>
                                <p className="text-sm">📮 {orderData?.pincode}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-500">💳 Payment</p>
                                    <p className="font-semibold">{orderData?.paymentMethod === 'cod' ? 'COD' : 'Paid Online'}</p>
                                </div>
                            </div>
                            {orderData?.trackingNumber && (
                                <div className="bg-blue-50 p-2 rounded text-xs">
                                    <p className="font-medium">🚚 {orderData.courierName}</p>
                                    <code>{orderData.trackingNumber}</code>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ✅ Seller Pickup Address */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4 flex items-start gap-3">
                            <Store className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-gray-500">🏪 Seller Pickup</p>
                                {sellerInfo ? (
                                    <>
                                        <p className="font-semibold text-sm">{sellerInfo?.sellerProfile?.storeName || sellerInfo?.name || 'N/A'}</p>
                                        <p className="text-xs">📱 {sellerInfo?.phone || sellerInfo?.sellerProfile?.phone || 'N/A'}</p>
                                        {sellerInfo?.pickupAddress && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {sellerInfo.pickupAddress.address}, {sellerInfo.pickupAddress.city}, {sellerInfo.pickupAddress.state} - {sellerInfo.pickupAddress.pincode}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-xs text-gray-400">No seller info</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Products Table */}
                <Card>
                    <CardHeader><h2 className="text-lg font-semibold">📦 Products</h2></CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-gray-500 bg-gray-50">
                                    <th className="p-3">Product</th>
                                    <th className="p-3">SKU</th>
                                    <th className="p-3 text-center">Price</th>
                                    <th className="p-3 text-center">Qty</th>
                                    <th className="p-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderData?.products?.map((product, i) => {
                                    const imgUrl = getProductImage(product)
                                    const sku = product?.productId?.uniqueCode || product?.uniqueCode || '—'
                                    return (
                                        <tr key={i} className="border-b hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="flex items-center gap-4">
                                                    <Image 
                                                        src={imgUrl ? getImageUrl(imgUrl) : placeholderImg} 
                                                        width={60} height={80} alt="" 
                                                        className="rounded border object-cover bg-gray-100 flex-shrink-0"
                                                        onError={(e) => { e.target.src = placeholderImg.src }}
                                                    />
                                                    <div>
                                                        <p className="font-medium">{product?.productId?.name || product?.name}</p>
                                                        {product?.variantId && (
                                                            <div className="flex gap-2 mt-1">
                                                                <Badge variant="outline" className="text-xs">{product.variantId.size}</Badge>
                                                                <Badge variant="outline" className="text-xs">{product.variantId.color}</Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3"><code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{sku}</code></td>
                                            <td className="p-3 text-center text-sm">₹{product?.sellingPrice?.toLocaleString('en-IN')}</td>
                                            <td className="p-3 text-center text-sm">{product?.qty}</td>
                                            <td className="p-3 text-right font-semibold text-sm">₹{((product?.sellingPrice || 0) * (product?.qty || 1)).toLocaleString('en-IN')}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Address + Summary + Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Shipping Address */}
                    <Card>
                        <CardHeader><h2 className="text-lg font-semibold">📍 Shipping Address</h2></CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p className="font-semibold text-lg">{orderData?.name}</p>
                            <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {orderData?.phone}</p>
                            <p className="text-gray-600">{orderData?.landmark && `${orderData.landmark}, `}{orderData?.city}, {orderData?.state} - {orderData?.pincode}</p>
                            {orderData?.address && <p className="text-gray-500">{orderData.address}</p>}
                            {orderData?.ordernote && <p className="text-gray-500 mt-2 bg-gray-50 p-2 rounded">📝 {orderData.ordernote}</p>}
                        </CardContent>
                    </Card>

                    {/* Order Summary + Actions */}
                    <Card>
                        <CardHeader><h2 className="text-lg font-semibold">💰 Order Summary</h2></CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr><td className="py-2">Subtotal</td><td className="text-right">₹{orderData?.subtotal?.toLocaleString('en-IN')}</td></tr>
                                    <tr><td className="py-2 text-green-600">Discount</td><td className="text-right text-green-600">-₹{orderData?.discount?.toLocaleString('en-IN')}</td></tr>
                                    {orderData?.couponDiscountAmount > 0 && (
                                        <tr><td className="py-2 text-green-600">Coupon</td><td className="text-right text-green-600">-₹{orderData?.couponDiscountAmount?.toLocaleString('en-IN')}</td></tr>
                                    )}
                                    <tr className="border-t font-bold text-lg"><td className="py-2">Total</td><td className="text-right text-[#E8B931]">₹{orderData?.totalAmount?.toLocaleString('en-IN')}</td></tr>
                                </tbody>
                            </table>

                            {/* Update Status */}
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-medium mb-2">Update Status</p>
                                <Select options={statusOptions} selected={orderStatusState} setSelected={(value) => setOrderStatusState(value)} placeholder="Select status" isMulti={false} />
                                <ButtonLoading type="button" loading={updatingStatus} onClick={handleOrderStatus} text="Update Status" className="mt-2 w-full" />
                            </div>

                            {/* ✅ WhatsApp Actions */}
                            <div className="mt-4 pt-4 border-t space-y-3">
                                <p className="text-sm font-medium">📱 WhatsApp Actions</p>
                                
                                <Button onClick={handleNotifySeller} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2" variant="outline">
                                    <MessageCircle className="h-4 w-4" /> Notify Seller via WhatsApp
                                </Button>
                                
                                <div className="space-y-2">
                                    <Input placeholder="Courier (e.g. Delhivery)" value={courierInput} onChange={(e) => setCourierInput(e.target.value)} className="text-sm" />
                                    <Input placeholder="Tracking Number" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} className="text-sm" />
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleSendTracking('customer')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm gap-1">
                                            <Send className="h-3 w-3" /> Customer
                                        </Button>
                                        <Button onClick={() => handleSendTracking('seller')} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm gap-1">
                                            <Send className="h-3 w-3" /> Seller
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default AdminOrderDetails