import mongoose from "mongoose";

const platformPlanSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, unique: true },
    monthlyPrice: { type: Number, required: true, min: 0 },
    yearlyPrice: { type: Number, required: true, min: 0 },
    maxMembers: { type: Number, required: true, min: 1 },
    features: { type: [String], default: [] },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
}, { timestamps: true, toJSON: { virtuals: true } });

export default mongoose.model("PlatformPlan", platformPlanSchema);
