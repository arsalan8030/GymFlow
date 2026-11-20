import mongoose from "mongoose";

const weightLogSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    logDate: { type: Date, default: Date.now },
    weightKg: { type: Number, required: true, min: 1, max: 500 },
    notes: { type: String, default: "" }
}, { timestamps: true, toJSON: { virtuals: true } });

weightLogSchema.index({ memberId: 1, logDate: 1 });

export default mongoose.model("WeightLog", weightLogSchema);
