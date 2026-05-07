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

        // Update seller profile
        user.sellerProfile = {
            ...user.sellerProfile,
            storeName: payload.storeName || user.sellerProfile?.storeName,
            storeDescription: payload.storeDescription || user.sellerProfile?.storeDescription,
            storeLogo: payload.storeLogo || user.sellerProfile?.storeLogo,
            storeBanner: payload.storeBanner || user.sellerProfile?.storeBanner,
            phone: payload.phone || user.sellerProfile?.phone,
            whatsapp: payload.whatsapp || user.sellerProfile?.whatsapp,
            instagram: payload.instagram || user.sellerProfile?.instagram,
        }

        await user.save()

        return response(true, 200, 'Store profile updated.')

    } catch (error) {
        return catchError(error)
    }
}