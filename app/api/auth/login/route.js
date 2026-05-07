import { connectDB } from "@/lib/databaseConnection";
import { setAuthCookie } from "@/lib/authCookie";
import { catchError, response } from "@/lib/helperFunction";
import { getJwtSecret } from "@/lib/jwtSecret";
import { hashPassword, isPasswordHash, verifyPassword } from "@/lib/password";
import UserModel from "@/models/User.model";
import { SignJWT } from "jose";

export async function POST(request) {
    try {
        await connectDB();
        const { email, password } = await request.json();

        if (!email || !password) return response(false, 400, 'Email and password required.');

        const user = await UserModel.findOne({ deletedAt: null, email: email.toLowerCase() }).select('+password').lean();
        if (!user) return response(false, 404, 'No account found.');

        const passwordValid = await verifyPassword(password, user.password);
        if (!passwordValid) return response(false, 401, 'Invalid password.');

        if (!isPasswordHash(user.password)) {
            await UserModel.updateOne({ _id: user._id }, { $set: { password: await hashPassword(password) } });
        }

        if ((user.role === 'thrift_seller' || user.role === 'brand_seller')) {
            if (user.sellerProfile?.approvalStatus !== 'approved')
                return response(false, 403, 'Seller account pending approval.');
            if (user.sellerProfile?.isActive === false)
                return response(false, 403, 'Seller account suspended.');
        }

        const loggedInUserData = {
            _id: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            sellerId: user.sellerId || null,
            sellerProfile: user.sellerProfile || null
        };

        const secret = getJwtSecret();
        const token = await new SignJWT(loggedInUserData)
            .setIssuedAt().setExpirationTime('24h')
            .setProtectedHeader({ alg: 'HS256' }).sign(secret);

        let redirectUrl = '/';
        if (user.role === 'admin') redirectUrl = '/admin/dashboard';
        else if (user.role === 'thrift_seller') redirectUrl = '/seller/thrift/dashboard';
        else if (user.role === 'brand_seller') redirectUrl = '/seller/brand/dashboard';

        const res = response(true, 200, 'Login successful.', { ...loggedInUserData, redirectUrl });
        return setAuthCookie(res, token);
    } catch (error) {
        console.error('Login error:', error);
        return catchError(error);
    }
}
