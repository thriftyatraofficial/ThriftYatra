import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { canAccessOrder } from "@/lib/orderAccess";
import OrderModel from "@/models/Order.model";
import ProductModel from "@/models/Product.model";
import ProductVariantModel from "@/models/ProductVariant.model";
import SellerTransactionModel from "@/models/SellerTransaction.model";
import SellerWalletModel from "@/models/SellerWallet.model";

async function restoreOrderStock(order) {
    for (const item of order.products || []) {
        if (item.variantId) {
            await ProductVariantModel.updateOne({ _id: item.variantId }, { $inc: { quantity: item.qty || 1 } });
        } else if (item.productId) {
            await ProductModel.updateOne({ _id: item.productId }, { $inc: { quantity: item.qty || 1 } });
        }
    }
}

async function reversePendingSellerCredits(order) {
    const credits = await SellerTransactionModel.find({
        orderId: order._id,
        type: 'credit',
        status: 'pending'
    });

    for (const credit of credits) {
        await SellerWalletModel.updateOne(
            { sellerId: credit.sellerId },
            {
                $inc: {
                    totalEarned: -credit.amount,
                    pendingAmount: -credit.amount
                },
                $set: { lastUpdated: new Date() }
            }
        );

        credit.status = 'failed';
        credit.description = `${credit.description || 'Order settlement'} - cancelled`;
        await credit.save();
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['user', 'admin']);
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.');
        }
        
        await connectDB();
        const payload = await request.json();
        const { orderId, reason } = payload;
        
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
        
        // Check if order can be cancelled (only before shipping)
        if (!['pending_verification', 'awaiting_seller', 'unverified'].includes(order.status)) {
            return response(false, 400, 'Order cannot be cancelled. It has already been shipped or delivered.');
        }
        
        // Update order
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason || 'Customer requested cancellation';
        
        await restoreOrderStock(order);
        await reversePendingSellerCredits(order);
        await order.save();
        
        // Send WhatsApp notification
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/notifications/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: order.phone,
                    type: 'order_cancelled',
                    variables: { orderId: order.order_id },
                    relatedOrder: order._id
                })
            });
        } catch (notifError) {
            console.error('Failed to send cancellation notification:', notifError);
        }
        
        return response(true, 200, 'Order cancelled successfully', order);
        
    } catch (error) {
        console.error('Cancel order error:', error);
        return catchError(error);
    }
}
