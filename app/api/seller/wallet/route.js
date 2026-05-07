import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SellerWalletModel from "@/models/SellerWallet.model"
import mongoose from "mongoose"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        
        let wallet = await SellerWalletModel.findOne({ 
            sellerId: new mongoose.Types.ObjectId(auth.userId) 
        })
        
        if (!wallet) {
            wallet = new SellerWalletModel({ 
                sellerId: auth.userId,
                totalEarned: 0,
                pendingAmount: 0,
                availableBalance: 0,
                withdrawnAmount: 0
            })
            await wallet.save()
        }

        return response(true, 200, 'Wallet fetched.', wallet)

    } catch (error) {
        return catchError(error)
    }
}