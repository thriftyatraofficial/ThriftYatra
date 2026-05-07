import { connectDB } from '@/lib/databaseConnection'
import ProductModel from '@/models/Product.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import ReviewModel from '@/models/Review.model'
import '@/models/User.model'
import ProductDetails from './ProductDetails'

async function getProductData(slug, color, size) {
    await connectDB()
    
    const product = await ProductModel.findOne({ slug, deletedAt: null, status: 'active' })
        .populate('category', 'name')
        .populate('sellerId', 'name sellerId sellerProfile phone pickupAddress')
        .lean()

    if (!product) return { success: false }

    let variant = null, colors = [], sizes = [], validCombinations = [], allVariants = []

    if (product.productType === 'brand_new' && product.hasVariants) {
        allVariants = await ProductVariantModel.find({ product: product._id, deletedAt: null, status: 'active', quantity: { $gt: 0 } }).lean()

        if (allVariants.length > 0) {
            colors = [...new Set(allVariants.map(v => v.color).filter(Boolean))]
            sizes = [...new Set(allVariants.map(v => v.size).filter(Boolean))]
            validCombinations = allVariants.map(v => ({ color: v.color, size: v.size, _id: v._id }))
            variant = (color && size) ? allVariants.find(v => v.color === color && v.size === size) || allVariants[0] : allVariants[0]
            if (variant && (!variant.media || variant.media.length === 0)) variant = { ...variant, media: product.media || [] }
        }
    }

    return { success: true, data: { product, variant: variant || null, colors, sizes, validCombinations, allVariants, reviewCount: await ReviewModel.countDocuments({ product: product._id, deletedAt: null }), seller: product.sellerId } }
}

const ProductPage = async ({ params, searchParams }) => {
    const { slug } = await params
    const { color, size } = await searchParams

    try {
        const getProduct = await getProductData(slug, color, size)
        if (!getProduct.success || !getProduct.data?.product) {
            return (<div className='flex justify-center items-center py-20 h-[400px]'><div className='text-center'><h1 className='text-4xl font-semibold mb-4'>Product not found</h1><p className='text-gray-500 mb-6'>The product you're looking for doesn't exist or has been removed.</p><a href="/shop" className='bg-[#E8B931] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#d4a520] transition'>Browse Shop</a></div></div>)
        }
        return (<ProductDetails product={getProduct.data.product} variant={getProduct.data.variant} colors={getProduct.data.colors} sizes={getProduct.data.sizes} validCombinations={getProduct.data.validCombinations} allVariants={getProduct.data.allVariants} reviewCount={getProduct.data.reviewCount} seller={getProduct.data.seller} />)
    } catch (error) {
        return (<div className='flex justify-center items-center py-20 h-[400px]'><div className='text-center'><h1 className='text-4xl font-semibold mb-4'>Something went wrong</h1><p className='text-gray-500 mb-6'>Please try again later.</p><a href="/shop" className='bg-[#E8B931] text-black px-6 py-3 rounded-full font-semibold hover:bg-[#d4a520] transition'>Browse Shop</a></div></div>)
    }
}

export default ProductPage