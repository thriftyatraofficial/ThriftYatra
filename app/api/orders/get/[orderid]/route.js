import { connectDB } from "@/lib/databaseConnection";
import { isAuthenticated } from "@/lib/authentication";
import { canAccessOrder } from "@/lib/orderAccess";
import { catchError, response } from "@/lib/helperFunction";
import OrderModel from "@/models/Order.model";
import ProductModel from "@/models/Product.model";
import ProductVariantModel from "@/models/ProductVariant.model";
import UserModel from "@/models/User.model";

export async function GET(request, { params }) {
    try {
        await connectDB()
        const getParams = await params
        const orderid = getParams.orderid

        if (!orderid) return response(false, 404, 'Order not found.')

        const orderData = await OrderModel.findOne({ order_id: orderid, deletedAt: null }).lean()
        if (!orderData) return response(false, 404, 'Order not found.')

        const auth = await isAuthenticated(['user', 'admin'])
        const phone = request.nextUrl.searchParams.get('phone')
        if (!canAccessOrder(orderData, auth, phone)) {
            return response(false, 403, 'Unauthorized.')
        }

        // Enrich product details with seller info
        const enrichedProducts = []
        for (const product of orderData.products) {
            let productDetails = null, variantDetails = null, sellerDetails = null

            if (product.productId) {
                productDetails = await ProductModel.findById(product.productId)
                    .select('name slug uniqueCode media base64Media')
                    .lean()
            }
            if (product.variantId) {
                variantDetails = await ProductVariantModel.findById(product.variantId)
                    .select('size color media sellingPrice mrp')
                    .lean()
            }
            // ✅ Fetch seller with pickupAddress
            if (product.sellerId) {
                sellerDetails = await UserModel.findById(product.sellerId)
                    .select('name phone sellerProfile.storeName sellerProfile.phone sellerProfile.storeLogo sellerId pickupAddress')
                    .lean()
            }

            enrichedProducts.push({
                ...product,
                productId: productDetails || product.productId,
                variantId: variantDetails || product.variantId,
                sellerId: sellerDetails || product.sellerId
            })
        }

        return response(true, 200, 'Order found.', {
            ...orderData,
            products: enrichedProducts
        })

    } catch (error) {
        return catchError(error)
    }
}
