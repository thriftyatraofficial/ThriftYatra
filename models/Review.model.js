import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    images: [{
        secure_url: String,
        public_id: String
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    helpful: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reported: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

// Index for better query performance
reviewSchema.index({ user: 1, product: 1 })
reviewSchema.index({ product: 1, rating: -1 })
reviewSchema.index({ deletedAt: 1 })

// Virtual for average rating calculation
reviewSchema.statics.getAverageRating = async function(productId) {
    const result = await this.aggregate([
        { $match: { product: productId, deletedAt: null } },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ])
    return result[0] || { averageRating: 0, totalReviews: 0 }
}

const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema)

export default ReviewModel