import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { getAdminWhatsAppLink, getWhatsAppLink, WA_TEMPLATES } from "@/lib/notifications";
import { orderNotification } from "@/email/orderNotification";
import { sendMail } from "@/lib/sendMail";
import CommissionSettingsModel from "@/models/CommissionSettings.model";
import OrderModel from "@/models/Order.model";
import ProductModel from "@/models/Product.model";
import ProductVariantModel from "@/models/ProductVariant.model";
import SellerTransactionModel from "@/models/SellerTransaction.model";
import SellerWalletModel from "@/models/SellerWallet.model";
import SettingsModel from "@/models/Settings.model";
import UserModel from "@/models/User.model";
import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { z } from "zod";

const getRazorpayInstance = () => (
    new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    })
);

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

function verifyRazorpaySignature(orderId, paymentId, signature) {
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret || !orderId || !paymentId || !signature) return false;
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
        if (expectedSignature.length !== signature.length) return false;
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    } catch {
        return false;
    }
}

async function validatePaymentAmount(paymentId, expectedAmount) {
    try {
        const razorpay = getRazorpayInstance();
        const payment = await razorpay.payments.fetch(paymentId);
        const expectedPaise = Math.round(expectedAmount * 100);
        if (payment.amount !== expectedPaise) return { valid: false, message: 'Payment amount does not match the current cart total.' };
        if (!payment.captured) return { valid: false, message: 'Payment was not captured.' };
        return { valid: true };
    } catch {
        return { valid: false, message: 'Payment could not be verified.' };
    }
}

async function isDuplicatePayment(paymentId) {
    if (!paymentId || paymentId.startsWith('COD-')) return false;
    return !!(await OrderModel.findOne({ payment_id: paymentId, status: { $nin: ['cancelled', 'unverified'] } }));
}

async function generateOrderId() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const todayOrders = await OrderModel.countDocuments({ createdAt: { $gte: todayStart, $lt: todayEnd } });
    const sequence = (todayOrders + 1).toString().padStart(3, '0');
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `TY-${day}${month}-${sequence}-${random}`;
}

async function getCODSettings() {
    const setting = await SettingsModel.findOne({ type: 'cod', isActive: true }).lean();
    const data = setting?.data || {};
    return {
        enabled: data.enabled ?? true,
        fee: Number(data.fee ?? 49),
        freeAbove: Number(data.freeAbove ?? 999),
    };
}

async function buildTrustedCart(cartProducts) {
    const trustedProducts = [];

    for (const item of cartProducts) {
        if (!mongoose.Types.ObjectId.isValid(item.productId)) {
            return { error: 'Invalid product in cart.' };
        }

        const qty = Number(item.qty);
        if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
            return { error: 'Invalid product quantity.' };
        }

        const product = await ProductModel.findOne({
            _id: item.productId,
            deletedAt: null,
            status: 'active'
        }).lean();

        if (!product) return { error: 'One or more products are no longer available.' };

        let variant = null;
        let availableQty = Number(product.quantity || 0);
        let mrp = Number(product.mrp || 0);
        let sellingPrice = Number(product.sellingPrice || 0);
        let size = '';
        let color = '';

        if (item.variantId) {
            if (!mongoose.Types.ObjectId.isValid(item.variantId)) {
                return { error: 'Invalid product variant in cart.' };
            }

            variant = await ProductVariantModel.findOne({
                _id: item.variantId,
                product: product._id,
                deletedAt: null,
                status: 'active'
            }).lean();

            if (!variant) return { error: `${product.name} option is no longer available.` };

            availableQty = Number(variant.quantity || 0);
            mrp = Number(variant.mrp || 0);
            sellingPrice = Number(variant.sellingPrice || 0);
            size = variant.size || '';
            color = variant.color || '';
        } else if (product.hasVariants) {
            return { error: `Please choose a valid size/color for ${product.name}.` };
        }

        if (product.productType === 'thrift' && qty !== 1) {
            return { error: `${product.name} is a unique thrift item and can only be bought once.` };
        }

        if (availableQty < qty) {
            return { error: `${product.name} does not have enough stock.` };
        }

        trustedProducts.push({
            productId: product._id,
            variantId: variant?._id || null,
            sellerId: product.sellerId,
            name: product.name,
            qty,
            mrp,
            sellingPrice,
            size,
            color,
            productType: product.productType,
            uniqueCode: product.uniqueCode || '',
        });
    }

    const subtotal = roundMoney(trustedProducts.reduce((sum, item) => sum + item.sellingPrice * item.qty, 0));
    const discount = roundMoney(trustedProducts.reduce((sum, item) => {
        const lineDiscount = Math.max(item.mrp - item.sellingPrice, 0) * item.qty;
        return sum + lineDiscount;
    }, 0));

    return { trustedProducts, subtotal, discount };
}

async function decrementStock(trustedProducts) {
    const decremented = [];

    for (const item of trustedProducts) {
        const result = item.variantId
            ? await ProductVariantModel.updateOne(
                { _id: item.variantId, quantity: { $gte: item.qty } },
                { $inc: { quantity: -item.qty } }
            )
            : await ProductModel.updateOne(
                { _id: item.productId, quantity: { $gte: item.qty } },
                { $inc: { quantity: -item.qty } }
            );

        if (result.modifiedCount !== 1) {
            for (const previous of decremented) {
                if (previous.variantId) {
                    await ProductVariantModel.updateOne({ _id: previous.variantId }, { $inc: { quantity: previous.qty } });
                } else {
                    await ProductModel.updateOne({ _id: previous.productId }, { $inc: { quantity: previous.qty } });
                }
            }
            return { success: false, message: `${item.name} just went out of stock. Please refresh your cart.` };
        }

        decremented.push(item);
    }

    return { success: true, decremented };
}

async function rollbackStock(items) {
    for (const item of items) {
        if (item.variantId) {
            await ProductVariantModel.updateOne({ _id: item.variantId }, { $inc: { quantity: item.qty } });
        } else {
            await ProductModel.updateOne({ _id: item.productId }, { $inc: { quantity: item.qty } });
        }
    }
}

export async function POST(request) {
    let stockRollbackItems = [];
    try {
        const auth = await isAuthenticated(['user', 'admin']);
        if (!auth.isAuth) return response(false, 403, 'Please login before placing an order.');

        await connectDB();
        const payload = await request.json();

        const productSchema = z.object({
            productId: z.string().min(1),
            variantId: z.string().nullable().optional(),
            qty: z.coerce.number().int().min(1).max(50),
        });

        const orderSchema = z.object({
            name: z.string().min(1),
            phone: z.string().min(10),
            altPhone: z.string().optional().default(''),
            country: z.string().optional().default('India'),
            state: z.string().min(1),
            city: z.string().min(1),
            pincode: z.string().min(1),
            landmark: z.string().min(1),
            address: z.string().min(5),
            ordernote: z.string().optional().default(''),
            email: z.string().optional().default(''),
            subtotal: z.coerce.number().nonnegative(),
            discount: z.coerce.number().nonnegative(),
            couponDiscountAmount: z.coerce.number().nonnegative().default(0),
            totalAmount: z.coerce.number().nonnegative(),
            paymentMethod: z.enum(['online', 'cod']).default('online'),
            codFee: z.coerce.number().optional().default(0),
            products: z.array(productSchema).min(1),
            razorpay_payment_id: z.string().optional(),
            razorpay_order_id: z.string().optional(),
            razorpay_signature: z.string().optional(),
        });

        const vr = orderSchema.safeParse(payload);
        if (!vr.success) return response(false, 400, 'Invalid fields.', vr.error.flatten());

        const data = vr.data;
        const trustedCart = await buildTrustedCart(data.products);
        if (trustedCart.error) return response(false, 400, trustedCart.error);

        const { trustedProducts, subtotal, discount } = trustedCart;
        const codSettings = await getCODSettings();
        const actualCodFee = data.paymentMethod === 'cod' && subtotal < codSettings.freeAbove ? codSettings.fee : 0;
        const totalAmount = roundMoney(subtotal + actualCodFee);

        if (data.paymentMethod === 'cod' && !codSettings.enabled) {
            return response(false, 400, 'Cash on delivery is not available right now.');
        }

        if (Math.abs(Number(data.totalAmount) - totalAmount) > 0.01) {
            return response(false, 409, 'Cart total changed. Please refresh checkout and try again.');
        }

        if (data.paymentMethod === 'online') {
            if (!data.razorpay_payment_id || !data.razorpay_order_id || !data.razorpay_signature) {
                return response(false, 400, 'Payment details are required.');
            }
            if (await isDuplicatePayment(data.razorpay_payment_id)) return response(false, 400, 'Duplicate payment.');

            const sigOk = verifyRazorpaySignature(data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature);
            if (!sigOk) return response(false, 400, 'Payment signature verification failed.');

            const amountCheck = await validatePaymentAmount(data.razorpay_payment_id, totalAmount);
            if (!amountCheck.valid) return response(false, 400, amountCheck.message);
        }

        const stockResult = await decrementStock(trustedProducts);
        if (!stockResult.success) return response(false, 409, stockResult.message);
        stockRollbackItems = stockResult.decremented;

        let commissionRate = 10;
        try {
            const cs = await CommissionSettingsModel.findOne({ isActive: true });
            if (cs) commissionRate = cs.rate || 10;
        } catch {}

        const orderId = await generateOrderId();
        const paymentId = data.razorpay_payment_id || `COD-${orderId}-${Date.now()}`;

        const sellerIds = [...new Set(trustedProducts.map((p) => p.sellerId?.toString()).filter(Boolean))];
        const sellers = sellerIds.length ? await UserModel.find({ _id: { $in: sellerIds } }).lean() : [];
        const sellerMap = new Map(sellers.map((seller) => [seller._id.toString(), seller]));

        const groupedSubOrders = new Map();
        for (const p of trustedProducts) {
            if (!p.sellerId) continue;
            const sellerKey = p.sellerId.toString();
            const seller = sellerMap.get(sellerKey);
            const lineTotal = p.sellingPrice * p.qty;
            const lineCommission = Math.round(lineTotal * commissionRate / 100);

            const existing = groupedSubOrders.get(sellerKey) ?? {
                sellerId: p.sellerId,
                storeName: seller?.sellerProfile?.storeName || seller?.name || 'Seller',
                sellerPhone: seller?.sellerProfile?.phone || seller?.phone || '',
                sellerWhatsApp: seller?.sellerProfile?.whatsapp || seller?.sellerProfile?.phone || seller?.phone || '',
                pickupAddress: seller?.pickupAddress || {},
                products: [],
                subtotal: 0,
                commission: 0,
                sellerEarnings: 0,
            };

            existing.products.push({
                productId: p.productId,
                variantId: p.variantId || null,
                name: p.name,
                qty: p.qty,
                mrp: p.mrp,
                sellingPrice: p.sellingPrice,
                size: p.size,
                color: p.color,
                commission: lineCommission,
            });
            existing.subtotal += lineTotal;
            existing.commission += lineCommission;
            existing.sellerEarnings += lineTotal - lineCommission;
            groupedSubOrders.set(sellerKey, existing);
        }

        const subOrders = Array.from(groupedSubOrders.values()).map((group) => ({
            sellerId: group.sellerId,
            storeName: group.storeName,
            sellerPhone: group.sellerPhone,
            pickupAddress: group.pickupAddress,
            products: group.products,
            subtotal: group.subtotal,
            commission: group.commission,
            sellerEarnings: group.sellerEarnings,
            deliveryStatus: 'pending',
        }));

        const newOrder = await OrderModel.create({
            userId: auth.userId,
            name: data.name,
            email: data.email || auth.email || '',
            phone: data.phone,
            altPhone: data.altPhone || '',
            country: 'India',
            state: data.state,
            city: data.city,
            pincode: data.pincode,
            landmark: data.landmark,
            address: data.address,
            ordernote: data.ordernote || '',
            products: trustedProducts.map(p => ({
                productId: p.productId,
                variantId: p.variantId || null,
                sellerId: p.sellerId || null,
                name: p.name,
                qty: p.qty,
                mrp: p.mrp,
                sellingPrice: p.sellingPrice,
                size: p.size,
                color: p.color,
                commission: Math.round(p.sellingPrice * p.qty * commissionRate / 100)
            })),
            subOrders,
            discount,
            couponDiscountAmount: 0,
            totalAmount,
            subtotal,
            payment_id: paymentId,
            order_id: orderId,
            status: 'awaiting_seller',
            deliveryStatus: 'pending',
            paymentMethod: data.paymentMethod,
            codFee: actualCodFee,
            commissionRate,
        });
        stockRollbackItems = [];

        for (const group of groupedSubOrders.values()) {
            if (!group.sellerId) continue;

            try {
                await SellerWalletModel.findOneAndUpdate(
                    { sellerId: group.sellerId },
                    {
                        $inc: { totalEarned: group.sellerEarnings, pendingAmount: group.sellerEarnings },
                        $set: { lastUpdated: new Date() },
                        $setOnInsert: { availableBalance: 0, withdrawnAmount: 0 }
                    },
                    { new: true, upsert: true }
                );

                await SellerTransactionModel.create({
                    sellerId: group.sellerId,
                    orderId: newOrder._id,
                    type: 'credit',
                    amount: group.sellerEarnings,
                    description: `Order ${orderId} settlement pending`,
                    status: 'pending',
                    payoutReference: String(newOrder._id)
                });
            } catch (walletError) {
                console.error('Seller wallet update failed:', walletError.message || walletError);
            }
        }

        const orderDetailsUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://thriftyatra.com'}/order-details/${orderId}`;
        const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@thriftyatra.com';
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://thriftyatra.com'}/admin/orders`;
        const adminMessage = `New ThriftYatra order placed: ${orderId}\nCustomer: ${data.name}\nAmount: INR ${totalAmount}\nReview in admin panel.`;
        const adminWhatsAppLink = getAdminWhatsAppLink(adminMessage);

        if (data.email) {
            try {
                await sendMail(
                    'Your ThriftYatra Order is Confirmed!',
                    data.email,
                    orderNotification({ order_id: orderId, orderDetailsUrl })
                );
            } catch (e) {
                console.error('Customer order confirmation email failed:', e.message || e);
            }
        }

        const sellerNotifications = [];
        for (const group of groupedSubOrders.values()) {
            const seller = sellerMap.get(group.sellerId.toString());
            const sellerEmail = seller?.email || null;
            const sellerWALink = group.sellerWhatsApp
                ? getWhatsAppLink(
                    group.sellerWhatsApp,
                    WA_TEMPLATES.notifySeller(
                        orderId.slice(-8),
                        group.products[0]?.name || 'product',
                        group.products[0]?.size || '',
                        group.products[0]?.color || '',
                        group.subtotal
                    )
                )
                : null;

            if (sellerEmail) {
                try {
                    await sendMail(
                        `New ThriftYatra Order Received: ${orderId}`,
                        sellerEmail,
                        `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #E8B931;">ThriftYatra Seller Alert</h2>
                            <h3>You have a new order: ${escapeHtml(orderId)}</h3>
                            <p><strong>Store:</strong> ${escapeHtml(group.storeName)}</p>
                            <p><strong>Customer:</strong> ${escapeHtml(data.name)}</p>
                            <p><strong>Amount:</strong> INR ${group.subtotal.toLocaleString('en-IN')}</p>
                            <p><strong>Products:</strong></p>
                            <ul style="padding-left: 16px;">
                                ${group.products
                                    .map((item) => `<li>${escapeHtml(item.name)} x${item.qty} - INR ${item.sellingPrice.toLocaleString('en-IN')} ${item.size ? `| Size: ${escapeHtml(item.size)}` : ''} ${item.color ? `| Color: ${escapeHtml(item.color)}` : ''}</li>`)
                                    .join('')}
                            </ul>
                            <p>Respond quickly to ensure timely delivery.</p>
                            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://thriftyatra.com'}/seller/orders" style="display: inline-block; background: #E8B931; color: #000; padding: 10px 25px; text-decoration: none; border-radius: 25px; margin-top: 10px;">View Seller Orders</a>
                        </div>`
                    );
                } catch (e) {
                    console.error('Seller notification email failed for seller:', sellerEmail, e.message || e);
                }
            }

            sellerNotifications.push({
                sellerId: group.sellerId,
                sellerEmail,
                sellerWhatsAppLink: sellerWALink,
            });
        }

        if (adminEmail) {
            try {
                await sendMail(
                    `New ThriftYatra Order: ${orderId}`,
                    adminEmail,
                    `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #E8B931;">Admin Alert</h2>
                        <h3>New order received: ${escapeHtml(orderId)}</h3>
                        <p><strong>Customer:</strong> ${escapeHtml(data.name)}</p>
                        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
                        <p><strong>Total:</strong> INR ${totalAmount.toLocaleString('en-IN')}</p>
                        <p><strong>Sellers:</strong> ${subOrders.length}</p>
                        <a href="${adminUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 25px; text-decoration: none; border-radius: 25px; margin-top: 10px;">View Admin Orders</a>
                    </div>`
                );
            } catch (e) {
                console.error('Admin notification email failed:', e.message || e);
            }
        }

        return response(true, 200, 'Order placed successfully.', {
            orderId: newOrder.order_id,
            status: newOrder.status,
            paymentVerified: true,
            adminWhatsAppLink,
            sellerNotifications,
        });
    } catch (error) {
        if (stockRollbackItems.length > 0) {
            await rollbackStock(stockRollbackItems).catch((rollbackError) => {
                console.error('Stock rollback failed:', rollbackError.message || rollbackError);
            });
        }
        console.error('Save order error:', error);
        if (error.code === 11000) return response(false, 400, 'Duplicate order.');
        return catchError(error);
    }
}
