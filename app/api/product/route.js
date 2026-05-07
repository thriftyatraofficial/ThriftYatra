import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import { encode } from "entities"
import mongoose from "mongoose"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { searchParams } = new URL(request.url)
        const start = parseInt(searchParams.get('start')) || 0
        const size = parseInt(searchParams.get('size')) || 10
        const deleteType = searchParams.get('deleteType') || 'SD'
        const globalFilter = searchParams.get('globalFilter') || ''
        const filtersParam = searchParams.get('filters') || '[]'
        const sortingParam = searchParams.get('sorting') || '[]'
        
        const filter = {}
        if (deleteType === 'SD') filter.deletedAt = null
        else if (deleteType === 'HD') filter.deletedAt = { $ne: null }
        
        if (globalFilter && globalFilter.trim() !== '') {
            filter.$or = [
                { name: { $regex: globalFilter, $options: 'i' } },
                { uniqueCode: { $regex: globalFilter, $options: 'i' } },
                { slug: { $regex: globalFilter, $options: 'i' } }
            ]
        }
        
        let filters = []
        try { filters = JSON.parse(filtersParam) } catch (e) {}
        filters.forEach(f => {
            if (f.id && f.value !== undefined && f.value !== '') {
                if (f.id === 'productType' || f.id === 'status') {
                    filter[f.id] = f.value
                } else if (f.id === 'sellingPrice' || f.id === 'mrp' || f.id === 'views') {
                    if (Array.isArray(f.value) && f.value.length === 2) {
                        filter[f.id] = { $gte: f.value[0], $lte: f.value[1] }
                    }
                }
            }
        })
        
        const total = await ProductModel.countDocuments(filter)
        
        let sorting = []
        try { sorting = JSON.parse(sortingParam) } catch (e) {}
        const sortObj = {}
        if (sorting.length > 0) {
            sorting.forEach(s => { sortObj[s.id] = s.desc ? -1 : 1 })
        } else {
            sortObj.createdAt = -1
        }
        
        // ✅ FIXED: Don't populate media - return base64Media directly
        const products = await ProductModel.find(filter)
            .populate('category', 'name')
            .populate('sellerId', 'name sellerId sellerProfile')
            .sort(sortObj)
            .skip(start)
            .limit(size)
            .lean()
        
        // ✅ Process products to ensure images are accessible
        const processedProducts = products.map(product => {
            // If base64Media exists, use it for display
            if (product.base64Media && product.base64Media.length > 0) {
                product.displayMedia = product.base64Media
            } else if (product.media && product.media.length > 0) {
                // Fallback to media field
                product.displayMedia = product.media
            }
            return product
        })
        
        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Products fetched.',
            data: processedProducts,
            meta: { totalRowCount: total }
        })
        
    } catch (error) {
        console.error('❌ GET products error:', error)
        return catchError(error)
    }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['admin', 'thrift_seller', 'brand_seller'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const payload = await request.json()

        if (!payload.name || payload.name.length < 3) return response(false, 400, 'Product name is required (min 3 chars).')
        if (!payload.slug || payload.slug.length < 3) return response(false, 400, 'Slug is required (min 3 chars).')
        if (!payload.category) return response(false, 400, 'Category is required.')
        if (!payload.sellingPrice || payload.sellingPrice < 1) return response(false, 400, 'Selling price is required.')
        if (!payload.description || payload.description.length < 10) return response(false, 400, 'Description is required (min 10 chars).')
        if (!payload.uniqueCode || payload.uniqueCode.length < 3) return response(false, 400, 'SKU is required (min 3 chars).')
        if (!payload.media || payload.media.length === 0) return response(false, 400, 'At least one image is required.')

        if (auth.role === 'thrift_seller' && payload.productType !== 'thrift') {
            return response(false, 403, 'Thrift sellers can only add thrift items.')
        }
        if (auth.role === 'brand_seller' && payload.productType !== 'brand_new') {
            return response(false, 403, 'Brand sellers can only add brand new items.')
        }
        if (payload.productType === 'thrift' && !payload.condition) {
            return response(false, 400, 'Condition is required for thrift items.')
        }

        const existingSlug = await ProductModel.findOne({ slug: payload.slug })
        if (existingSlug) return response(false, 400, 'This slug already exists.')
        
        const existingSku = await ProductModel.findOne({ uniqueCode: payload.uniqueCode })
        if (existingSku) return response(false, 400, 'This SKU already exists.')

        const mediaUrls = []
        if (payload.media && Array.isArray(payload.media)) {
            for (const mediaItem of payload.media) {
                if (!mediaItem) continue

                let imageData = null
                if (typeof mediaItem === 'string') {
                    imageData = mediaItem
                } else if (mediaItem?.secure_url) {
                    imageData = mediaItem.secure_url
                }

                if (!imageData) continue

                if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
                    try {
                        const uploadResult = await uploadImageToCloudinary(imageData, 'thriftyatra/products')
                        mediaUrls.push(uploadResult.secure_url)
                    } catch (err) {
                        console.error('Cloudinary upload failed:', err)
                    }
                } else {
                    mediaUrls.push(imageData)
                }
            }
        }

        const isThrift = payload.productType === 'thrift'
        const newProduct = new ProductModel({
            name: payload.name,
            slug: payload.slug,
            category: payload.category,
            mrp: isThrift ? payload.sellingPrice : payload.mrp,
            sellingPrice: payload.sellingPrice,
            discountPercentage: isThrift ? 0 : (payload.discountPercentage || 0),
            description: encode(payload.description || ''),
            media: mediaUrls,
            base64Media: [],
            productType: payload.productType,
            sellerId: auth.userId,
            sellerType: auth.role,
            condition: payload.condition || null,
            quantity: isThrift ? 1 : (payload.quantity || 1),
            isUnique: isThrift,
            hasVariants: !isThrift,
            uniqueCode: payload.uniqueCode,
            sizeChart: payload.sizeChart || null,
            status: 'active'
        })

        await newProduct.save()
        await mongoose.model('User').updateOne({ _id: auth.userId }, { $inc: { 'sellerProfile.totalProducts': 1 } })

        return response(true, 200, 'Product added successfully.', { 
            productId: newProduct._id, 
            uniqueCode: newProduct.uniqueCode 
        })

    } catch (error) {
        console.error('❌ POST product error:', error)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0]
            return response(false, 400, `${field === 'slug' ? 'Slug' : 'SKU'} already exists.`)
        }
        return catchError(error)
    }
}

export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const payload = await request.json()
        
        if (!id) return response(false, 400, 'Product ID is required.')
        
        const product = await ProductModel.findById(id)
        if (!product) return response(false, 404, 'Product not found.')
        
        if (payload.name) product.name = payload.name
        if (payload.slug) product.slug = payload.slug
        if (payload.category) product.category = payload.category
        if (payload.mrp !== undefined) product.mrp = payload.mrp
        if (payload.sellingPrice !== undefined) product.sellingPrice = payload.sellingPrice
        if (payload.description) product.description = encode(payload.description)
        if (payload.status) product.status = payload.status
        if (payload.condition !== undefined) product.condition = payload.condition
        if (payload.sizeChart) product.sizeChart = payload.sizeChart
        if (payload.uniqueCode) product.uniqueCode = payload.uniqueCode
        
        if (payload.media && Array.isArray(payload.media)) {
            const mediaUrls = []
            for (const mediaItem of payload.media) {
                if (!mediaItem) continue

                let imageData = null
                if (typeof mediaItem === 'string') {
                    imageData = mediaItem
                } else if (mediaItem?.secure_url) {
                    imageData = mediaItem.secure_url
                }

                if (!imageData) continue

                if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
                    try {
                        const uploadResult = await uploadImageToCloudinary(imageData, 'thriftyatra/products')
                        mediaUrls.push(uploadResult.secure_url)
                    } catch (err) {
                        console.error('Cloudinary upload failed:', err)
                    }
                } else {
                    mediaUrls.push(imageData)
                }
            }

            if (mediaUrls.length > 0) {
                product.media = mediaUrls
            }
        }
        
        if (payload.mrp && payload.sellingPrice) {
            product.discountPercentage = Math.round(((payload.mrp - payload.sellingPrice) / payload.mrp) * 100)
        }
        
        await product.save()
        return response(true, 200, 'Product updated successfully.', product)
        
    } catch (error) {
        console.error('❌ PUT product error:', error)
        return catchError(error)
    }
}

export async function DELETE(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        await connectDB()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        if (!id) return response(false, 400, 'Product ID is required.')
        
        const product = await ProductModel.findById(id)
        if (!product) return response(false, 404, 'Product not found.')
        
        product.deletedAt = new Date()
        product.status = 'inactive'
        await product.save()
        
        return response(true, 200, 'Product deleted successfully.')
        
    } catch (error) {
        console.error('❌ DELETE product error:', error)
        return catchError(error)
    }
}