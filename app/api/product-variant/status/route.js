import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductVariantModel from "@/models/ProductVariant.model"

export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['admin', 'brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const { status, quantity } = await request.json()
        
        if (!id) return response(false, 400, 'Variant ID is required.')
        
        const filter = { _id: id }
        if (auth.role !== 'admin') filter.sellerId = auth.userId
        
        const variant = await ProductVariantModel.findOne(filter)
        if (!variant) return response(false, 404, 'Variant not found.')
        
        if (status) {
            variant.status = status
            if (status === 'out_of_stock') variant.quantity = 0
        }
        if (quantity !== undefined) {
            variant.quantity = quantity
            variant.status = quantity > 0 ? 'active' : 'out_of_stock'
        }
        
        await variant.save()
        return response(true, 200, 'Variant status updated.')
    } catch (error) {
        return catchError(error)
    }
}