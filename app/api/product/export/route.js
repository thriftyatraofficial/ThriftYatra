import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"

export async function GET(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }
        
        await connectDB()
        
        const filter = { deletedAt: null }
        
        const products = await ProductModel.find(filter)
            .populate('category', 'name')
            .populate('sellerId', 'name sellerId sellerProfile')
            .sort({ createdAt: -1 })
            .lean()
        
        const exportData = products.map(p => ({
            ID: p._id.toString(),
            Name: p.name,
            SKU: p.uniqueCode || '—',
            Type: p.productType === 'thrift' ? 'Thrift' : 'Brand New',
            Category: p.category?.name || '—',
            Seller: p.sellerId?.sellerProfile?.storeName || p.sellerId?.name || '—',
            'Seller ID': p.sellerId?.sellerId || '—',
            MRP: p.mrp,
            'Selling Price': p.sellingPrice,
            'Discount %': p.discountPercentage,
            Status: p.status,
            Views: p.views || 0,
            Created: new Date(p.createdAt).toLocaleDateString('en-IN')
        }))
        
        return response(true, 200, 'Export data fetched.', exportData)
        
    } catch (error) {
        console.error('Export products error:', error)
        return catchError(error)
    }
}