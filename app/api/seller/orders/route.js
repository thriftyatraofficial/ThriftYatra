import { isSellerAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import OrderModel from "@/models/Order.model"
import ProductModel from "@/models/Product.model"
import ProductVariantModel from "@/models/ProductVariant.model"
import mongoose from "mongoose"

export async function GET(request) {
    try {
        const auth = await isSellerAuthenticated()
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        
        const filter = auth.role === 'admin' 
            ? { deletedAt: null } // Admin sees all orders
            : { 'products.sellerId': new mongoose.Types.ObjectId(auth.userId), deletedAt: null }

        const orders = await OrderModel.find(filter)
            .sort({ createdAt: -1 })
            .lean()

        const formattedOrders = []
        for (const order of orders) {
            const sellerItem = order.products.find(
                item => item.sellerId?.toString() === auth.userId.toString()
            )
            
            if (!sellerItem) continue

            // ✅ Fetch product data
            let productData = null
            let variantData = null
            
            if (sellerItem.productId) {
                productData = await ProductModel.findById(sellerItem.productId)
                    .select('uniqueCode media base64Media name')
                    .lean()
            }

            // ✅ Fetch variant data for brand products
            if (sellerItem.variantId) {
                variantData = await ProductVariantModel.findById(sellerItem.variantId)
                    .select('media size color sku')
                    .lean()
            }

            // ✅ Get image: variant first, then product
            let productImage = null
            if (variantData?.media?.length > 0) {
                const vm = variantData.media[0]
                productImage = typeof vm === 'string' ? vm : (vm?.secure_url || null)
            }
            if (!productImage && productData?.media?.length > 0) {
                productImage = productData.media[0]
            }
            if (!productImage && productData?.base64Media?.length > 0) {
                productImage = productData.base64Media[0]?.secure_url || null
            }

            formattedOrders.push({
                _id: order._id,
                orderId: order.order_id,
                productName: sellerItem?.name || productData?.name || 'Product',
                productImage: productImage,
                uniqueCode: productData?.uniqueCode || variantData?.sku || '—',
                size: sellerItem?.size || variantData?.size || null,
                color: sellerItem?.color || variantData?.color || null,
                condition: sellerItem?.condition || null,
                quantity: sellerItem?.qty || 1,
                sellingPrice: sellerItem?.sellingPrice || 0,
                mrp: sellerItem?.mrp || 0,
                unitPrice: sellerItem?.sellingPrice || 0,
                totalAmount: (sellerItem?.sellingPrice || 0) * (sellerItem?.qty || 1),
                commission: sellerItem?.commission || 0,
                deliveryStatus: order.deliveryStatus || 'pending',
                trackingNumber: order.trackingNumber || null,
                courierName: order.courierName || null,
                createdAt: order.createdAt
            })
        }

        const stats = {
            total: formattedOrders.length,
            pending: formattedOrders.filter(o => o.deliveryStatus === 'pending' || o.deliveryStatus === 'packed').length,
            shipped: formattedOrders.filter(o => o.deliveryStatus === 'shipped').length,
            delivered: formattedOrders.filter(o => o.deliveryStatus === 'delivered').length
        }

        return response(true, 200, 'Orders fetched.', { orders: formattedOrders, stats })

    } catch (error) {
        console.error('Seller orders error:', error)
        return catchError(error)
    }
}