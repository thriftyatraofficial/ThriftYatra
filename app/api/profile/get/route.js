import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import UserModel from "@/models/User.model";

export async function GET(request) {
    try {
        const auth = await isAuthenticated('user');
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.');

        await connectDB();
        const user = await UserModel.findById(auth.userId).select('-password').lean();

        if (!user) return response(false, 404, 'User not found.');

        return response(true, 200, 'Profile found.', {
            name: user.name,
            phone: user.phone,
            email: user.email,
            avatar: user.avatar
        });

    } catch (error) {
        return catchError(error);
    }
}