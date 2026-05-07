import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
    // Cloud storage fields (existing)
    secure_url: {
        type: String,
        default: null
    },
    public_id: {
        type: String,
        default: null
    },

    // Local storage fields (new)
    filename: {
        type: String,
        default: null
    },
    originalName: {
        type: String,
        default: null
    },
    url: {
        type: String,
        default: null // Local path like /uploads/filename.jpg
    },
    size: {
        type: Number,
        default: 0
    },
    mimeType: {
        type: String,
        default: null
    },
    resourceType: {
        type: String,
        enum: ['image', 'video', 'raw'],
        default: 'image'
    },

    // Base64 data (for direct storage)
    base64Data: {
        type: String,
        default: null
    },

    // Common fields
    alt: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    isBase64: {
        type: Boolean,
        default: false
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Define indexes
mediaSchema.index({ deletedAt: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ filename: 1 });

// Virtual for getting the display URL
mediaSchema.virtual('displayUrl').get(function() {
    if (this.url) return this.url;
    if (this.secure_url) return this.secure_url;
    if (this.base64Data) return this.base64Data;
    return null;
});

const MediaModel = mongoose.models.Media || mongoose.model('Media', mediaSchema, 'media');
export default MediaModel;