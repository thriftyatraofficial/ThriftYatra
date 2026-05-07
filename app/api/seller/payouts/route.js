import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SellerPayoutModel from "@/models/SellerPayout.model"
import SellerWalletModel from "@/models/SellerWallet.model"
import SellerTransactionModel from "@/models/SellerTransaction.model"
import mongoose from "mongoose"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const payouts = await SellerPayoutModel.find({ 
            sellerId: new mongoose.Types.ObjectId(auth.userId) 
        }).sort({ createdAt: -1 }).lean()

        return response(true, 200, 'Payouts fetched.', payouts)

    } catch (error) {
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const { amount } = await request.json()

        if (!amount || amount < 100) {
            return response(false, 400, 'Minimum withdrawal is ₹100')
        }

        // Check wallet balance
        const wallet = await SellerWalletModel.findOne({ 
            sellerId: new mongoose.Types.ObjectId(auth.userId) 
        })
        
        if (!wallet || wallet.availableBalance < amount) {
            return response(false, 400, 'Insufficient balance')
        }

        // Create payout request
        const payout = new SellerPayoutModel({
            sellerId: auth.userId,
            amount: amount,
            status: 'pending'
        })
        await payout.save()

        // Update wallet
        wallet.availableBalance -= amount
        wallet.pendingAmount += amount
        await wallet.save()

        // Create transaction record
        const transaction = new SellerTransactionModel({
            sellerId: auth.userId,
            type: 'debit',
            amount: amount,
            description: 'Withdrawal request',
            status: 'pending',
            payoutReference: payout._id
        })
        await transaction.save()

        return response(true, 200, 'Payout request submitted.', payout)

    } catch (error) {
        return catchError(error)
    }
}