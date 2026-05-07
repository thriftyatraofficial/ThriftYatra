import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }
        
        await connectDB()
        const { ids, deleteType } = await request.json()
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return response(false, 400, 'No products selected.')
        }
        
        if (deleteType === 'SD') {
            await ProductModel.updateMany(
                { _id: { $in: ids } },
                { deletedAt: new Date(), status: 'inactive' }
            )
            return response(true, 200, `${ids.length} product(s) moved to trash.`)
        } else if (deleteType === 'PD') {
            await ProductModel.deleteMany({ _id: { $in: ids } })
            return response(true, 200, `${ids.length} product(s) permanently deleted.`)
        } else if (deleteType === 'RSD') {
            await ProductModel.updateMany(
                { _id: { $in: ids } },
                { deletedAt: null, status: 'active' }
            )
            return response(true, 200, `${ids.length} product(s) restored.`)
        }
        
        return response(false, 400, 'Invalid delete type.')
        
    } catch (error) {
        console.error('Delete products error:', error)
        return catchError(error)
    }
}