import { response } from "@/lib/helperFunction";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('access_token');
        return response(true, 200, 'Logged out successfully.');
    } catch (error) {
        return response(false, 500, 'Logout failed.');
    }
}