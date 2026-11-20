import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "MembershipPlan", default: null },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    totalFee: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["ACTIVE", "EXPIRED", "CANCELLED"], default: "ACTIVE", index: true }
}, { timestamps: true, toJSON: { virtuals: true } });

membershipSchema.index({ gymId: 1, memberId: 1, createdAt: -1 });

export default mongoose.model("Membership", membershipSchema);
