import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductVariantModel from "@/models/ProductVariant.model"
import ProductModel from "@/models/Product.model"
import { uploadImageToCloudinary } from "@/lib/cloudinary"

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['admin', 'brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()

        if (!payload.product) return response(false, 400, 'Product is required.')
        if (!payload.sku || payload.sku.length < 3) return response(false, 400, 'SKU is required (min 3 chars).')
        if (!payload.color) return response(false, 400, 'Color is required.')
        if (!payload.size) return response(false, 400, 'Size is required.')
        if (!payload.sellingPrice || payload.sellingPrice < 1) return response(false, 400, 'Selling price is required.')

        const product = await ProductModel.findById(payload.product)
        if (!product) return response(false, 404, 'Product not found.')

        const existingSku = await ProductVariantModel.findOne({ sku: payload.sku })
        if (existingSku) return response(false, 400, 'This SKU already exists.')

        const mediaUrls = []
        if (payload.media && Array.isArray(payload.media)) {
            for (const mediaItem of payload.media) {
                let imageData = null
                if (typeof mediaItem === 'string') {
                    imageData = mediaItem
                } else if (mediaItem?.secure_url) {
                    imageData = mediaItem.secure_url
                }

                if (!imageData) continue

                if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
                    try {
                        const uploadResult = await uploadImageToCloudinary(imageData, 'thriftyatra/variants')
                        mediaUrls.push(uploadResult.secure_url)
                    } catch (err) {
                        console.error('Cloudinary upload failed:', err)
                    }
                } else if (typeof imageData === 'string') {
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
            status: payload.quantity > 0 ? 'active' : 'out_of_stock'
        })

        await variant.save()
        await ProductModel.updateOne({ _id: product._id }, { hasVariants: true })

        return response(true, 200, 'Product Variant added successfully.', variant)

    } catch (error) {
        if (error.code === 11000) return response(false, 400, 'SKU already exists.')
        return catchError(error)
    }
}

// ✅ DELETE method for variant
export async function DELETE(request) {
    try {
        const auth = await isAuthenticated(['admin', 'brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return response(false, 400, 'Variant ID is required.')

        const variant = await ProductVariantModel.findById(id)
        if (!variant) return response(false, 404, 'Variant not found.')
        
        // Check ownership
        if (auth.role === 'brand_seller' && variant.sellerId.toString() !== auth.userId) {
            return response(false, 403, 'Unauthorized.')
        }

        variant.deletedAt = new Date()
        variant.status = 'inactive'
        await variant.save()

        return response(true, 200, 'Variant deleted successfully.')

    } catch (error) {
        return catchError(error)
    }
}