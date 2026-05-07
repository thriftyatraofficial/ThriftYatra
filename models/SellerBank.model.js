import mongoose from "mongoose";

const sellerBankSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    accountHolderName: {
        type: String,
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    confirmAccountNumber: {
        type: String,
        required: true
    },
    ifscCode: {
        type: String,
        required: true
    },
    upiId: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const SellerBankModel = mongoose.models.SellerBank || mongoose.model('SellerBank', sellerBankSchema, 'sellerbanks');
export default SellerBankModel;