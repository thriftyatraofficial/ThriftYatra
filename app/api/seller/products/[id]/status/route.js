import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import mongoose from "mongoose"

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const { id } = await params
        const { status } = await request.json()

        if (!['active', 'sold_out', 'inactive'].includes(status)) {
            return response(false, 400, 'Invalid status.')
        }

        const product = await ProductModel.findOne({
            _id: new mongoose.Types.ObjectId(id),
            sellerId: new mongoose.Types.ObjectId(auth.userId),
            deletedAt: null
        })

        if (!product) {
            return response(false, 404, 'Product not found.')
        }

        product.status = status
        await product.save()

        return response(true, 200, `Product marked as ${status}.`)

    } catch (error) {
        return catchError(error)
    }
}