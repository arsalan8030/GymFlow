import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", default: null, index: true },
    loginId: { type: String, required: true, trim: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String, select: false, default: null },
    role: { type: String, enum: ["SUPER_ADMIN", "OWNER", "MEMBER"], required: true },
    status: { type: String, enum: ["INVITED", "ACTIVE", "SUSPENDED"], default: "INVITED", index: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.index({ loginId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ gymId: 1, role: 1 });

export default mongoose.model("User", userSchema);
