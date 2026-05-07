import { isSellerAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import ProductVariantModel from "@/models/ProductVariant.model"
import mongoose from "mongoose"

export async function GET(request) {
    try {
        const auth = await isSellerAuthenticated()
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || (auth.role === 'thrift_seller' ? 'thrift' : 'brand_new')
        const page = parseInt(searchParams.get('page')) || 1
        const limit = parseInt(searchParams.get('limit')) || 20
        const skip = (page - 1) * limit
        const status = searchParams.get('status')

        const filter = auth.role === 'admin' 
            ? { deletedAt: null, productType: type } // Admin sees all products of the type
            : { sellerId: new mongoose.Types.ObjectId(auth.userId), deletedAt: null, productType: type }

        if (status) {
            filter.status = status
        }

       const products = await ProductModel.find(filter)
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .lean()
            .skip(skip)
            .limit(limit)
            .lean()

        // For brand products, also fetch variants
        if (type === 'brand_new') {
            for (let product of products) {
                product.variants = await ProductVariantModel.find({
                    product: product._id,
                    deletedAt: null
                }).lean()
            }
        }

        const total = await ProductModel.countDocuments(filter)
        
        // Calculate stats
        let stats = {
            total,
            active: await ProductModel.countDocuments({ ...filter, status: 'active' }),
            inactive: await ProductModel.countDocuments({ ...filter, status: 'inactive' })
        }

        if (type === 'thrift') {
            stats.soldOut = await ProductModel.countDocuments({ ...filter, status: 'sold_out' })
        } else {
            // For brand products, calculate stock stats
            const variants = await ProductVariantModel.find({
                sellerId: new mongoose.Types.ObjectId(auth.userId),
                deletedAt: null
            }).lean()
            
            stats.outOfStock = variants.filter(v => v.quantity === 0).length
            stats.lowStock = variants.filter(v => v.quantity > 0 && v.quantity <= 5).length
        }

        return response(true, 200, 'Products fetched successfully.', {
            products,
            stats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        // Validate product type matches seller type
        if (auth.role === 'thrift_seller' && payload.productType !== 'thrift') {
            return response(false, 403, 'Thrift sellers can only add thrift items.')
        }
        if (auth.role === 'brand_seller' && payload.productType !== 'brand_new') {
            return response(false, 403, 'Brand sellers can only add brand new items.')
        }

        const product = new ProductModel({
            ...payload,
            sellerId: auth.userId,
            sellerType: auth.role
        })

        await product.save()

        // Update seller's product count
        await mongoose.model('User').updateOne(
            { _id: auth.userId },
            { $inc: { 'sellerProfile.totalProducts': 1 } }
        )

        return response(true, 201, 'Product created successfully.', { 
            productId: product._id,
            uniqueCode: product.uniqueCode 
        })

    } catch (error) {
        return catchError(error)
    }
}