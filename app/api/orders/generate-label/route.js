import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import OrderModel from "@/models/Order.model";
import { getShiprocketToken } from "@/lib/shiprocket";

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin');
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.');

        await connectDB();
        const { orderId } = await request.json();

        if (!orderId) return response(false, 400, 'Order ID required.');

        // Find order
        const order = await OrderModel.findById(orderId);
        if (!order) return response(false, 404, 'Order not found.');

        // Get Shiprocket token
        const token = await getShiprocketToken();
        if (!token) return response(false, 500, 'Shiprocket connection failed. Check API keys.');

        // Create shipment
        const shipmentData = {
            order_id: order.order_id,
            order_date: order.createdAt,
            pickup_location: "Primary",
            channel_id: "",
            billing_customer_name: order.name,
            billing_address: order.landmark || order.city,
            billing_city: order.city,
            billing_pincode: order.pincode,
            billing_state: order.state,
            billing_country: "India",
            billing_email: "",
            billing_phone: order.phone,
            shipping_is_billing: true,
            order_items: order.products.map(p => ({
                name: p.name,
                sku: p.uniqueCode || p.productId?.toString()?.slice(-8),
                units: p.qty,
                selling_price: p.sellingPrice,
                discount: 0,
                tax: 0
            })),
            payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
            sub_total: order.subtotal,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5
        };

        // Create order in Shiprocket
        const srResponse = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(shipmentData)
        });

        const srData = await srResponse.json();
        
        if (!srData.order_id && !srData.shipment_id) {
            return response(false, 500, 'Shiprocket order creation failed.', srData);
        }

        const shipmentId = srData.shipment_id || srData.order_id;

        // Generate label
        const labelResponse = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/label', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ shipment_id: [shipmentId] })
        });

        const labelData = await labelResponse.json();

        if (!labelData.label_url && !labelData.response) {
            return response(false, 500, 'Label generation failed.', labelData);
        }

        const labelUrl = labelData.label_url || labelData.response?.label_url;

        // Save to order
        order.labelUrl = labelUrl;
        order.shiprocketOrderId = shipmentId;
        order.labelGenerated = true;
        order.status = 'ready_to_ship';
        order.trackingHistory.push({
            status: 'label_generated',
            timestamp: new Date(),
            note: 'Shipping label generated via Shiprocket'
        });
        await order.save();

        return response(true, 200, 'Label generated!', { 
            labelUrl, 
            shipmentId,
            orderId: order.order_id 
        });

    } catch (error) {
        console.error('Label generation error:', error);
        return catchError(error);
    }
}