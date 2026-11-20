import mongoose from "mongoose";

const trainerSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    specialization: { type: String, default: "" },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number, min: 0, default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
}, { timestamps: true, toJSON: { virtuals: true } });

trainerSchema.index({ gymId: 1, name: 1 });

export default mongoose.model("Trainer", trainerSchema);
