import mongoose from "mongoose";

const sellerPayoutSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'rejected'],
        default: 'pending'
    },
    bankDetails: {
        accountHolderName: String,
        bankName: String,
        accountNumber: String,
        ifscCode: String,
        upiId: String
    },
    processedAt: {
        type: Date
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String
    },
    transactionId: {
        type: String
    }
}, { timestamps: true });

const SellerPayoutModel = mongoose.models.SellerPayout || mongoose.model('SellerPayout', sellerPayoutSchema, 'sellerpayouts');
export default SellerPayoutModel;