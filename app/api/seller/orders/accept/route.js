import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import OrderModel from "@/models/Order.model"
import mongoose from "mongoose"
import { getWhatsAppLink, WA_TEMPLATES } from "@/lib/notifications"

export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { orderId } = await request.json()

        const order = await OrderModel.findOne({
            _id: new mongoose.Types.ObjectId(orderId),
            'products.sellerId': new mongoose.Types.ObjectId(auth.userId),
            deletedAt: null
        })

        if (!order) return response(false, 404, 'Order not found.')

        order.deliveryStatus = 'accepted'
        order.status = 'awaiting_seller'
        order.trackingHistory.push({
            status: 'accepted', timestamp: new Date(),
            note: 'Seller accepted the order', updatedBy: auth.userId
        })

        await order.save()

        // ✅ WhatsApp link for Admin (to notify about acceptance)
        const adminMsg = WA_TEMPLATES.sellerAcceptedAdmin(order.order_id.slice(-8))
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '918499980521';
        const adminWALink = getWhatsAppLink(adminPhone, adminMsg)

        return response(true, 200, 'Order accepted! Admin notified.', { order, adminWhatsAppLink: adminWALink })

    } catch (error) {
        return catchError(error)
    }
}