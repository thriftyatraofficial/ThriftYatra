import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { zSchema } from "@/lib/zodSchema";
import UserModel from "@/models/User.model";

export async function POST(request) {
    try {
        const auth = await isAuthenticated(['admin']);
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.');
        }

        await connectDB();
        const payload = await request.json();

        const validationSchema = zSchema.pick({
            userId: true
        }).extend({
            sellerType: z.enum(['thrift_seller', 'brand_seller']),
            storeName: z.string().min(3, 'Store name is required')
        });

        const validatedData = validationSchema.safeParse(payload);
        if (!validatedData.success) {
            return response(false, 400, 'Invalid input.', validatedData.error);
        }

        const { userId, sellerType, storeName } = validatedData.data;

        const user = await UserModel.findById(userId);
        if (!user) {
            return response(false, 404, 'User not found.');
        }

        if (user.role !== 'user') {
            return response(false, 400, 'User is already a seller or admin.');
        }

        // Promote to seller
        user.role = sellerType;
        user.sellerProfile = {
            storeName,
            approvalStatus: 'approved',
            isVerified: true,
            isActive: true
        };

        await user.save();

        return response(true, 200, `User promoted to ${sellerType} successfully.`, {
            sellerId: user.sellerId
        });

    } catch (error) {
        return catchError(error);
    }
}