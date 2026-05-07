import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import CategoryModel from "@/models/Category.model"

export async function GET(request) {
    try {
        await connectDB()
        
        const categories = await CategoryModel.find({ deletedAt: null })
            .select('_id name slug')
            .sort({ name: 1 })
            .lean()
        
        return response(true, 200, 'Categories fetched', categories)
        
    } catch (error) {
        return catchError(error)
    }
}