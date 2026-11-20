import mongoose from "mongoose";

const gymSchema = new mongoose.Schema({
    gymCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    gymName: { type: String, required: true, trim: true, maxlength: 150 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    ownerName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    pinCode: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
    subscription: {
        planName: { type: String, default: "Starter" },
        startDate: { type: Date, default: Date.now },
        expiryDate: { type: Date, default: () => new Date(Date.now() + 365 * 86400000) },
        status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "EXPIRED"], default: "ACTIVE" }
    }
}, { timestamps: true, toJSON: { virtuals: true } });

gymSchema.index({ gymName: "text", gymCode: "text" });

export default mongoose.model("Gym", gymSchema);
