import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import OrderModel from "@/models/Order.model"

export async function GET(request) {
    try {
        await connectDB()
        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get('orderId')
        const phone = searchParams.get('phone')
        
        if (!orderId || !phone) {
            return response(false, 400, 'Order ID and phone are required')
        }
        
        const order = await OrderModel.findOne({ 
            order_id: orderId, 
            phone: phone,
            deletedAt: null 
        }).lean()
        
        if (!order) {
            return response(false, 404, 'Order not found')
        }
        
        return response(true, 200, 'Order found', order)
    } catch (error) {
        return catchError(error)
    }
}