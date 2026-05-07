import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    title: { type: String },
    subtitle: { type: String },
    location: {
        type: String,
        enum: ['carousel_1', 'carousel_2', 'carousel_3', 'carousel_4', 'home_banner_1', 'home_banner_2', 'home_banner_right', 'instagram_feed', 'marquee_text', 'hero_title', 'hero_subtitle', 'logo_light', 'logo_dark', 'favicon'],
        required: true
    },
    mediaType: { type: String, enum: ['image', 'video', 'text'], default: 'image' },
    imageUrl: { type: String },
    videoUrl: { type: String },
    posterUrl: { type: String },
    base64Image: { type: String },
    base64Poster: { type: String },
    videoSettings: {
        autoplay: { type: Boolean, default: true },
        loop: { type: Boolean, default: true },
        muted: { type: Boolean, default: true },
        controls: { type: Boolean, default: false },
    },
    textContent: { type: String },
    link: { type: String, default: '#' },
    buttonText: { type: String, default: 'Shop Now' },
    size: {
        type: String,
        enum: ['small', 'medium', 'large', 'full', 'custom'],
        default: 'medium'
    },
    customWidth: { type: Number },
    customHeight: { type: Number },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });

bannerSchema.index({ location: 1 });
bannerSchema.index({ isActive: 1 });
bannerSchema.index({ deletedAt: 1 });

const BannerModel = mongoose.models.Banner || mongoose.model('Banner', bannerSchema, 'banners');
export default BannerModel;