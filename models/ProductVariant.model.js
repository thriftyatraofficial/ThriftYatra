import mongoose from "mongoose";

const ProductVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    color: {
        type: String,
        required: true,
        trim: true,
    },
    size: {
        type: String,
        required: true,
        trim: true
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
        default: 0,
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        sparse: true  // ✅ Added sparse to allow null values gracefully
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0
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
    status: {
        type: String,
        enum: ['active', 'out_of_stock', 'inactive'],
        default: 'active'
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Indexes
ProductVariantSchema.index({ product: 1 });
ProductVariantSchema.index({ sellerId: 1 });
// ✅ REMOVED duplicate sku index - unique:true in field already creates one
ProductVariantSchema.index({ deletedAt: 1 });

const ProductVariantModel = mongoose.models.ProductVariant || mongoose.model('ProductVariant', ProductVariantSchema, 'productvariants');
export default ProductVariantModel;