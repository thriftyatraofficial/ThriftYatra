import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SellerTransactionModel from "@/models/SellerTransaction.model"
import mongoose from "mongoose"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        
        const { searchParams } = new URL(request.url)
        const days = parseInt(searchParams.get('days')) || 30
        
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const transactions = await SellerTransactionModel.find({ 
            sellerId: new mongoose.Types.ObjectId(auth.userId),
            createdAt: { $gte: startDate }
        }).sort({ createdAt: -1 }).lean()

        return response(true, 200, 'Transactions fetched.', transactions)

    } catch (error) {
        return catchError(error)
    }
}