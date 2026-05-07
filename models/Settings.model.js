import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['cod', 'commission', 'general', 'shipping'],
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

settingsSchema.index({ type: 1, isActive: 1 });

const SettingsModel = mongoose.models.Settings || mongoose.model('Settings', settingsSchema, 'settings');
export default SettingsModel;