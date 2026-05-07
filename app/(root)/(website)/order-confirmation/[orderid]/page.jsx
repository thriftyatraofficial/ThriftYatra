'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, ShoppingBag, MapPin } from 'lucide-react'
import Link from 'next/link'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { getAdminWhatsAppLink, WA_TEMPLATES } from '@/lib/notifications'

const OrderConfirmation = () => {
    const { orderid } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { if (orderid) fetchOrder() }, [orderid])

    const fetchOrder = async () => {
        try {
            const { data } = await axios.get(`/api/orders/get/${orderid}`)
            if (data.success) setOrder(data.data)
        } catch (error) { console.error('Failed to fetch order:', error) }
        finally { setLoading(false) }
    }

    const handleShareLocation = () => {
        const message = WA_TEMPLATES.shareLocation(order?.order_id || '')
        const waLink = getAdminWhatsAppLink(message)
        window.open(waLink, '_blank')
    }

    if (loading) return <div className="flex justify-center items-center h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
    if (!order) return <div className="flex justify-center items-center h-[400px]"><div className="text-center"><h1 className="text-2xl font-bold mb-4">Order Not Found</h1><Link href={WEBSITE_SHOP}><Button>Continue Shopping</Button></Link></div></div>

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <Card>
                <CardContent className="p-8 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Payment Successful! 🎉</h1>
                    <p className="text-gray-500 mb-6">Your order is now processing.</p>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Order ID</span><span className="font-mono font-bold">{order?.order_id}</span></div>
                        <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Amount</span><span className="font-bold">{formatCurrency(order?.totalAmount)}</span></div>
                        <div className="flex justify-between py-2"><span className="text-gray-500">Status</span><Badge className="bg-yellow-600">Processing</Badge></div>
                    </div>

                    {/* ✅ Share Location Button */}
                    <Button onClick={handleShareLocation} className="w-full bg-green-600 hover:bg-green-700 text-white mb-4 gap-2" size="lg">
                        <MapPin className="h-5 w-5" /> 📍 Share Your Delivery Location
                    </Button>
                    <p className="text-xs text-gray-500 mb-4">Opens WhatsApp to share your live location for delivery</p>

                    <Link href={WEBSITE_SHOP}><Button variant="outline" className="gap-2"><ShoppingBag className="h-4 w-4" /> Continue Shopping</Button></Link>
                </CardContent>
            </Card>
        </div>
    )
}

export default OrderConfirmation