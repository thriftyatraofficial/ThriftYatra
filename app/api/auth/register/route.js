import { connectDB } from '@/lib/databaseConnection';
import { setAuthCookie } from '@/lib/authCookie';
import { catchError, response } from '@/lib/helperFunction';
import { getJwtSecret } from '@/lib/jwtSecret';
import UserModel from '@/models/User.model';
import OTPModel from '@/models/Otp.model';
import { SignJWT } from 'jose';

export async function POST(request) {
    try {
        await connectDB();
        const { name, email, password, otp } = await request.json();

        if (!name || !email || !password || !otp) 
            return response(false, 400, 'All fields required.');

        const cleanEmail = email.toLowerCase().trim();

        // Verify OTP
        const otpRecord = await OTPModel.findOne({ email: cleanEmail, otp });
        if (!otpRecord) return response(false, 400, 'Invalid or expired OTP.');

        // Check existing user
        const exists = await UserModel.findOne({ email: cleanEmail });
        if (exists) return response(false, 400, 'Email already registered.');

        // Create user
        const user = await UserModel.create({
            name,
            email: cleanEmail,
            password,
            role: 'user',
            emailVerified: true
        });

        await otpRecord.deleteOne();

        // ✅ Generate JWT token for auto-login
        const loggedInUserData = {
            _id: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email,
            phone: user.phone,
        };

        const secret = getJwtSecret();
        const token = await new SignJWT(loggedInUserData)
            .setIssuedAt()
            .setExpirationTime('24h')
            .setProtectedHeader({ alg: 'HS256' })
            .sign(secret);

        const res = response(true, 201, 'Registration successful!', {
            ...loggedInUserData,
            redirectUrl: '/',
        });
        return setAuthCookie(res, token);

    } catch (error) {
        return catchError(error);
    }
}
