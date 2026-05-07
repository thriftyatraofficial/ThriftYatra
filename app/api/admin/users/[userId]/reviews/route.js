import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ReviewModel from "@/models/Review.model"
import mongoose from "mongoose"

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { userId } = await params
        
        const reviews = await ReviewModel.find({ 
            user: new mongoose.Types.ObjectId(userId),
            deletedAt: null 
        }).populate('product', 'name media').sort({ createdAt: -1 }).lean()
        
        const formattedReviews = reviews.map(r => ({
            _id: r._id,
            productName: r.product?.name || 'Product',
            productImage: r.product?.media?.[0]?.secure_url || r.product?.base64Media?.[0]?.secure_url,
            rating: r.rating,
            review: r.review,
            createdAt: r.createdAt
        }))
        
        return response(true, 200, 'Reviews fetched.', formattedReviews)
    } catch (error) {
        return catchError(error)
    }
}