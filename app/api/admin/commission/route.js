import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import CommissionSettingsModel from "@/models/CommissionSettings.model"

export async function GET() {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        const settings = await CommissionSettingsModel.find().sort({ createdAt: -1 })
        return response(true, 200, 'Commission settings fetched.', settings)
    } catch (error) { return catchError(error) }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        const payload = await request.json()
        const setting = new CommissionSettingsModel(payload)
        await setting.save()
        return response(true, 201, 'Commission setting created.', setting)
    } catch (error) { return catchError(error) }
}