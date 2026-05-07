import { setAuthCookie } from "@/lib/authCookie";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, generateOTP, response } from "@/lib/helperFunction";
import { getJwtSecret } from "@/lib/jwtSecret";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import OTPModel from "@/models/Otp.model";
import UserModel from "@/models/User.model";
import { SignJWT } from "jose";

export async function POST(request) {
    try {
        await connectDB();
        const { action, phone, otp } = await request.json();
        const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

        if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
            return response(false, 400, 'Valid 10-digit phone number required.');
        }

        if (action === 'send') {
            const user = await UserModel.findOne({ deletedAt: null, phone: cleanPhone });
            if (!user) return response(false, 404, 'No account found with this phone number.');

            if (user.role === 'thrift_seller' || user.role === 'brand_seller') {
                if (user.sellerProfile?.approvalStatus !== 'approved') {
                    return response(false, 403, 'Your seller account is pending admin approval.');
                }
                if (user.sellerProfile?.isActive === false) {
                    return response(false, 403, 'Your seller account has been suspended.');
                }
            }

            const lastOTP = await OTPModel.findOne({ phone: cleanPhone }).sort({ createdAt: -1 });
            if (lastOTP) {
                const elapsed = Date.now() - new Date(lastOTP.createdAt).getTime();
                if (elapsed < 60000) return response(false, 429, `Wait ${Math.ceil((60000 - elapsed) / 1000)}s before requesting another OTP.`);
            }

            await OTPModel.deleteMany({ phone: cleanPhone });
            const generatedOTP = generateOTP();
            const sendResult = await sendWhatsAppTemplate(cleanPhone, 'otp_verification', { otp: generatedOTP });
            if (!sendResult.success) return response(false, 502, sendResult.message || 'Could not send OTP.');
            await OTPModel.create({ phone: cleanPhone, otp: generatedOTP });

            return response(true, 200, 'OTP sent successfully.', { phone: cleanPhone });
        }

        if (action === 'verify') {
            if (!otp) return response(false, 400, 'Phone and OTP are required.');

            const cleanOtp = String(otp).replace(/\D/g, '');
            const otpRecord = await OTPModel.findOne({
                $or: [{ phone: cleanPhone }, { phone: `+91${cleanPhone}` }],
                otp: cleanOtp
            });

            if (!otpRecord) return response(false, 404, 'Invalid or expired OTP.');

            const user = await UserModel.findOne({
                deletedAt: null,
                $or: [{ phone: cleanPhone }, { phone: `+91${cleanPhone}` }]
            }).lean();

            if (!user) return response(false, 404, 'User not found.');

            if (!user.phoneVerified) {
                await UserModel.updateOne({ _id: user._id }, { phoneVerified: true });
            }

            if (user.role === 'thrift_seller' || user.role === 'brand_seller') {
                if (user.sellerProfile?.approvalStatus !== 'approved') {
                    return response(false, 403, 'Your seller account is pending admin approval.');
                }
                if (!user.sellerProfile?.isActive) {
                    return response(false, 403, 'Your seller account has been suspended.');
                }
            }

            const jwtPayload = {
                _id: user._id.toString(),
                role: user.role,
                name: user.name,
                email: user.email,
                phone: user.phone
            };

            const secret = getJwtSecret();
            const token = await new SignJWT(jwtPayload)
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('24h')
                .sign(secret);

            await OTPModel.deleteMany({ phone: cleanPhone });

            const redirectMap = {
                admin: '/admin/dashboard',
                brand_seller: '/seller/brand/dashboard',
                thrift_seller: '/seller/thrift/dashboard',
                user: '/my-account'
            };
            const redirectUrl = redirectMap[user.role] || '/';

            const res = response(true, 200, 'Login successful.', {
                _id: user._id.toString(),
                role: user.role,
                name: user.name,
                email: user.email,
                phone: user.phone,
                redirectUrl
            });
            return setAuthCookie(res, token);
        }

        return response(false, 400, 'Invalid action. Use "send" or "verify".');
    } catch (error) {
        return catchError(error);
    }
}
