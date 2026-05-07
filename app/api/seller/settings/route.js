import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import UserModel from "@/models/User.model"
import SellerBankModel from "@/models/SellerBank.model"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['thrift_seller', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const user = await UserModel.findById(auth.userId).select('-password').lean()
        const bankDetails = await SellerBankModel.findOne({ sellerId: auth.userId }).lean()

        const settings = {
            storeProfile: {
                storeName: user.sellerProfile?.storeName || '',
                storeDescription: user.sellerProfile?.storeDescription || '',
                storeLogo: user.sellerProfile?.storeLogo || null,
                storeBanner: user.sellerProfile?.storeBanner || null,
                phone: user.sellerProfile?.phone || '',
                whatsapp: user.sellerProfile?.whatsapp || '',
                instagram: user.sellerProfile?.instagram || '',
            },
            businessDetails: user.businessDetails || {
                gstNumber: '',
                panNumber: '',
                businessType: 'individual',
                businessEmail: '',
            },
            pickupAddress: user.pickupAddress || {
                fullName: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
                landmark: '',
            },
            bankDetails: bankDetails,
            shippingSettings: user.shippingSettings || {
                handlingDays: 2,
                shippingCharge: 50,
                freeShippingAbove: 0,
            },
            returnPolicy: user.returnPolicy || {
                acceptReturns: false,
                returnWindow: 7,
                returnConditions: '',
            },
            stats: {
                totalProducts: user.sellerProfile?.totalProducts || 0,
                totalOrders: user.sellerProfile?.totalOrders || 0,
                totalSales: user.sellerProfile?.totalSales || 0,
                rating: user.sellerProfile?.rating || 0,
                joinedDate: user.createdAt,
                sellerId: user.sellerId,
                approvalStatus: user.sellerProfile?.approvalStatus || 'pending',
                isActive: user.sellerProfile?.isActive || false,
            }
        }

        return response(true, 200, 'Settings fetched.', settings)

    } catch (error) {
        return catchError(error)
    }
}