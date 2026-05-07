import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import OrderModel from "@/models/Order.model"
import mongoose from "mongoose"

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { userId } = await params
        
        const orders = await OrderModel.find({ 
            user: new mongoose.Types.ObjectId(userId),
            deletedAt: null 
        }).sort({ createdAt: -1 }).lean()
        
        return response(true, 200, 'Orders fetched.', { orders })
    } catch (error) {
        return catchError(error)
    }
}