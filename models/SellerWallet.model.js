import mongoose from "mongoose";

const sellerWalletSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalEarned: {
        type: Number,
        default: 0
    },
    pendingAmount: {
        type: Number,
        default: 0
    },
    availableBalance: {
        type: Number,
        default: 0
    },
    withdrawnAmount: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const SellerWalletModel = mongoose.models.SellerWallet || mongoose.model('SellerWallet', sellerWalletSchema, 'sellerwallets');
export default SellerWalletModel;