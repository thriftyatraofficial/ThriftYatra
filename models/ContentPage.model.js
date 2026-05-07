import mongoose from "mongoose";

const contentPageSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        enum: ['about-us', 'shipping-policy', 'return-policy', 'privacy-policy', 'terms-and-conditions', 'shipping-returns']
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const ContentPageModel = mongoose.models.ContentPage || mongoose.model('ContentPage', contentPageSchema, 'contentpages');
export default ContentPageModel;
