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
        const payload = await request.json()
        const setting = await CommissionSettingsModel.findByIdAndUpdate(id, payload, { new: true })
        return response(true, 200, 'Commission updated.', setting)
    } catch (error) { return catchError(error) }
}

export async function DELETE(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        await connectDB()
        const { id } = await params
        await CommissionSettingsModel.findByIdAndDelete(id)
        return response(true, 200, 'Commission deleted.')
    } catch (error) { return catchError(error) }
}