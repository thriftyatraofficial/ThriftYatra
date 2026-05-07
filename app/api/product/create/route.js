import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import slugify from "slugify"
import mongoose from "mongoose"
import { uploadImageToCloudinary } from "@/lib/cloudinary"

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['admin', 'thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        // Generate unique slug
        let baseSlug = slugify(payload.name, { lower: true, strict: true })
        let slug = baseSlug
        let counter = 1
        
        while (await ProductModel.exists({ slug })) {
            slug = `${baseSlug}-${counter}`
            counter++
        }

        // Auto-generate uniqueCode if not provided
        if (!payload.uniqueCode) {
            const prefix = payload.productType === 'thrift' ? 'TH' : 'BN'
            const timestamp = Date.now().toString().slice(-6)
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
            payload.uniqueCode = `${prefix}${timestamp}${random}`
        }

        const mediaUrls = []
        if (payload.media && Array.isArray(payload.media)) {
            for (const item of payload.media) {
                let imageData = null
                if (typeof item === 'string') {
                    imageData = item
                } else if (item?.secure_url) {
                    imageData = item.secure_url
                }

                if (!imageData) continue

                if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
                    try {
                        const uploadResult = await uploadImageToCloudinary(imageData, 'thriftyatra/products')
                        mediaUrls.push(uploadResult.secure_url)
                    } catch (err) {
                        console.error('Cloudinary upload failed:', err)
                    }
                } else if (typeof imageData === 'string') {
                    mediaUrls.push(imageData)
                }
            }
        }

        const product = new ProductModel({
            name: payload.name,
            slug: slug,
            category: payload.category,
            productType: payload.productType,
            sellerId: auth.userId,
            sellerType: auth.role,
            uniqueCode: payload.uniqueCode,
            condition: payload.condition || null,
            isUnique: payload.isUnique || false,
            quantity: payload.quantity || 1,
            hasVariants: payload.hasVariants || false,
            mrp: payload.mrp || payload.sellingPrice,
            sellingPrice: payload.sellingPrice,
            discountPercentage: payload.discountPercentage || 0,
            media: mediaUrls,
            base64Media: [],
            sizeChart: payload.sizeChart || null,
            description: payload.description,
            status: 'active'
        })

        await product.save()

        // Update seller's product count
        if (auth.role === 'thrift_seller' || auth.role === 'brand_seller') {
            await mongoose.model('User').updateOne(
                { _id: auth.userId },
                { $inc: { 'sellerProfile.totalProducts': 1 } }
            )
        }

        return response(true, 201, 'Product created successfully.', { 
            productId: product._id,
            uniqueCode: product.uniqueCode,
            slug: product.slug
        })

    } catch (error) {
        console.error('Product creation error:', error)
        
        if (error.code === 11000) {
            return response(false, 400, 'A product with this name or SKU already exists.')
        }
        
        return catchError(error)
    }
}