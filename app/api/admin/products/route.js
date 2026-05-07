import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['admin']);
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.');
        
        await connectDB();
        const { searchParams } = new URL(request.url);
        const start = parseInt(searchParams.get('start')) || 0;
        const size = parseInt(searchParams.get('size')) || 10;
        const deleteType = searchParams.get('deleteType') || 'SD';
        const globalFilter = searchParams.get('globalFilter') || '';
        const filtersParam = searchParams.get('filters') || '[]';
        const sortingParam = searchParams.get('sorting') || '[]';
        
        const filter = {};
        if (deleteType === 'SD') filter.deletedAt = null;
        else if (deleteType === 'HD') filter.deletedAt = { $ne: null };
        
        if (globalFilter && globalFilter.trim() !== '') {
            filter.$or = [
                { name: { $regex: globalFilter, $options: 'i' } },
                { uniqueCode: { $regex: globalFilter, $options: 'i' } },
                { slug: { $regex: globalFilter, $options: 'i' } }
            ];
        }
        
        let filters = [];
        try { filters = JSON.parse(filtersParam); } catch (e) {}
        filters.forEach(f => {
            if (f.id && f.value !== undefined && f.value !== '') {
                if (f.id === 'productType' || f.id === 'status') {
                    filter[f.id] = f.value;
                } else if (f.id === 'sellingPrice' || f.id === 'mrp' || f.id === 'views') {
                    if (Array.isArray(f.value) && f.value.length === 2) {
                        filter[f.id] = { $gte: f.value[0], $lte: f.value[1] };
                    }
                }
            }
        });
        
        const total = await ProductModel.countDocuments(filter);
        
        let sorting = [];
        try { sorting = JSON.parse(sortingParam); } catch (e) {}
        const sortObj = {};
        if (sorting.length > 0) {
            sorting.forEach(s => { sortObj[s.id] = s.desc ? -1 : 1; });
        } else {
            sortObj.createdAt = -1;
        }
        
        // ✅ FIXED: Don't populate media - return embedded media array as-is
        const products = await ProductModel.find(filter)
            .populate('category', 'name')
            .populate('sellerId', 'name sellerId sellerProfile')
            // ❌ REMOVED: .populate('media', 'secure_url alt')
            .sort(sortObj)
            .skip(start)
            .limit(size)
            .lean();
        
        // ✅ Process products to ensure media is in correct format
        const processedProducts = products.map(product => {
            // If media is array of ObjectIds, we can't populate - just return empty
            // But your products should have embedded base64 media
            if (product.media && Array.isArray(product.media)) {
                // Keep as-is (base64 objects)
                return product;
            }
            return product;
        });
        
        return NextResponse.json({
            success: true,
            statusCode: 200,
            message: 'Products fetched.',
            data: processedProducts,
            meta: { totalRowCount: total }
        });
        
    } catch (error) {
        console.error('❌ GET products error:', error);
        return catchError(error);
    }
}