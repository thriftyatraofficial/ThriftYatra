import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { canAccessOrder } from "@/lib/orderAccess";
import OrderModel from "@/models/Order.model";

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['user', 'admin']);
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.');
        }
        
        await connectDB();
        const payload = await request.json();
        const { orderId, reason, description } = payload;
        
        if (!orderId) {
            return response(false, 400, 'Order ID is required');
        }
        
        const order = await OrderModel.findOne({ _id: orderId, deletedAt: null });
        if (!order) {
            return response(false, 404, 'Order not found');
        }

        if (!canAccessOrder(order, auth)) {
            return response(false, 403, 'Unauthorized.');
        }
        
        // Check if order is delivered
        if (order.status !== 'delivered') {
            return response(false, 400, 'Return can only be requested for delivered orders');
        }
        
        // Check return window (2 days)
        const deliveredDate = new Date(order.deliveredAt || order.updatedAt);
        const daysSinceDelivery = Math.floor((Date.now() - deliveredDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceDelivery > 2) {
            return response(false, 400, 'Return window has expired (2 days from delivery)');
        }
        
        // Update order
        order.returnRequest = {
            status: 'pending',
            reason: reason || 'Not specified',
            description: description || '',
            requestedAt: new Date()
        };
        
        await order.save();
        
        return response(true, 200, 'Return request submitted successfully', order);
        
    } catch (error) {
        console.error('Return request error:', error);
        return catchError(error);
    }
}
