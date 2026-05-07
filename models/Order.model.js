import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    order_id: { type: String, required: true, unique: true },
    payment_id: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    country: { type: String, default: 'India' },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
    landmark: { type: String },
    address: { type: String },
    ordernote: { type: String },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
        sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        qty: Number,
        mrp: Number,
        sellingPrice: Number,
        size: String,
        color: String,
        commission: { type: Number, default: 0 },
        sellerAccepted: { type: Boolean, default: false },
        sellerAcceptedAt: Date,
        shippedAt: Date,
        deliveredAt: Date
    }],
    // ✅ Sub-Orders per seller
    subOrders: [{
        sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        storeName: String,
        sellerPhone: String,
        pickupAddress: {
            fullName: String,
            phone: String,
            address: String,
            city: String,
            state: String,
            pincode: String,
            landmark: String
        },
        products: [{
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
            name: String,
            qty: Number,
            mrp: Number,
            sellingPrice: Number,
            size: String,
            color: String,
            commission: Number
        }],
        subtotal: Number,
        commission: Number,
        sellerEarnings: Number,
        deliveryStatus: { type: String, default: 'pending' },
        trackingNumber: String,
        courierName: String,
        labelUrl: String,
        acceptedAt: Date,
        pickedAt: Date,
        shippedAt: Date,
        deliveredAt: Date
    }],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponDiscountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['online', 'cod'], default: 'online' },
    codFee: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 10 },
    status: {
        type: String,
        enum: ['pending_verification', 'awaiting_seller', 'ready_to_ship', 'in_transit', 'delivered', 'settlement_pending', 'completed', 'cancelled', 'rto_initiated', 'unverified'],
        default: 'unverified'
    },
    deliveryStatus: { type: String, enum: ['pending', 'accepted', 'packed', 'shipped', 'in_transit', 'delivered', 'cancelled', 'rto'], default: 'pending' },
    trackingNumber: { type: String },
    courierName: { type: String },
    trackingHistory: [{ status: String, timestamp: { type: Date, default: Date.now }, note: String, updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    returnRequest: { status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'] }, reason: String, description: String, requestedAt: Date, resolvedAt: Date },
    dataExpiryDate: { type: Date },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });

orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deletedAt: 1 });
orderSchema.index({ 'products.sellerId': 1 });
orderSchema.index({ 'subOrders.sellerId': 1 });

const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema, 'orders');
export default OrderModel;
