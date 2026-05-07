import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    productType: {
        type: String,
        enum: ['thrift', 'brand_new'],
        required: true,
        default: 'brand_new'
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sellerType: {
        type: String,
        enum: ['thrift_seller', 'brand_seller', 'admin'],
        required: true
    },
    uniqueCode: {
        type: String,
        unique: true,
        sparse: true
    },
    condition: {
        type: String,
        enum: ['like_new', 'excellent', 'good', 'fair', null],
        default: null
    },
    isUnique: {
        type: Boolean,
        default: false
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    },
    hasVariants: {
        type: Boolean,
        default: false
    },
    mrp: {
        type: Number,
        required: true,
    },
    sellingPrice: {
        type: Number,
        required: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
    media: [{
        type: String,
        required: false
    }],
    base64Media: [{
        secure_url: String,
        public_id: String,
        alt: String,
        isBase64: { type: Boolean, default: true }
    }],
    sizeChart: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'sold_out', 'inactive'],
        default: 'active'
    },
    views: {
        type: Number,
        default: 0
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
productSchema.index({ category: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ status: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ deletedAt: 1 });

// Virtual field to get display media (handles both media and base64Media)
productSchema.virtual('displayMedia').get(function() {
    const images = [];
    
    const formatImage = (img) => {
        if (typeof img === 'string') {
            return { secure_url: img };
        }
        return img;
    };
    
    if (this.base64Media && this.base64Media.length > 0) {
        return this.base64Media.map(formatImage);
    }
    if (this.media && this.media.length > 0) {
        return this.media.map(formatImage);
    }
    return [];
});

// Auto-generate uniqueCode if not provided
productSchema.pre('save', async function(next) {
    if (!this.uniqueCode) {
        const prefix = this.productType === 'thrift' ? 'TH' : 'BN';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.uniqueCode = `${prefix}${timestamp}${random}`;
    }
    next();
});

const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');
export default ProductModel;