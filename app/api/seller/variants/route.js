import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductVariantModel from "@/models/ProductVariant.model"
import ProductModel from "@/models/Product.model"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import mongoose from "mongoose"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['brand_seller', 'admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        const filter = { sellerId: auth.userId, deletedAt: null }
        if (productId) filter.product = new mongoose.Types.ObjectId(productId)

        const variants = await ProductVariantModel.find(filter)
            .populate('product', 'name uniqueCode')
            .sort({ createdAt: -1 })
            .lean()

        return response(true, 200, 'Variants fetched.', variants)

    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['brand_seller', 'admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()

        if (!payload.product) return response(false, 400, 'Product is required.')
        if (!payload.sku || payload.sku.length < 3) return response(false, 400, 'SKU is required.')
        if (!payload.color) return response(false, 400, 'Color is required.')
        if (!payload.size) return response(false, 400, 'Size is required.')
        if (!payload.sellingPrice) return response(false, 400, 'Selling price is required.')

        const existingSku = await ProductVariantModel.findOne({ sku: payload.sku })
        if (existingSku) return response(false, 400, 'This SKU already exists.')

        const mediaUrls = []
        if (payload.media && Array.isArray(payload.media)) {
            for (const mediaItem of payload.media) {
                let imageData = null
                if (typeof mediaItem === 'string') imageData = mediaItem
                else if (mediaItem?.secure_url) imageData = mediaItem.secure_url

                if (!imageData) continue

                if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
                    try {
                        const uploadResult = await uploadImageToCloudinary(imageData, 'thriftyatra/variants')
                        mediaUrls.push(uploadResult.secure_url)
                    } catch (err) {
                        console.error('Image upload error:', err)
                    }
                } else {
                    mediaUrls.push(imageData)
                }
            }
        }

        const variant = new ProductVariantModel({
            product: payload.product,
            sellerId: auth.userId,
            color: payload.color,
            size: payload.size,
            mrp: payload.mrp || payload.sellingPrice,
            sellingPrice: payload.sellingPrice,
            discountPercentage: payload.discountPercentage || 0,
            sku: payload.sku,
            quantity: payload.quantity || 0,
            media: mediaUrls,
            status: (payload.quantity || 0) > 0 ? 'active' : 'out_of_stock'
        })

        await variant.save()
        await ProductModel.updateOne({ _id: payload.product }, { hasVariants: true })

        return response(true, 200, 'Variant added successfully.', variant)

    } catch (error) {
        if (error.code === 11000) return response(false, 400, 'SKU already exists.')
        return catchError(error)
    }
}