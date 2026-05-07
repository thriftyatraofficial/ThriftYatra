import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import OrderModel from "@/models/Order.model"
import UserModel from "@/models/User.model"

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { sellerId } = await params
        
        const seller = await UserModel.findOne({ sellerId, deletedAt: null })
        if (!seller) return response(false, 404, 'Seller not found.')
        
        const orders = await OrderModel.find({ 
            'products.sellerId': seller._id,
            deletedAt: null 
        }).sort({ createdAt: -1 }).lean()
        
        const formattedOrders = orders.map(order => {
            const sellerItem = order.products.find(p => p.sellerId.toString() === seller._id.toString())
            return {
                _id: order._id,
                orderId: order.order_id,
                productName: sellerItem?.name || 'Product',
                customerName: order.name,
                customerPhone: order.phone,
                amount: (sellerItem?.sellingPrice || 0) * (sellerItem?.qty || 1),
                status: order.deliveryStatus || order.status,
                createdAt: order.createdAt
            }
        })
        
        const totalSales = formattedOrders.reduce((sum, o) => sum + o.amount, 0)
        
        return response(true, 200, 'Orders fetched.', { orders: formattedOrders, totalSales })
    } catch (error) {
        return catchError(error)
    }
}