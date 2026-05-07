import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import ProductVariantModel from "@/models/ProductVariant.model"
import mongoose from "mongoose"

// GET - Get single product
export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller', 'admin'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const { id } = await params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response(false, 400, 'Invalid product ID.')
        }

        const filter = {
            _id: new mongoose.Types.ObjectId(id),
            deletedAt: null
        }

        // If not admin, only show own products
        if (auth.role !== 'admin') {
            filter.sellerId = new mongoose.Types.ObjectId(auth.userId)
        }

        const product = await ProductModel.findOne(filter)
            .populate('media', 'secure_url alt')
            .populate('category', 'name')
            .lean()

        if (!product) {
            return response(false, 404, 'Product not found.')
        }

        // Get variants for brand products
        if (product.productType === 'brand_new') {
            product.variants = await ProductVariantModel.find({
                product: product._id,
                deletedAt: null
            }).populate('media', 'secure_url').lean()
        }

        return response(true, 200, 'Product found.', { product })

    } catch (error) {
        return catchError(error)
    }
}

// PUT - Update product
export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller', 'admin'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const { id } = await params
        const payload = await request.json()

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response(false, 400, 'Invalid product ID.')
        }

        const filter = {
            _id: new mongoose.Types.ObjectId(id),
            deletedAt: null
        }

        // If not admin, only update own products
        if (auth.role !== 'admin') {
            filter.sellerId = new mongoose.Types.ObjectId(auth.userId)
        }

        const product = await ProductModel.findOne(filter)
        if (!product) {
            return response(false, 404, 'Product not found.')
        }

        // Prevent thrift sellers from updating to brand_new type
        if (auth.role === 'thrift_seller' && payload.productType === 'brand_new') {
            return response(false, 403, 'Thrift sellers cannot change product type to brand new.')
        }

        // Update fields
        const updatableFields = [
            'name', 'slug', 'category', 'mrp', 'sellingPrice',
            'discountPercentage', 'description', 'media', 'status',
            'condition', 'quantity'
        ]

        updatableFields.forEach(field => {
            if (payload[field] !== undefined) {
                product[field] = payload[field]
            }
        })

        // Recalculate discount
        if (payload.mrp && payload.sellingPrice) {
            product.discountPercentage = Math.round(((payload.mrp - payload.sellingPrice) / payload.mrp) * 100)
        }

        await product.save()

        return response(true, 200, 'Product updated successfully.', { product })

    } catch (error) {
        return catchError(error)
    }
}

// DELETE - Soft delete product
export async function DELETE(request, { params }) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller', 'admin'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const { id } = await params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response(false, 400, 'Invalid product ID.')
        }

        const filter = {
            _id: new mongoose.Types.ObjectId(id),
            deletedAt: null
        }

        if (auth.role !== 'admin') {
            filter.sellerId = new mongoose.Types.ObjectId(auth.userId)
        }

        const product = await ProductModel.findOne(filter)
        if (!product) {
            return response(false, 404, 'Product not found.')
        }

        // Soft delete
        product.deletedAt = new Date()
        product.status = 'inactive'
        await product.save()

        // Soft delete variants
        await ProductVariantModel.updateMany(
            { product: product._id },
            { deletedAt: new Date(), status: 'inactive' }
        )

        // Update seller's product count
        await mongoose.model('User').updateOne(
            { _id: product.sellerId },
            { $inc: { 'sellerProfile.totalProducts': -1 } }
        )

        return response(true, 200, 'Product deleted successfully.')

    } catch (error) {
        return catchError(error)
    }
}