import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import UserModel from "@/models/User.model"

export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { userId } = await params
        
        const user = await UserModel.findOne({ 
            _id: userId,
            deletedAt: null 
        }).select('-password').lean()
        
        if (!user) return response(false, 404, 'User not found.')
        
        return response(true, 200, 'User fetched.', user)
    } catch (error) {
        return catchError(error)
    }
}