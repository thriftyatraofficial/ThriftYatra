import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import UserModel from "@/models/User.model"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const status = searchParams.get('status')
        
        const filter = { 
            deletedAt: null,
            role: { $in: ['thrift_seller', 'brand_seller'] }
        }
        
        if (type) filter.role = type
        if (status) filter['sellerProfile.approvalStatus'] = status
        
        const sellers = await UserModel.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .lean()
        
        return response(true, 200, 'Sellers fetched.', { sellers })
    } catch (error) {
        return catchError(error)
    }
}

export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { sellerId, action } = await request.json()
        
        const seller = await UserModel.findOne({ sellerId })
        if (!seller) return response(false, 404, 'Seller not found.')
        
        switch (action) {
            case 'approve':
                seller.sellerProfile.approvalStatus = 'approved'
                seller.sellerProfile.isActive = true
                break
            case 'reject':
                seller.sellerProfile.approvalStatus = 'rejected'
                break
            case 'suspend':
                seller.sellerProfile.isActive = false
                break
            case 'activate':
                seller.sellerProfile.isActive = true
                break
        }
        
        await seller.save()
        return response(true, 200, `Seller ${action}ed successfully.`)
    } catch (error) {
        return catchError(error)
    }
}