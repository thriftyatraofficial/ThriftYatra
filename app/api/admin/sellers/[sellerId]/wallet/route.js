import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SellerWalletModel from "@/models/SellerWallet.model"
import UserModel from "@/models/User.model"

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { sellerId } = await params
        
        const seller = await UserModel.findOne({ sellerId, deletedAt: null })
        if (!seller) return response(false, 404, 'Seller not found.')
        
        let wallet = await SellerWalletModel.findOne({ sellerId: seller._id })
        if (!wallet) {
            wallet = { totalEarned: 0, pendingAmount: 0, availableBalance: 0, withdrawnAmount: 0 }
        }
        
        return response(true, 200, 'Wallet fetched.', wallet)
    } catch (error) {
        return catchError(error)
    }
}