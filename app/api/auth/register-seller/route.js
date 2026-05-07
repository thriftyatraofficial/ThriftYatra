import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import UserModel from "@/models/User.model";
import { z } from "zod";

export async function POST(request) {
    try {
        await connectDB();
        const payload = await request.json();

        const validationSchema = z.object({
            name: z.string().min(2, 'Name required'),
            email: z.string().email('Invalid email'),
            password: z.string().min(6, 'Password must be 6+ characters'),
            phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit number required'),
            sellerType: z.enum(['thrift_seller', 'brand_seller']),
            storeName: z.string().min(3, 'Store name required'),
            storeDescription: z.string().optional()
        });

        const validatedData = validationSchema.safeParse(payload);
        if (!validatedData.success) {
            return response(false, 401, 'Invalid input.', validatedData.error);
        }

        const { name, email, password, phone, sellerType, storeName, storeDescription } = validatedData.data;
        const cleanEmail = email.toLowerCase().trim();
        const cleanPhone = phone.replace(/\D/g, '');

        // Check email
        const emailExists = await UserModel.findOne({ email: cleanEmail, deletedAt: null });
        if (emailExists) return response(false, 400, 'Email already registered.');

        // Check phone
        const phoneExists = await UserModel.findOne({ phone: cleanPhone, deletedAt: null });
        if (phoneExists) return response(false, 400, 'Phone already registered.');

        // Create seller
        const newSeller = new UserModel({
            name,
            email: cleanEmail,
            password,
            phone: cleanPhone,
            role: sellerType,
            emailVerified: true,
            phoneVerified: false,
            sellerProfile: {
                storeName,
                storeDescription: storeDescription || '',
                approvalStatus: 'pending',
                isVerified: false,
                isActive: true
            }
        });

        await newSeller.save();
        return response(true, 200, 'Seller account created! Wait for admin approval.');

    } catch (error) {
        return catchError(error);
    }
}