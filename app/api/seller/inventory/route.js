import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductVariantModel from "@/models/ProductVariant.model"
import mongoose from "mongoose"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        const variants = await ProductVariantModel.find({ sellerId: new mongoose.Types.ObjectId(auth.userId), deletedAt: null }).populate('product', 'name media').populate('media', 'secure_url').sort({ 'product.name': 1 }).lean()
        const formatted = variants.map(v => ({ _id: v._id, productName: v.product?.name, image: v.media[0]?.secure_url || v.product?.media?.[0]?.secure_url, sku: v.sku, size: v.size, color: v.color, sellingPrice: v.sellingPrice, quantity: v.quantity }))
        return response(true, 200, 'Inventory fetched.', formatted)
    } catch (error) { return catchError(error) }
}