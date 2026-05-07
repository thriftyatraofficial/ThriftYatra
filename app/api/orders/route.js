import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import OrderModel from "@/models/Order.model"
import ProductModel from "@/models/Product.model"
import ProductVariantModel from "@/models/ProductVariant.model"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')

        await connectDB()
        const searchParams = request.nextUrl.searchParams
        const start = parseInt(searchParams.get('start') || 0, 10)
        const size = parseInt(searchParams.get('size') || 50, 10)
        const filters = JSON.parse(searchParams.get('filters') || "[]")
        const globalFilter = searchParams.get('globalFilter') || ""
        const sorting = JSON.parse(searchParams.get('sorting') || "[]")
        const deleteType = searchParams.get('deleteType')

        let matchQuery = {}
        if (deleteType === 'SD') matchQuery = { deletedAt: null }
        else if (deleteType === 'PD') matchQuery = { deletedAt: { $ne: null } }

        if (globalFilter) {
            matchQuery["$or"] = [
                { order_id: { $regex: globalFilter, $options: 'i' } },
                { payment_id: { $regex: globalFilter, $options: 'i' } },
                { name: { $regex: globalFilter, $options: 'i' } },
                { phone: { $regex: globalFilter, $options: 'i' } },
                { city: { $regex: globalFilter, $options: 'i' } },
            ]
        }

        filters.forEach(filter => { matchQuery[filter.id] = { $regex: filter.value, $options: 'i' } })

        let sortQuery = {}
        sorting.forEach(sort => { sortQuery[sort.id] = sort.desc ? -1 : 1 })

        const orders = await OrderModel.find(matchQuery)
            .sort(Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 })
            .skip(start)
            .limit(size)
            .lean()

        // ✅ Enrich each order with product/variant data including productType
        const enrichedOrders = []
        for (const order of orders) {
            const enrichedProducts = []
            
            for (const product of order.products) {
                let productData = null
                let variantData = null

                if (product.productId) {
                    productData = await ProductModel.findById(product.productId)
                        .select('uniqueCode media base64Media name productType')
                        .lean()
                }

                if (product.variantId) {
                    variantData = await ProductVariantModel.findById(product.variantId)
                        .select('sku size color media sellingPrice mrp')
                        .lean()
                }

                enrichedProducts.push({
                    ...product,
                    productId: productData ? {
                        _id: product.productId,
                        name: productData.name || product.name || null,
                        uniqueCode: productData.uniqueCode || product.uniqueCode || null,
                        productType: productData.productType || product.productType || null,
                        media: productData.media || [],
                        base64Media: productData.base64Media || []
                    } : product.productId,
                    variantId: variantData ? {
                        _id: product.variantId,
                        sku: variantData.sku || null,
                        size: variantData.size || null,
                        color: variantData.color || null,
                        media: variantData.media || [],
                        sellingPrice: variantData.sellingPrice || null,
                        mrp: variantData.mrp || null
                    } : product.variantId,
                    uniqueCode: productData?.uniqueCode || product.uniqueCode || null
                })
            }

            enrichedOrders.push({
                ...order,
                products: enrichedProducts
            })
        }

        const totalRowCount = await OrderModel.countDocuments(matchQuery)

        return NextResponse.json({
            success: true,
            data: enrichedOrders,
            meta: { totalRowCount }
        })

    } catch (error) {
        return catchError(error)
    }
}