import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true, index: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    attendanceDate: { type: Date, required: true, index: true },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    status: { type: String, enum: ["PRESENT", "ABSENT"], default: "PRESENT" }
}, { timestamps: true, toJSON: { virtuals: true } });

attendanceSchema.index({ gymId: 1, memberId: 1, attendanceDate: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
