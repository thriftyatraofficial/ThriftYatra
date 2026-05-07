import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import UserModel from "@/models/User.model"

export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        const user = await UserModel.findById(auth.userId)
        if (!user) {
            return response(false, 404, 'User not found.')
        }

        user.returnPolicy = {
            acceptReturns: payload.acceptReturns || false,
            returnWindow: payload.returnWindow || 7,
            returnConditions: payload.returnConditions || '',
        }

        await user.save()

        return response(true, 200, 'Return policy updated.')

    } catch (error) {
        return catchError(error)
    }
}