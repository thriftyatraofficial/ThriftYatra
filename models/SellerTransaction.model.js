import mongoose from "mongoose";

const sellerTransactionSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    type: {
        type: String,
        enum: ['credit', 'debit', 'payout'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    payoutReference: {
        type: String
    }
}, { timestamps: true });

const SellerTransactionModel = mongoose.models.SellerTransaction || mongoose.model('SellerTransaction', sellerTransactionSchema, 'sellertransactions');
export default SellerTransactionModel;