import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    membershipId: { type: mongoose.Schema.Types.ObjectId, ref: "Membership", default: null },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: ["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"], required: true },
    referenceNumber: { type: String, trim: true, default: "" },
    receiptNumber: { type: String, required: true, unique: true },
    paymentDate: { type: Date, default: Date.now, index: true },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["COMPLETED", "REFUNDED", "VOID"], default: "COMPLETED" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true, toJSON: { virtuals: true } });

paymentSchema.index({ gymId: 1, paymentDate: -1 });
paymentSchema.index({ gymId: 1, referenceNumber: 1 }, { unique: true, partialFilterExpression: { referenceNumber: { $type: "string", $gt: "" } } });

export default mongoose.model("Payment", paymentSchema);
