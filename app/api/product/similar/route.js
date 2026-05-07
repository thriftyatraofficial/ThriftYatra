import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"

export async function GET(request) {
    try {
        await connectDB()
        const { searchParams } = new URL(request.url)
        
        const productId = searchParams.get('productId')
        const categoryId = searchParams.get('category')
        const productType = searchParams.get('type')
        const limit = parseInt(searchParams.get('limit')) || 4
        
        const filter = {
            _id: { $ne: productId },
            deletedAt: null,
            status: 'active'
        }
        
        if (categoryId) filter.category = categoryId
        if (productType) filter.productType = productType
        
        const products = await ProductModel.find(filter)
            .populate('category', 'name')
            .populate('sellerId', 'name sellerProfile')
            .limit(limit)
            .lean()
        
        return response(true, 200, 'Similar products found', { products })
        
    } catch (error) {
        return catchError(error)
    }
}