import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SellerPayoutModel from "@/models/SellerPayout.model"
import SellerWalletModel from "@/models/SellerWallet.model"
import SellerTransactionModel from "@/models/SellerTransaction.model"

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        
        const { id } = params
        const { action, transactionId, notes } = await request.json()
        
        const payout = await SellerPayoutModel.findById(id)
        if (!payout) return response(false, 404, 'Payout not found')
        
        if (action === 'approve') {
            payout.status = 'completed'
            payout.processedAt = new Date()
            payout.processedBy = auth.userId
            payout.transactionId = transactionId
            payout.notes = notes
            
            // Update wallet
            const wallet = await SellerWalletModel.findOne({ sellerId: payout.sellerId })
            if (wallet) {
                wallet.pendingAmount -= payout.amount
                wallet.withdrawnAmount += payout.amount
                await wallet.save()
            }
            
            // Create transaction record
            await SellerTransactionModel.create({
                sellerId: payout.sellerId,
                type: 'payout',
                amount: payout.amount,
                description: 'Withdrawal processed',
                status: 'completed',
                payoutReference: payout._id
            })
        } else if (action === 'reject') {
            payout.status = 'rejected'
            payout.notes = notes
            
            // Refund to wallet
            const wallet = await SellerWalletModel.findOne({ sellerId: payout.sellerId })
            if (wallet) {
                wallet.pendingAmount -= payout.amount
                wallet.availableBalance += payout.amount
                await wallet.save()
            }
        }
        
        await payout.save()
        return response(true, 200, `Payout ${action === 'approve' ? 'approved' : 'rejected'}.`)
    } catch (error) { return catchError(error) }
}