import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", default: null, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true } });

notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
