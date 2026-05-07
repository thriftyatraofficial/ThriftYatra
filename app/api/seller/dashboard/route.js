import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import OrderModel from "@/models/Order.model";
import ProductModel from "@/models/Product.model";
import ProductVariantModel from "@/models/ProductVariant.model";
import UserModel from "@/models/User.model";
import mongoose from "mongoose";

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller']);
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.');
        }

        await connectDB();
        
        const { searchParams } = new URL(request.url);
        const requestedType = searchParams.get('type');
        
        // ✅ Use the requested type OR default to seller's role type
        const productType = requestedType || (auth.role === 'thrift_seller' ? 'thrift' : 'brand_new');

        const sellerId = auth.userId;

        // Get stats
        const totalProducts = await ProductModel.countDocuments({ 
            sellerId: new mongoose.Types.ObjectId(sellerId),
            deletedAt: null,
            productType: productType,
            status: 'active'
        });

        // Get orders for this seller's products
        const sellerOrders = await OrderModel.find({ 
            'products.sellerId': new mongoose.Types.ObjectId(sellerId),
            deletedAt: null
        }).lean();

        const totalOrders = sellerOrders.length;
        const totalSales = sellerOrders.reduce((sum, order) => {
            const sellerItems = order.products.filter(
                item => item.sellerId.toString() === sellerId.toString()
            );
            return sum + sellerItems.reduce((itemSum, item) => 
                itemSum + (item.sellingPrice * item.qty), 0
            );
        }, 0);

        // Get seller rating
        const seller = await UserModel.findById(sellerId).select('sellerProfile.rating');
        const rating = seller?.sellerProfile?.rating || 0;

        // Get recent orders
        const recentOrders = sellerOrders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(order => {
                const sellerItem = order.products.find(
                    item => item.sellerId.toString() === sellerId.toString()
                );
                return {
                    orderId: order.order_id,
                    productName: sellerItem?.name || 'Product',
                    amount: (sellerItem?.sellingPrice || 0) * (sellerItem?.qty || 1),
                    status: order.deliveryStatus || order.status,
                    condition: sellerItem?.condition || null,
                    size: sellerItem?.size || null,
                    quantity: sellerItem?.qty || 1
                };
            });

        const stats = { 
            totalProducts, 
            totalOrders, 
            totalSales, 
            rating 
        };

        // For brand sellers, also get low stock items
        let lowStockProducts = [];
        if (productType === 'brand_new') {
            const variants = await ProductVariantModel.find({ 
                sellerId: new mongoose.Types.ObjectId(sellerId),
                deletedAt: null,
                quantity: { $lt: 5, $gt: 0 }
            })
            .populate('product', 'name')
            .limit(5)
            .lean();

            lowStockProducts = variants.map(v => ({
                name: v.product?.name || 'Product',
                size: v.size,
                color: v.color,
                quantity: v.quantity
            }));

            stats.lowStockItems = await ProductVariantModel.countDocuments({
                sellerId: new mongoose.Types.ObjectId(sellerId),
                deletedAt: null,
                quantity: { $lt: 5 }
            });
        }

        return response(true, 200, 'Dashboard data fetched.', {
            stats,
            recentOrders,
            lowStockProducts
        });

    } catch (error) {
        console.error('Dashboard API error:', error);
        return catchError(error);
    }
}