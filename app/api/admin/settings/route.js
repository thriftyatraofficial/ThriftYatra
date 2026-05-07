import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import SettingsModel from "@/models/Settings.model";

export async function GET(request) {
    try {
        await connectDB();
        
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'all';

        if (type !== 'cod') {
            const auth = await isAuthenticated('admin');
            if (!auth.isAuth) return response(false, 403, 'Unauthorized.');
        }
        
        let settings;
        if (type === 'all') {
            settings = await SettingsModel.find({ isActive: true }).lean();
        } else {
            settings = await SettingsModel.findOne({ type, isActive: true }).lean();
        }
        
        return response(true, 200, 'Settings fetched.', settings);
    } catch (error) { return catchError(error); }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin');
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.');
        await connectDB();
        const payload = await request.json();
        const { type, data } = payload;
        
        if (!type || !data) return response(false, 400, 'Type and data are required.');
        
        // Deactivate old settings of same type
        await SettingsModel.updateMany({ type }, { isActive: false });
        
        const setting = new SettingsModel({ type, data, updatedBy: auth.userId });
        await setting.save();
        
        return response(true, 200, 'Settings saved.', setting);
    } catch (error) { return catchError(error); }
}
