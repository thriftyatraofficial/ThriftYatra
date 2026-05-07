import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductVariantModel from "@/models/ProductVariant.model"

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated(['brand_seller', 'admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params
        const payload = await request.json()

        const variant = await ProductVariantModel.findOne({ _id: id, sellerId: auth.userId })
        if (!variant) return response(false, 404, 'Variant not found.')

        if (payload.color) variant.color = payload.color
        if (payload.size) variant.size = payload.size
        if (payload.mrp !== undefined) variant.mrp = payload.mrp
        if (payload.sellingPrice !== undefined) variant.sellingPrice = payload.sellingPrice
        if (payload.sku) variant.sku = payload.sku
        if (payload.quantity !== undefined) {
            variant.quantity = payload.quantity
            variant.status = payload.quantity > 0 ? 'active' : 'out_of_stock'
        }
        if (payload.status) variant.status = payload.status
        if (payload.media) variant.media = payload.media
        if (payload.mrp && payload.sellingPrice) {
            variant.discountPercentage = Math.round(((payload.mrp - payload.sellingPrice) / payload.mrp) * 100)
        }

        await variant.save()
        return response(true, 200, 'Variant updated.', variant)

    } catch (error) {
        return catchError(error)
    }
}

export async function DELETE(request, { params }) {
    try {
        const auth = await isAuthenticated(['brand_seller', 'admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const { id } = await params

        const variant = await ProductVariantModel.findOne({ _id: id, sellerId: auth.userId })
        if (!variant) return response(false, 404, 'Variant not found.')

        variant.deletedAt = new Date()
        variant.status = 'inactive'
        await variant.save()

        return response(true, 200, 'Variant deleted.')

    } catch (error) {
        return catchError(error)
    }
}