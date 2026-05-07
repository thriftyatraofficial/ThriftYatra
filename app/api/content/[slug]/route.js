import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import ContentPageModel from "@/models/ContentPage.model";

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { slug } = await params;

        const page = await ContentPageModel.findOne({ 
            slug, 
            isPublished: true 
        }).lean();

        if (!page) {
            return response(false, 404, 'Page not found.');
        }

        return response(true, 200, 'Page found.', page);

    } catch (error) {
        console.error('Content fetch error:', error);
        return catchError(error);
    }
}