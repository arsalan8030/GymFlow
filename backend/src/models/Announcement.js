import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true },
    expiryDate: { type: Date, default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
}, { timestamps: true, toJSON: { virtuals: true } });

announcementSchema.index({ gymId: 1, status: 1, createdAt: -1 });

export default mongoose.model("Announcement", announcementSchema);
