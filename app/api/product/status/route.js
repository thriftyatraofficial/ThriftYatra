import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"

export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['admin', 'thrift_seller', 'brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const { status } = await request.json()
        
        if (!id) return response(false, 400, 'Product ID is required.')
        if (!['active', 'sold_out', 'inactive'].includes(status)) {
            return response(false, 400, 'Invalid status.')
        }
        
        const filter = { _id: id }
        if (auth.role !== 'admin') filter.sellerId = auth.userId
        
        const product = await ProductModel.findOne(filter)
        if (!product) return response(false, 404, 'Product not found.')
        
        product.status = status
        await product.save()
        
        return response(true, 200, `Product marked as ${status}.`)
    } catch (error) {
        return catchError(error)
    }
}