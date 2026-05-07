import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    type: {
        type: String,
        enum: [
            'otp', 
            'order_confirmed', 
            'order_confirmed_seller',
            'order_shipped', 
            'order_delivered', 
            'order_cancelled', 
            'return_requested', 
            'return_approved',
            'payout_processed',
            'seller_approved',
            'seller_rejected'
        ],
        required: true
    },
    recipient: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    templateName: {
        type: String,
        required: false
    },
    variables: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'delivered', 'read'],
        default: 'pending'
    },
    provider: {
        type: String,
        default: 'whatsapp'
    },
    providerResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    relatedOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: false
    },
    retryCount: {
        type: Number,
        default: 0
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

notificationSchema.index({ userId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ relatedOrder: 1 });
notificationSchema.index({ deletedAt: 1 });

const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', notificationSchema, 'notifications');
export default NotificationModel;