import { connectDB } from "@/lib/databaseConnection";
import { setAuthCookie } from "@/lib/authCookie";
import { catchError, response } from "@/lib/helperFunction";
import { getJwtSecret } from "@/lib/jwtSecret";
import OTPModel from "@/models/Otp.model";
import UserModel from "@/models/User.model";
import { SignJWT } from "jose";

export async function POST(request) {
    try {
        await connectDB();
        const payload = await request.json();
        const { email, phone, otp } = payload;

        if (!otp) return response(false, 400, 'OTP required.');

        let getUser, getOtpData;

        // ✅ Email OTP verification
        if (email) {
            getOtpData = await OTPModel.findOne({ email: email.toLowerCase(), otp });
            if (!getOtpData) return response(false, 404, 'Invalid or expired OTP.');
            getUser = await UserModel.findOne({ deletedAt: null, email: email.toLowerCase() }).lean();
        }
        // ✅ Phone OTP verification (checkout)
        else if (phone) {
            getOtpData = await OTPModel.findOne({ phone, otp });
            if (!getOtpData) return response(false, 404, 'Invalid or expired OTP.');
            getUser = await UserModel.findOne({ deletedAt: null, phone }).lean();
        } else {
            return response(false, 400, 'Email or phone required.');
        }

        if (!getUser) return response(false, 404, 'User not found.');

        // For phone verification, mark as verified
        if (phone && !getUser.phoneVerified) {
            await UserModel.updateOne({ _id: getUser._id }, { phoneVerified: true });
        }

        // Seller checks
        if ((getUser.role === 'thrift_seller' || getUser.role === 'brand_seller')) {
            if (getUser.sellerProfile?.approvalStatus !== 'approved')
                return response(false, 403, 'Seller account pending approval.');
            if (getUser.sellerProfile?.isActive === false)
                return response(false, 403, 'Seller account suspended.');
        }

        const loggedInUserData = {
            _id: getUser._id.toString(),
            role: getUser.role,
            name: getUser.name,
            email: getUser.email,
            phone: getUser.phone,
            avatar: getUser.avatar,
            sellerId: getUser.sellerId || null,
            sellerProfile: getUser.sellerProfile || null
        };

        const secret = getJwtSecret();
        const token = await new SignJWT(loggedInUserData)
            .setIssuedAt().setExpirationTime('24h')
            .setProtectedHeader({ alg: 'HS256' }).sign(secret);

        await getOtpData.deleteOne();

        let redirectUrl = '/';
        if (getUser.role === 'admin') redirectUrl = '/admin/dashboard';
        else if (getUser.role === 'thrift_seller') redirectUrl = '/seller/thrift/dashboard';
        else if (getUser.role === 'brand_seller') redirectUrl = '/seller/brand/dashboard';

        const res = response(true, 200, 'Login successful.', { ...loggedInUserData, redirectUrl });
        return setAuthCookie(res, token);
    } catch (error) {
        console.error('Login error:', error);
        return catchError(error);
    }
}
