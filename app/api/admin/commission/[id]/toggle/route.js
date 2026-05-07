import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import CommissionSettingsModel from "@/models/CommissionSettings.model"

export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        const { id } = await params
        const { isActive } = await request.json()
        await CommissionSettingsModel.findByIdAndUpdate(id, { isActive })
        return response(true, 200, 'Status updated.')
    } catch (error) { return catchError(error) }
}