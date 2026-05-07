import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import CategoryModel from "@/models/Category.model";
import ProductModel from "@/models/Product.model";
import "@/models/User.model";

export async function GET(request) {
    try {
        await connectDB()

        const searchParams = request.nextUrl.searchParams

        const type = searchParams.get('type')
        const color = searchParams.get('color')
        const minPrice = parseInt(searchParams.get('minPrice')) || 0
        const maxPrice = parseInt(searchParams.get('maxPrice')) || 100000
        const categorySlug = searchParams.get('category')
        const search = searchParams.get('search') || searchParams.get('q')
        const seller = searchParams.get('seller')
        const diy = searchParams.get('diy')

        const limit = parseInt(searchParams.get('limit')) || 12
        const page = parseInt(searchParams.get('page')) || 0
        const skip = page * limit

        let sortquery = {}
        const sortOption = searchParams.get('sort') || 'default_sorting'
        if (sortOption === 'default_sorting') sortquery = { createdAt: -1 }
        if (sortOption === 'asc') sortquery = { name: 1 }
        if (sortOption === 'desc') sortquery = { name: -1 }
        if (sortOption === 'price_low_high') sortquery = { sellingPrice: 1 }
        if (sortOption === 'price_high_low') sortquery = { sellingPrice: -1 }

        let categoryId = []
        if (categorySlug) {
            const slugs = categorySlug.split(',')
            const categoryData = await CategoryModel.find({ deletedAt: null, slug: { $in: slugs } }).select('_id').lean()
            categoryId = categoryData.map(category => category._id)
        }

        let matchStage = { 
            deletedAt: null, 
            status: 'active',
            $or: [
                { productType: 'thrift', quantity: { $gt: 0 } },
                { productType: 'brand_new' }
            ]
        }
        
        if (type === 'thrift') matchStage.productType = 'thrift'
        if (type === 'brand_new') matchStage.productType = 'brand_new'
        if (diy === 'true') matchStage.isDIY = true
        if (seller) matchStage.sellerId = seller
        if (categoryId.length > 0) matchStage.category = { $in: categoryId }
        if (search) matchStage.name = { $regex: search, $options: 'i' }

        const products = await ProductModel.find(matchStage)
            .populate('category', 'name')
            .populate('sellerId', 'name sellerId sellerProfile')
            .populate('media', 'secure_url alt')
            .sort(sortquery)
            .skip(skip)
            .limit(limit + 1)
            .lean()

        const ProductVariantModel = (await import('@/models/ProductVariant.model')).default

        const filteredProducts = []
        for (const product of products) {
            if (product.productType === 'brand_new' && product.hasVariants) {
                const firstVariant = await ProductVariantModel.findOne({
                    product: product._id,
                    deletedAt: null,
                    status: 'active',
                    quantity: { $gt: 0 }
                }).select('media size color sellingPrice mrp').lean()
                
                if (firstVariant) {
                    // ✅ If product has no images, use first variant's first image
                    if (!product.media || product.media.length === 0) {
                        product.media = firstVariant.media || []
                    }
                    // Also add variant info for display
                    product._firstVariant = firstVariant
                    filteredProducts.push(product)
                }
            } else {
                filteredProducts.push(product)
            }
        }

        let nextPage = null
        if (filteredProducts.length > limit) {
            nextPage = page + 1
            filteredProducts.pop()
        }

        return response(true, 200, 'Product data found.', { 
            products: filteredProducts, 
            nextPage 
        })

    } catch (error) {
        console.error('Shop API error:', error)
        return catchError(error)
    }
}