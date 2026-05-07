import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductVariantModel from "@/models/ProductVariant.model"
import ProductModel from "@/models/Product.model"
import MediaModel from "@/models/Media.model"
import mongoose from "mongoose"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['admin', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }
        
        await connectDB()
        const { searchParams } = new URL(request.url)
        const start = parseInt(searchParams.get('start')) || 0
        const size = parseInt(searchParams.get('size')) || 10
        const deleteType = searchParams.get('deleteType') || 'SD'
        const globalFilter = searchParams.get('globalFilter') || ''
        const productId = searchParams.get('productId')
        const filtersParam = searchParams.get('filters') || '[]'
        const sortingParam = searchParams.get('sorting') || '[]'
        
        console.log('🚀 GET /api/product-variant called')
        console.log('📊 Params:', { start, size, deleteType, globalFilter, productId })
        
        const filter = {}
        
        if (deleteType === 'SD') {
            filter.deletedAt = null
        } else if (deleteType === 'HD') {
            filter.deletedAt = { $ne: null }
        }
        
        if (auth.role === 'brand_seller') {
            filter.sellerId = new mongoose.Types.ObjectId(auth.userId)
        }
        
        if (productId) {
            filter.product = new mongoose.Types.ObjectId(productId)
        }
        
        if (globalFilter && globalFilter.trim() !== '') {
            filter.$or = [
                { sku: { $regex: globalFilter, $options: 'i' } },
                { color: { $regex: globalFilter, $options: 'i' } },
                { size: { $regex: globalFilter, $options: 'i' } }
            ]
        }
        
        let filters = []
        try { filters = JSON.parse(filtersParam) } catch (e) {}
        filters.forEach(f => {
            if (f.id && f.value !== undefined && f.value !== '') {
                if (f.id === 'status') {
                    filter.status = f.value
                } else if (f.id === 'quantity' || f.id === 'sellingPrice' || f.id === 'mrp') {
                    if (Array.isArray(f.value) && f.value.length === 2) {
                        filter[f.id] = { $gte: f.value[0], $lte: f.value[1] }
                    }
                }
            }
        })
        
        console.log('🔍 Filter:', JSON.stringify(filter))
        
        const total = await ProductVariantModel.countDocuments(filter)
        console.log('📈 Total variants:', total)
        
        let sorting = []
        try { sorting = JSON.parse(sortingParam) } catch (e) {}
        const sortObj = {}
        if (sorting.length > 0) {
            sorting.forEach(s => { sortObj[s.id] = s.desc ? -1 : 1 })
        } else {
            sortObj.createdAt = -1
        }
        
        const variants = await ProductVariantModel.find(filter)
            .populate('product', 'name uniqueCode')
            .populate('media', 'secure_url')
            .sort(sortObj)
            .skip(start)
            .limit(size)
            .lean()
        
        console.log('📦 Variants fetched:', variants.length)
        
        const formattedVariants = variants.map(v => ({
            _id: v._id,
            sku: v.sku,
            color: v.color,
            size: v.size,
            mrp: v.mrp,
            sellingPrice: v.sellingPrice,
            discountPercentage: v.discountPercentage,
            quantity: v.quantity,
            status: v.status,
            productName: v.product?.name || 'N/A',
            productCode: v.product?.uniqueCode || 'N/A',
            productId: v.product?._id,
            media: v.media || [],
            createdAt: v.createdAt,
            updatedAt: v.updatedAt
        }))
        
        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Variants fetched.',
            data: formattedVariants,
            meta: { totalRowCount: total }
        })
        
    } catch (error) {
        console.error('❌ GET variants error:', error)
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['admin', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()
        
        console.log('📦 Creating variant with payload:', JSON.stringify(payload, null, 2))

        if (!payload.product) {
            return response(false, 400, 'Product is required.')
        }
        if (!payload.sku || payload.sku.length < 3) {
            return response(false, 400, 'SKU is required (min 3 characters).')
        }
        if (!payload.color) {
            return response(false, 400, 'Color is required.')
        }
        if (!payload.size) {
            return response(false, 400, 'Size is required.')
        }
        if (!payload.sellingPrice || payload.sellingPrice < 1) {
            return response(false, 400, 'Selling price is required.')
        }

        const product = await ProductModel.findById(payload.product)
        if (!product) {
            return response(false, 404, 'Product not found.')
        }

        const existingSku = await ProductVariantModel.findOne({ sku: payload.sku })
        if (existingSku) {
            return response(false, 400, 'This SKU already exists. Please use a unique SKU.')
        }

        // ✅ FIXED: Process media - only accept valid ObjectIds
        const mediaIds = []
        if (payload.media && Array.isArray(payload.media)) {
            for (const mediaItem of payload.media) {
                if (typeof mediaItem === 'string' && /^[0-9a-fA-F]{24}$/.test(mediaItem)) {
                    mediaIds.push(mediaItem)
                } else if (mediaItem && typeof mediaItem === 'object' && mediaItem._id) {
                    if (/^[0-9a-fA-F]{24}$/.test(mediaItem._id)) {
                        mediaIds.push(mediaItem._id)
                    }
                } else if (mediaItem && typeof mediaItem === 'object' && mediaItem.secure_url?.startsWith('data:')) {
                    const newMedia = new MediaModel({
                        secure_url: mediaItem.secure_url,
                        public_id: mediaItem.public_id || `variant_${Date.now()}`,
                        alt: mediaItem.alt || `${product.name} - ${payload.color}`,
                        title: `${product.name} - ${payload.color}`,
                        isBase64: true
                    })
                    await newMedia.save()
                    mediaIds.push(newMedia._id)
                } else if (mediaItem instanceof mongoose.Types.ObjectId) {
                    mediaIds.push(mediaItem.toString())
                } else {
                    console.warn('⚠️ Skipping invalid media item:', mediaItem)
                }
            }
        }

        console.log('✅ Processed media IDs:', mediaIds)

        const variant = new ProductVariantModel({
            product: payload.product,
            sellerId: auth.userId,
            color: payload.color,
            size: payload.size,
            mrp: payload.mrp || payload.sellingPrice,
            sellingPrice: payload.sellingPrice,
            discountPercentage: payload.discountPercentage || 0,
            sku: payload.sku,
            quantity: payload.quantity || 0,
            media: mediaIds,
            status: (payload.quantity || 0) > 0 ? 'active' : 'out_of_stock'
        })

        await variant.save()
        await ProductModel.updateOne({ _id: product._id }, { hasVariants: true })
        
        console.log('✅ Variant created:', variant._id)

        return response(true, 200, 'Product variant added successfully.', variant)

    } catch (error) {
        console.error('❌ POST variant error:', error)
        if (error.code === 11000) {
            return response(false, 400, 'SKU already exists.')
        }
        return catchError(error)
    }
}

export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['admin', 'brand_seller'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const payload = await request.json()
        
        console.log('📝 Updating variant:', id, payload)

        if (!id) {
            return response(false, 400, 'Variant ID is required.')
        }

        const variant = await ProductVariantModel.findById(id)
        if (!variant) {
            return response(false, 404, 'Variant not found.')
        }

        if (payload.color) variant.color = payload.color
        if (payload.size) variant.size = payload.size
        if (payload.mrp !== undefined) variant.mrp = payload.mrp
        if (payload.sellingPrice !== undefined) variant.sellingPrice = payload.sellingPrice
        if (payload.sku) variant.sku = payload.sku
        if (payload.quantity !== undefined) {
            variant.quantity = payload.quantity
            variant.status = payload.quantity > 0 ? 'active' : 'out_of_stock'
        }
        if (payload.status) variant.status = payload.status
        
        if (payload.media && Array.isArray(payload.media)) {
            const mediaIds = []
            for (const mediaItem of payload.media) {
                if (typeof mediaItem === 'string' && /^[0-9a-fA-F]{24}$/.test(mediaItem)) {
                    mediaIds.push(mediaItem)
                } else if (mediaItem && mediaItem._id && /^[0-9a-fA-F]{24}$/.test(mediaItem._id)) {
                    mediaIds.push(mediaItem._id)
                }
            }
            variant.media = mediaIds
        }
        
        if (payload.mrp && payload.sellingPrice) {
            variant.discountPercentage = Math.round(((payload.mrp - payload.sellingPrice) / payload.mrp) * 100)
        }

        await variant.save()
        console.log('✅ Variant updated:', variant._id)

        return response(true, 200, 'Variant updated successfully.', variant)

    } catch (error) {
        console.error('❌ PUT variant error:', error)
        return catchError(error)
    }
}

export async function DELETE(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        console.log('🗑️ Deleting variant:', id)

        if (!id) {
            return response(false, 400, 'Variant ID is required.')
        }

        const variant = await ProductVariantModel.findById(id)
        if (!variant) {
            return response(false, 404, 'Variant not found.')
        }

        variant.deletedAt = new Date()
        variant.status = 'inactive'
        await variant.save()
        
        console.log('✅ Variant deleted:', id)

        return response(true, 200, 'Variant deleted successfully.')

    } catch (error) {
        console.error('❌ DELETE variant error:', error)
        return catchError(error)
    }
}