import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SellerTransactionModel from "@/models/SellerTransaction.model"
import UserModel from "@/models/User.model"

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { sellerId } = await params
        
        const seller = await UserModel.findOne({ sellerId, deletedAt: null })
        if (!seller) return response(false, 404, 'Seller not found.')
        
        const transactions = await SellerTransactionModel.find({ 
            sellerId: seller._id 
        }).sort({ createdAt: -1 }).limit(50).lean()
        
        return response(true, 200, 'Transactions fetched.', transactions)
    } catch (error) {
        return catchError(error)
    }
}