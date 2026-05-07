import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import ContentPageModel from "@/models/ContentPage.model";

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { slug } = await params;
        
        // Try DB first
        const dbPage = await ContentPageModel.findOne({ slug, isPublished: true }).lean();
        if (dbPage) return response(true, 200, 'Page found.', dbPage);
        
        return response(false, 404, 'Page not found.');
    } catch (error) { return catchError(error); }
}