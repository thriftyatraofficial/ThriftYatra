import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import UserModel from "@/models/User.model"
import mongoose from "mongoose"

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { sellerId } = await params
        
        const seller = await UserModel.findOne({ sellerId, deletedAt: null })
        if (!seller) return response(false, 404, 'Seller not found.')
        
        const products = await ProductModel.find({ 
            sellerId: seller._id,
            deletedAt: null 
        }).sort({ createdAt: -1 }).lean()
        
        const stats = {
            totalProducts: products.length,
            activeProducts: products.filter(p => p.status === 'active').length,
            soldOut: products.filter(p => p.status === 'sold_out').length,
            inactive: products.filter(p => p.status === 'inactive').length
        }
        
        return response(true, 200, 'Products fetched.', { products, stats })
    } catch (error) {
        return catchError(error)
    }
}