import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    memberId: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true, maxlength: 150 },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, default: "" },
    address: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    joiningDate: { type: Date, default: Date.now },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer", default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "ACTIVE", index: true },
    notes: { type: String, default: "" }
}, { timestamps: true, toJSON: { virtuals: true } });

memberSchema.index({ gymId:  1, memberId: 1 }, { unique: true });
memberSchema.index({ gymId: 1, fullName: 1 });
memberSchema.index({ gymId: 1, email: 1 }, { partialFilterExpression: { email: { $type: "string", $gt: "" } } });

export default mongoose.model("Member", memberSchema);
