import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import ProductModel from "@/models/Product.model";
import ProductVariantModel from "@/models/ProductVariant.model";
import CategoryModel from "@/models/Category.model";
import "@/models/User.model";
import "@/models/Category.model";

export async function GET(request, { params }) {
    try {
        await connectDB()
        const { slug } = await params
        const { searchParams } = new URL(request.url)
        const color = searchParams.get('color')
        const size = searchParams.get('size')

        console.log('🔍 Looking for product with slug:', slug)

        const product = await ProductModel.findOne({ 
            slug: slug, 
            deletedAt: null,
            status: 'active'
        })
        .populate('category', 'name')
        .populate('sellerId', 'name sellerId sellerProfile phone pickupAddress')
        .lean()

        if (!product) {
            console.log('❌ Product not found for slug:', slug)
            return response(false, 404, 'Product not found')
        }

        console.log('✅ Product found:', product.name)

        let variant = null
        let colors = []
        let sizes = []
        let validCombinations = []
        let allVariants = []

        if (product.productType === 'brand_new' && product.hasVariants) {
            allVariants = await ProductVariantModel.find({ 
                product: product._id, 
                deletedAt: null,
                status: 'active'
            }).lean()

            console.log(` Found ${allVariants.length} total variants`)

            // Filter variants with stock
            const variantsWithStock = allVariants.filter(v => v.quantity > 0)
            
            if (variantsWithStock.length > 0) {
                colors = [...new Set(variantsWithStock.map(v => v.color).filter(Boolean))]
                sizes = [...new Set(variantsWithStock.map(v => v.size).filter(Boolean))]
                validCombinations = variantsWithStock.map(v => ({
                    color: v.color,
                    size: v.size,
                    _id: v._id
                }))

                if (color && size) {
                    variant = variantsWithStock.find(v => v.color === color && v.size === size)
                }
                
                if (!variant) {
                    variant = variantsWithStock[0]
                }

                if (variant && (!variant.media || variant.media.length === 0) && (!variant.base64Media || variant.base64Media.length === 0)) {
                    variant = {
                        ...variant,
                        media: product.media || [],
                        base64Media: product.base64Media || []
                    }
                }
            } else {
                // ✅ No stock in any variant = mark product as sold_out
                product.status = 'sold_out'
                product.quantity = 0
            }
        }

        if (variant && !variant.media?.length && !variant.base64Media?.length) {
            variant.media = product.media || []
            variant.base64Media = product.base64Media || []
        }

        const reviewCount = 0
        const seller = product.sellerId

        return response(true, 200, 'Product found', {
            product,
            variant: variant || null,
            colors,
            sizes,
            validCombinations,
            allVariants,
            reviewCount,
            seller
        })

    } catch (error) {
        console.error('❌ Product details error:', error)
        return catchError(error)
    }
}