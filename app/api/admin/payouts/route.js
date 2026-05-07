import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import SellerPayoutModel from "@/models/SellerPayout.model"

export async function GET() {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        
        const payouts = await SellerPayoutModel.find()
            .populate('sellerId', 'name sellerId sellerProfile')
            .sort({ createdAt: -1 })
            .lean()

        const formatted = payouts.map(p => ({
            ...p,
            sellerName: p.sellerId?.sellerProfile?.storeName || p.sellerId?.name || 'Unknown',
            sellerId: p.sellerId?.sellerId || p.sellerId?._id
        }))

        const stats = {
            total: formatted.length,
            pending: formatted.filter(p => p.status === 'pending').length,
            processing: formatted.filter(p => p.status === 'processing').length,
            completed: formatted.filter(p => p.status === 'completed').length,
            totalAmount: formatted.filter(p => p.status !== 'rejected').reduce((s, p) => s + p.amount, 0)
        }

        return response(true, 200, 'Payouts fetched.', { payouts: formatted, stats })
    } catch (error) { return catchError(error) }
}