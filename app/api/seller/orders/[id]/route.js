import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import OrderModel from "@/models/Order.model"
import ProductModel from "@/models/Product.model"
import ProductVariantModel from "@/models/ProductVariant.model"
import mongoose from "mongoose"

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params

        const order = await OrderModel.findOne({
            $or: [
                { order_id: id },
                { _id: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null }
            ].filter(Boolean),
            'products.sellerId': new mongoose.Types.ObjectId(auth.userId),
            deletedAt: null
        }).lean()

        if (!order) return response(false, 404, 'Order not found.')

        const sellerItem = order.products.find(
            item => item.sellerId?.toString() === auth.userId.toString()
        )

        // ✅ Fetch product and variant data
        let productData = null
        let variantData = null

        if (sellerItem?.productId) {
            productData = await ProductModel.findById(sellerItem.productId)
                .select('uniqueCode media base64Media name')
                .lean()
        }

        if (sellerItem?.variantId) {
            variantData = await ProductVariantModel.findById(sellerItem.variantId)
                .select('media size color sku sellingPrice mrp')
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

        return response(true, 200, 'Order found.', {
            _id: order._id,
            orderId: order.order_id,
            productName: sellerItem?.name || productData?.name || 'Product',
            productImage: productImage,
            uniqueCode: productData?.uniqueCode || variantData?.sku || '—',
            size: sellerItem?.size || variantData?.size || null,
            color: sellerItem?.color || variantData?.color || null,
            condition: sellerItem?.condition || null,
            quantity: sellerItem?.qty || 1,
            sellingPrice: variantData?.sellingPrice || sellerItem?.sellingPrice || 0,
            mrp: variantData?.mrp || sellerItem?.mrp || 0,
            unitPrice: variantData?.sellingPrice || sellerItem?.sellingPrice || 0,
            totalAmount: ((variantData?.sellingPrice || sellerItem?.sellingPrice || 0) * (sellerItem?.qty || 1)),
            commission: sellerItem?.commission || 0,
            sellerEarnings: (((variantData?.sellingPrice || sellerItem?.sellingPrice || 0) * (sellerItem?.qty || 1)) - (sellerItem?.commission || 0)),
            subtotal: order.subtotal || ((variantData?.sellingPrice || sellerItem?.sellingPrice || 0) * (sellerItem?.qty || 1)),
            deliveryStatus: order.deliveryStatus || 'pending',
            trackingNumber: order.trackingNumber || null,
            courierName: order.courierName || null,
            trackingHistory: order.trackingHistory || [],
            customerCity: order.city || '—',
            createdAt: order.createdAt
        })

    } catch (error) {
        return catchError(error)
    }
}