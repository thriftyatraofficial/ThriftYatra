import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import NotificationModel from "@/models/Notification.model";

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['admin']);
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.');

        await connectDB();
        const payload = await request.json();
        const { recipient, type, variables, userId, relatedOrder } = payload;

        if (!recipient || !type) {
            return response(false, 400, 'Recipient and type are required');
        }

        const templateName = getTemplateName(type);
        if (!templateName) {
            return response(false, 400, `Invalid notification type: ${type}`);
        }

        const result = await sendWhatsAppTemplate(recipient, templateName, variables);

        const notification = new NotificationModel({
            userId: userId || null,
            type,
            recipient: String(recipient).replace(/[^0-9]/g, ''),
            message: JSON.stringify(variables || {}),
            templateName,
            variables: variables || {},
            status: result.success ? 'sent' : 'failed',
            provider: 'whatsapp',
            providerResponse: result.result || null,
            relatedOrder: relatedOrder || null
        });
        await notification.save();

        if (!result.success) {
            return response(false, 500, result.message || 'Failed to send WhatsApp message.');
        }

        return response(true, 200, 'Notification sent successfully', notification);
    } catch (error) {
        console.error('Notification error:', error);
        return catchError(error);
    }
}

function getTemplateName(type) {
    const templates = {
        otp: 'otp_verification',
        order_confirmed: 'order_confirmed',
        order_confirmed_seller: 'order_confirmed_seller',
        order_shipped: 'order_shipped',
        order_delivered: 'order_delivered',
        order_cancelled: 'order_cancelled',
        return_requested: 'return_requested',
        return_approved: 'return_approved',
        payout_processed: 'payout_processed',
        seller_approved: 'seller_approved',
        seller_rejected: 'seller_rejected'
    };
    return templates[type] || null;
}
