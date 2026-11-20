import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
    name: { type: String, required: true, trim: true },
    durationDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    benefits: { type: [String], default: [] },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
}, { timestamps: true, toJSON: { virtuals: true } });

membershipPlanSchema.index({ gymId: 1, name: 1 }, { unique: true });

export default mongoose.model("MembershipPlan", membershipPlanSchema);
