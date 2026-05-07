import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductVariantModel from "@/models/ProductVariant.model"

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated(['brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        const { id } = await params
        const { quantity } = await request.json()
        const variant = await ProductVariantModel.findOne({ _id: id, sellerId: auth.userId })
        if (!variant) return response(false, 404, 'Variant not found.')
        variant.quantity = quantity
        variant.status = quantity === 0 ? 'out_of_stock' : 'active'
        await variant.save()
        return response(true, 200, 'Stock updated.')
    } catch (error) { return catchError(error) }
}

// ✅ ADD DELETE METHOD
export async function DELETE(request, { params }) {
    try {
        const auth = await isAuthenticated(['brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        const { id } = await params
        
        const variant = await ProductVariantModel.findOne({ _id: id, sellerId: auth.userId })
        if (!variant) return response(false, 404, 'Variant not found.')
        
        // Soft delete
        variant.deletedAt = new Date()
        variant.status = 'inactive'
        await variant.save()
        
        return response(true, 200, 'Variant deleted successfully.')
    } catch (error) { 
        return catchError(error) 
    }
}