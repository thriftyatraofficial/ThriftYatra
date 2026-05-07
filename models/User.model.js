import mongoose from "mongoose";
import { hashPassword, isPasswordHash, verifyPassword } from "@/lib/password";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        select: false
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'thrift_seller', 'brand_seller'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: null
    },
    sellerId: {
        type: String,
        unique: true,
        sparse: true
    },
    sellerProfile: {
        storeName: { type: String, trim: true },
        storeDescription: { type: String, trim: true },
        storeLogo: { type: String, default: null },
        phone: { type: String, trim: true, default: null },
        whatsapp: { type: String, trim: true, default: null },
        instagram: { type: String, trim: true, default: null },
        approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },
        totalProducts: { type: Number, default: 0 },
        totalSales: { type: Number, default: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        totalReviews: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now }
    },
    addresses: [{
        fullName: String,
        phone: String,
        pincode: String,
        state: String,
        city: String,
        landmark: String,
        address: String,
        isDefault: { type: Boolean, default: false }
    }],
    pickupAddress: {
        fullName: String,
        phone: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    deletedAt: {
        type: Date,
        default: null
    }
}, { 
    timestamps: true 
});

// Indexes
// Note: phone and email indexes are automatically created by unique: true
userSchema.index({ role: 1 });
userSchema.index({ deletedAt: 1 });
userSchema.index({ 'sellerProfile.approvalStatus': 1 });

// Pre-save hook
userSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password && !isPasswordHash(this.password)) {
        this.password = await hashPassword(this.password);
    }

    // Generate sellerId for sellers
    if ((this.role === 'thrift_seller' || this.role === 'brand_seller') && !this.sellerId) {
        const prefix = this.role === 'thrift_seller' ? 'THS' : 'BRS';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.sellerId = `${prefix}${timestamp}${random}`;
    }
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
    if (!this.password) return false;
    return verifyPassword(enteredPassword, this.password);
};

// Virtuals
userSchema.virtual('isSeller').get(function() {
    return this.role === 'thrift_seller' || this.role === 'brand_seller';
});

userSchema.virtual('isApprovedSeller').get(function() {
    return this.isSeller && this.sellerProfile?.approvalStatus === 'approved' && this.sellerProfile?.isActive === true;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const UserModel = mongoose.models.User || mongoose.model('User', userSchema, 'users');
export default UserModel;
