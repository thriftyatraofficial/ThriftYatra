import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { getAdminWhatsAppLink, WA_TEMPLATES } from "@/lib/notifications"
import OrderModel from "@/models/Order.model"
import mongoose from "mongoose"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        
        const filter = auth.role === 'admin' 
            ? { deletedAt: null }
            : { 'products.sellerId': new mongoose.Types.ObjectId(auth.userId), deletedAt: null }

        const orders = await OrderModel.find(filter)
            .sort({ createdAt: -1 })
            .lean()

        const formattedOrders = []
        for (const order of orders) {
            const sellerItem = order.products.find(
                item => item.sellerId?.toString() === auth.userId.toString()
            )
            
            if (!sellerItem) continue

            let productData = null
            let variantData = null
            
            if (sellerItem.productId) {
                productData = await ProductModel.findById(sellerItem.productId)
                    .select('uniqueCode media base64Media name')
                    .lean()
            }

            if (sellerItem.variantId) {
                variantData = await ProductVariantModel.findById(sellerItem.variantId)
                    .select('media size color sku')
                    .lean()
            }

            let productImage = null
            if (variantData?.media?.length > 0) {
                const vm = variantData.media[0]
                productImage = typeof vm === 'string' ? vm : (vm?.secure_url || null)
            }
            if (!productImage && productData?.media?.length > 0) {
                productImage = productData.media[0]
            }
            if (!productImage && productData?.base64Media?.length > 0) {
                productImage = productData.base64Media[0]?.secure_url || null
            }

            formattedOrders.push({
                _id: order._id,
                orderId: order.order_id,
                productName: sellerItem?.name || productData?.name || 'Product',
                productImage: productImage,
                uniqueCode: productData?.uniqueCode || variantData?.sku || '—',
                size: sellerItem?.size || variantData?.size || null,
                color: sellerItem?.color || variantData?.color || null,
                condition: sellerItem?.condition || null,
                quantity: sellerItem?.qty || 1,
                sellingPrice: sellerItem?.sellingPrice || 0,
                mrp: sellerItem?.mrp || 0,
                unitPrice: sellerItem?.sellingPrice || 0,
                totalAmount: (sellerItem?.sellingPrice || 0) * (sellerItem?.qty || 1),
                commission: sellerItem?.commission || 0,
                deliveryStatus: order.deliveryStatus || 'pending',
                trackingNumber: order.trackingNumber || null,
                courierName: order.courierName || null,
                createdAt: order.createdAt
            })
        }

        const stats = {
            total: formattedOrders.length,
            pending: formattedOrders.filter(o => o.deliveryStatus === 'pending' || o.deliveryStatus === 'packed').length,
            shipped: formattedOrders.filter(o => o.deliveryStatus === 'shipped').length,
            delivered: formattedOrders.filter(o => o.deliveryStatus === 'delivered').length
        }

        return response(true, 200, 'Orders fetched.', { orders: formattedOrders, stats })

    } catch (error) {
        console.error('Seller orders error:', error)
        return catchError(error)
    } 
}

// ✅ FIXED: PUT method to accept an order
export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { orderId } = await request.json()

        if (!orderId) return response(false, 400, 'Order ID required.')

        const order = await OrderModel.findOne({
            _id: new mongoose.Types.ObjectId(orderId),
            'products.sellerId': new mongoose.Types.ObjectId(auth.userId),
            deletedAt: null
        })

        if (!order) return response(false, 404, 'Order not found.')

        // Update order status
        order.deliveryStatus = 'accepted'
        order.status = 'ready_to_ship'
        
        if (!order.trackingHistory) order.trackingHistory = []
        order.trackingHistory.push({
            status: 'accepted',
            timestamp: new Date(),
            note: `Order accepted by seller`,
            updatedBy: auth.userId
        })

        await order.save()

        // Generate admin WhatsApp notification
        const adminMsg = WA_TEMPLATES.sellerAcceptedAdmin(order.order_id.slice(-8))
        const adminWALink = getAdminWhatsAppLink(adminMsg)

        // Send email to customer if available
        if (order.email) {
            try {
                const { sendMail } = await import('@/lib/sendMail')
                await sendMail(
                    'Your ThriftYatra Order is Confirmed! ✅',
                    order.email,
                    `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #E8B931;">ThriftYatra</h2>
                        <h3>Good news! Your order has been accepted by the seller!</h3>
                        <p>Order: <strong>#${order.order_id.slice(-8)}</strong></p>
                        <p>The seller will prepare your order for pickup. We'll send tracking details once it ships.</p>
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/order-details/${order.order_id}" 
                           style="display: inline-block; background: #E8B931; color: #000; padding: 10px 25px; text-decoration: none; border-radius: 25px; margin-top: 10px;">
                            Track Your Order
                        </a>
                    </div>`
                )
            } catch (e) { console.error('Accept email failed:', e.message) }
        }

        return response(true, 200, 'Order accepted!', { 
            order, 
            adminWhatsAppLink: adminWALink 
        })

    } catch (error) {
        return catchError(error)
    }
}