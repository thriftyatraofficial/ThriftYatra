import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import OrderModel from "@/models/Order.model";

export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['admin']);
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.');
        }

        await connectDB();
        const payload = await request.json();
        const { orderId, deliveryStatus, trackingNumber, courierName } = payload;

        const validStatuses = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
        
        if (!orderId || !deliveryStatus || !validStatuses.includes(deliveryStatus)) {
            return response(false, 400, 'Invalid order ID or delivery status.');
        }

        const order = await OrderModel.findById(orderId);
        if (!order) {
            return response(false, 404, 'Order not found.');
        }

        // Update delivery info
        order.deliveryStatus = deliveryStatus;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (courierName) order.courierName = courierName;
        
        if (deliveryStatus === 'delivered') {
            order.deliveredAt = new Date();
        }

        // Add to tracking history
        order.trackingHistory = order.trackingHistory || [];
        order.trackingHistory.push({
            status: deliveryStatus,
            timestamp: new Date(),
            note: `Status updated to ${deliveryStatus}`
        });

        await order.save();

        // TODO: Send notification to customer about delivery update

        return response(true, 200, 'Delivery status updated successfully.', order);

    } catch (error) {
        return catchError(error);
    }
}