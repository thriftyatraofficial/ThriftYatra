import mongoose from "mongoose";

const commissionSettingsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: 'Default Commission'
    },
    rate: {
        type: Number,
        required: true,
        default: 10,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicableTo: {
        type: String,
        enum: ['all', 'thrift', 'brand_new'],
        default: 'all'
    }
}, { timestamps: true });

const CommissionSettingsModel = mongoose.models.CommissionSettings || mongoose.model('CommissionSettings', commissionSettingsSchema, 'commissionsettings');
export default CommissionSettingsModel;