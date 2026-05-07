import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import OrderModel from "@/models/Order.model"
import mongoose from "mongoose"
import { getWhatsAppLink, WA_TEMPLATES } from "@/lib/notifications"
import { sendMail } from "@/lib/sendMail"

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        const { trackingNumber, courierName } = await request.json()

        if (!trackingNumber || !courierName) return response(false, 400, 'Tracking number and courier name required.')

        const order = await OrderModel.findOne({
            _id: new mongoose.Types.ObjectId(id),
            'products.sellerId': new mongoose.Types.ObjectId(auth.userId),
            deletedAt: null
        })

        if (!order) return response(false, 404, 'Order not found.')

        order.deliveryStatus = 'shipped'
        order.status = 'in_transit'
        order.trackingNumber = trackingNumber
        order.courierName = courierName
        order.shippedAt = new Date()
        
        if (!order.trackingHistory) order.trackingHistory = []
        order.trackingHistory.push({
            status: 'shipped', timestamp: new Date(),
            note: `Shipped via ${courierName} - Tracking: ${trackingNumber}`,
            updatedBy: auth.userId
        })

        await order.save()

        // ✅ Send Shipped Email to Customer
        if (order.email) {
            try {
                await sendMail(
                    'Your ThriftYatra Order Has Shipped! 🚚',
                    order.email,
                    `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #E8B931;">ThriftYatra</h2>
                        <h3>Your order is on the way!</h3>
                        <p>Order: <strong>#${order.order_id.slice(-8)}</strong></p>
                        <p>Courier: <strong>${courierName}</strong></p>
                        <p>Tracking: <strong>${trackingNumber}</strong></p>
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/order-details/${order.order_id}" 
                           style="display: inline-block; background: #E8B931; color: #000; padding: 10px 25px; text-decoration: none; border-radius: 25px; margin-top: 10px;">
                            Track Your Order
                        </a>
                        <p style="margin-top: 20px; color: #666; font-size: 12px;">Thank you for shopping with ThriftYatra!</p>
                    </div>`
                );
                console.log('📧 Shipping email sent to:', order.email);
            } catch (e) { console.error('Shipping email failed:', e.message); }
        }

        // ✅ Generate WhatsApp links for tracking
        const customerMsg = WA_TEMPLATES.trackingCustomer(order.order_id.slice(-8), courierName, trackingNumber)
        const sellerMsg = WA_TEMPLATES.trackingSeller(order.order_id.slice(-8), courierName, trackingNumber)
        
        const customerWALink = getWhatsAppLink(order.phone, customerMsg)
        const sellerWALink = getWhatsAppLink(auth.phone || '', sellerMsg)

        return response(true, 200, 'Order shipped!', { 
            order,
            customerWhatsAppLink: customerWALink,
            sellerWhatsAppLink: sellerWALink
        })

    } catch (error) {
        return catchError(error)
    }
}