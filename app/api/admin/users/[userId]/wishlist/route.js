import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import mongoose from "mongoose"

// Note: You may need to create a Wishlist model if not exists
export async function GET(request, { params }) {
    try {
        const auth = await isAuthenticated(['admin'])
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.')
        
        // If you don't have a wishlist model, return empty array
        return response(true, 200, 'Wishlist fetched.', [])
    } catch (error) {
        return catchError(error)
    }
}