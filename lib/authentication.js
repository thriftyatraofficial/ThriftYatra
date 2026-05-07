import { jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/jwtSecret";
import { cookies } from "next/headers";

export const isAuthenticated = async (allowedRoles = []) => {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token');

        if (!accessToken) return { isAuth: false, message: 'No token' };
        const { payload } = await jwtVerify(accessToken.value, getJwtSecret());

        if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
            if (!allowedRoles.includes(payload.role)) {
                return { isAuth: false, message: 'Insufficient permissions' };
            }
        } else if (typeof allowedRoles === 'string') {
            if (payload.role !== allowedRoles) {
                return { isAuth: false, message: 'Insufficient permissions' };
            }
        }

        return {
            isAuth: true,
            userId: payload._id,
            _id: payload._id,
            role: payload.role,
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            sellerId: payload.sellerId,
            user: payload
        };
    } catch (error) {
        return { isAuth: false, error: error.message };
    }
};

export const isSellerAuthenticated = async (sellerType = null) => {
    const auth = await isAuthenticated(['admin', 'thrift_seller', 'brand_seller']);

    if (!auth.isAuth) return auth;

    if (sellerType && auth.role !== 'admin' && auth.role !== sellerType) {
        return { isAuth: false, message: `Only ${sellerType} can access this resource` };
    }

    return auth;
};
