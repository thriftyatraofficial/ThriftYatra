import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import UserModel from "@/models/User.model";

export async function PUT(request) {
    try {
        const auth = await isAuthenticated(['user', 'admin', 'thrift_seller', 'brand_seller']);
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.');

        await connectDB();
        const { name, email, phone } = await request.json();

        const updateData = {};
        if (name) updateData.name = name;
        if (email !== undefined) updateData.email = email?.toLowerCase().trim() || null;
        if (phone !== undefined) updateData.phone = phone ? String(phone).replace(/\D/g, '').slice(-10) : null;

        await UserModel.updateOne({ _id: auth.userId }, { $set: updateData });

        return response(true, 200, 'Profile updated.');
    } catch (error) { return catchError(error); }
}
