import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import OrderModel from "@/models/Order.model";
import SellerTransactionModel from "@/models/SellerTransaction.model";
import SellerWalletModel from "@/models/SellerWallet.model";
import { sendMail } from "@/lib/sendMail";

const VALID_STATUSES = [
    'pending_verification', 'awaiting_seller', 'ready_to_ship', 'in_transit',
    'delivered', 'settlement_pending', 'completed', 'cancelled', 'rto_initiated', 'unverified'
];

const STATUS_LABELS = {
    pending_verification: 'Pending Verification',
    awaiting_seller: 'Awaiting Seller',
    ready_to_ship: 'Ready to Ship',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    settlement_pending: 'Settlement Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rto_initiated: 'RTO Initiated',
    unverified: 'Unverified'
};

async function releaseSellerEarnings(orderId) {
    const transactions = await SellerTransactionModel.find({
        orderId,
        type: 'credit',
        status: 'pending'
    });

    for (const transaction of transactions) {
        await SellerWalletModel.updateOne(
            { sellerId: transaction.sellerId },
            {
                $inc: {
                    pendingAmount: -transaction.amount,
                    availableBalance: transaction.amount
                },
                $set: { lastUpdated: new Date() }
            }
        );

        transaction.status = 'completed';
        transaction.description = `${transaction.description || 'Order settlement'} - available`;
        await transaction.save();
    }
}

export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin');
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.');

        await connectDB();
        const { _id, status } = await request.json();

        if (!_id || !status) return response(false, 400, 'Order id and status are required.');
        if (!VALID_STATUSES.includes(status)) return response(false, 400, `Invalid status.`);

        const orderData = await OrderModel.findById(_id);
        if (!orderData) return response(false, 404, 'Order not found.');

        orderData.status = status;
        
        if (status === 'delivered') {
            orderData.deliveryStatus = 'delivered';
            orderData.deliveredAt = new Date();
            // ✅ Send Delivered Email to Customer
            if (orderData.email) {
                try {
                    await sendMail(
                        'Your ThriftYatra Order is Delivered! ✅',
                        orderData.email,
                        `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #E8B931;">ThriftYatra</h2>
                            <h3>Your order has been delivered!</h3>
                            <p>Order: <strong>#${orderData.order_id.slice(-8)}</strong></p>
                            <p>We hope you love your thrift find! ♻️</p>
                            <p style="margin-top: 20px; color: #666; font-size: 12px;">Thank you for choosing ThriftYatra!</p>
                        </div>`
                    );
                    console.log('📧 Delivery email sent to:', orderData.email);
                } catch (e) { console.error('Delivery email failed:', e.message); }
            }
        }

        if (status === 'cancelled') {
            orderData.deliveryStatus = 'cancelled';
            orderData.cancelledAt = new Date();

            // ✅ Send Cancellation Email
            if (orderData.email) {
                try {
                    await sendMail(
                        'Your ThriftYatra Order Has Been Cancelled',
                        orderData.email,
                        `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #E8B931;">ThriftYatra</h2>
                            <h3>Your order #${orderData.order_id.slice(-8)} has been cancelled.</h3>
                            <p>If you have questions, contact us on Instagram @thriftyatra</p>
                        </div>`
                    );
                } catch (e) { console.error('Cancellation email failed:', e.message); }
            }
        }

        if (status === 'settlement_pending' || status === 'completed') {
            await releaseSellerEarnings(orderData._id);
        }

        orderData.trackingHistory.push({
            status: status,
            timestamp: new Date(),
            note: `Status updated to: ${STATUS_LABELS[status] || status}`,
            updatedBy: auth.userId
        });

        await orderData.save();

        return response(true, 200, `Order marked as: ${STATUS_LABELS[status] || status}`, orderData);

    } catch (error) {
        return catchError(error);
    }
}
