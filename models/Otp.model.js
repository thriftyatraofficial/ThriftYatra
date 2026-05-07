import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        trim: true,
        index: true
    },
    email: {
        type: String,
        trim: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // Auto-delete after 5 minutes
    }
});

// Ensure either phone or email is provided
otpSchema.pre('save', function(next) {
    if (!this.phone && !this.email) {
        next(new Error('Either phone or email is required'));
    }
    next();
});

const OTPModel = mongoose.models.OTP || mongoose.model('OTP', otpSchema, 'otps');
export default OTPModel;