import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import "@/models/User.model"

export async function GET(request, { params }) {
    try {
        await connectDB()
        const { sellerSlug } = await params
        
        // Find seller by store name slug or ID
        const UserModel = (await import('@/models/User.model')).default
        
        // Try to find by store name slug first
        let seller = await UserModel.findOne({
            'sellerProfile.storeName': { $regex: new RegExp('^' + sellerSlug.replace(/-/g, ' ') + '$', 'i') },
            role: { $in: ['thrift_seller', 'brand_seller'] }
        }).select('-password').lean()
        
        // If not found, try by ID
        if (!seller && sellerSlug.match(/^[0-9a-fA-F]{24}$/)) {
            seller = await UserModel.findById(sellerSlug)
                .select('-password')
                .lean()
        }
        
        if (!seller) {
            return response(false, 404, 'Seller not found')
        }
        
        // Get seller's products
        const products = await ProductModel.find({
            sellerId: seller._id,
            deletedAt: null,
            status: 'active'
        })
        .populate('category', 'name')
        .populate('sellerId', 'name sellerId sellerProfile')
        .sort({ createdAt: -1 })
        .lean()

        // ✅ For brand products without images, get first variant image
        const ProductVariantModel = (await import('@/models/ProductVariant.model')).default
        for (const product of products) {
            if (product.productType === 'brand_new' && (!product.media || product.media.length === 0)) {
                const firstVariant = await ProductVariantModel.findOne({
                    product: product._id,
                    deletedAt: null,
                    status: 'active',
                    quantity: { $gt: 0 }
                }).select('media').lean()
                
                if (firstVariant?.media && firstVariant.media.length > 0) {
                    product.media = firstVariant.media
                }
            }
        }
        
        return response(true, 200, 'Seller found', {
            seller,
            products
        })
        
    } catch (error) {
        console.error('Seller store error:', error)
        return catchError(error)
    }
}