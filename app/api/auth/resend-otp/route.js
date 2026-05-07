import { connectDB } from "@/lib/databaseConnection";
import { catchError, generateOTP, response } from "@/lib/helperFunction";
import OTPModel from "@/models/Otp.model";
import UserModel from "@/models/User.model";
import { sendMail } from "@/lib/sendMail";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { otpEmail } from "@/email/otpEmail";

const OTP_RESEND_WINDOW_MS = 60 * 1000;

async function enforceOTPCooldown(filter) {
    const lastOTP = await OTPModel.findOne(filter).sort({ createdAt: -1 });
    if (!lastOTP) return null;

    const elapsed = Date.now() - new Date(lastOTP.createdAt).getTime();
    if (elapsed < OTP_RESEND_WINDOW_MS) {
        return `Wait ${Math.ceil((OTP_RESEND_WINDOW_MS - elapsed) / 1000)}s before resending.`;
    }

    return null;
}

export async function POST(request) {
    try {
        await connectDB();
        const { email, phone } = await request.json();

        if (email) {
            const cleanEmail = email.toLowerCase().trim();
            const user = await UserModel.findOne({ deletedAt: null, email: cleanEmail });
            if (!user) return response(false, 404, 'User not found.');

            const cooldownMessage = await enforceOTPCooldown({ email: cleanEmail });
            if (cooldownMessage) return response(false, 429, cooldownMessage);

            await OTPModel.deleteMany({ email: cleanEmail });
            const OTP = generateOTP();
            const mailResult = await sendMail("Your ThriftYatra OTP", cleanEmail, otpEmail(OTP));
            if (!mailResult.success) return response(false, 502, 'Could not send OTP email. Please try again.');
            await new OTPModel({ email: cleanEmail, otp: OTP }).save();

            return response(true, 200, 'OTP resent to your email!');
        }

        if (phone) {
            const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
            if (!/^[6-9]\d{9}$/.test(cleanPhone)) return response(false, 400, 'Valid phone number required.');

            const cooldownMessage = await enforceOTPCooldown({ phone: cleanPhone });
            if (cooldownMessage) return response(false, 429, cooldownMessage);

            await OTPModel.deleteMany({ phone: cleanPhone });
            const OTP = generateOTP();
            const sendResult = await sendWhatsAppTemplate(cleanPhone, 'otp_verification', { otp: OTP });
            if (!sendResult.success) return response(false, 502, sendResult.message || 'Could not send OTP.');
            await new OTPModel({ phone: cleanPhone, otp: OTP }).save();

            return response(true, 200, 'OTP resent!');
        }

        return response(false, 400, 'Email or phone required.');
    } catch (error) {
        return catchError(error);
    }
}
