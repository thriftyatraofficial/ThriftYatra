import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import UserModel from "@/models/User.model"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        await connectDB()
        
        const brands = await UserModel.find({
            role: 'brand_seller',
            'sellerProfile.approvalStatus': 'approved',
            'sellerProfile.isActive': true,
            deletedAt: null
        })
        .select('sellerProfile pickupAddress')
        .lean()
        
        const formattedBrands = brands.map(brand => ({
            ...brand,
            slug: brand.sellerProfile?.storeName?.toLowerCase().replace(/\s+/g, '-') || brand._id
        }))
        
        return NextResponse.json({ success: true, data: formattedBrands })
    } catch (error) {
        return catchError(error)
    }
}