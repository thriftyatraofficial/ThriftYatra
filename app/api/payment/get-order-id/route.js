import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import Razorpay from "razorpay";

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['user', 'admin']);
        if (!auth.isAuth) return response(false, 403, 'Please login before starting payment.');

        await connectDB();
        const payload = await request.json();
        const amount = Number(payload.amount);

        if (!amount || amount <= 0 || amount > 1000000) {
            return response(false, 400, 'Valid amount is required.');
        }

        if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return response(false, 500, 'Payment gateway is not configured.');
        }

        const razInstance = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const orderDetail = await razInstance.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            payment_capture: 1
        });

        return response(true, 200, 'Order ID generated.', orderDetail.id);
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        return catchError(error);
    }
}
