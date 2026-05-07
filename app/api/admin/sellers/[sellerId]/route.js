import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import UserModel from "@/models/User.model"

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { sellerId } = await params
        
        const seller = await UserModel.findOne({ 
            sellerId: sellerId,
            role: { $in: ['thrift_seller', 'brand_seller'] },
            deletedAt: null 
        }).select('-password').lean()
        
        if (!seller) return response(false, 404, 'Seller not found.')
        
        return response(true, 200, 'Seller fetched.', seller)
    } catch (error) {
        return catchError(error)
    }
}