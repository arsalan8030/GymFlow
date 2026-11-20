import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", default: null, index: true },
    action: { type: String, required: true },
    entityType: { type: String, default: "" },
    entityId: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } });

export default mongoose.model("AuditLog", auditLogSchema);
