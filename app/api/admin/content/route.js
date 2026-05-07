import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import ContentPageModel from "@/models/ContentPage.model";

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin');
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.');
        await connectDB();
        
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');
        
        if (slug) {
            const page = await ContentPageModel.findOne({ slug, isPublished: true }).lean();
            return response(true, 200, 'Page found.', page);
        }
        
        const pages = await ContentPageModel.find({}).sort({ slug: 1 }).lean();
        return response(true, 200, 'Pages fetched.', pages);
    } catch (error) { return catchError(error); }
}

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin');
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.');
        await connectDB();
        const payload = await request.json();
        const { slug, title, content } = payload;
        
        if (!slug || !title || !content) return response(false, 400, 'Slug, title and content are required.');
        
        const page = await ContentPageModel.findOneAndUpdate(
            { slug },
            { title, content, updatedBy: auth.userId, isPublished: true },
            { upsert: true, new: true }
        );
        
        return response(true, 200, 'Page saved.', page);
    } catch (error) { return catchError(error); }
}