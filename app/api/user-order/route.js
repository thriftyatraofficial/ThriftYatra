import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import OrderModel from "@/models/Order.model";

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['user', 'admin']);
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.');

        await connectDB();
        
        // ✅ Match by email (always present) or phone or userId
        const matchConditions = [];
        if (auth.userId) matchConditions.push({ userId: auth.userId });
        if (auth.email) matchConditions.push({ email: auth.email });
        if (auth.phone) matchConditions.push({ phone: auth.phone });
        if (matchConditions.length === 0) return response(true, 200, 'No orders found.', []);
        
        const orders = await OrderModel.find({
            $or: matchConditions,
            deletedAt: null
        })
        .select('order_id payment_id status deliveryStatus totalAmount subtotal discount products trackingNumber courierName createdAt email phone')
        .sort({ createdAt: -1 })
        .lean();

        return response(true, 200, orders.length === 0 ? 'No orders found.' : 'Orders found.', orders);

    } catch (error) {
        return catchError(error);
    }
}
