import AuditLog from "../models/AuditLog.js";

export async function recordAudit({ actorUserId, gymId = null, action, entityType = "", entityId = "", details = {}, session }) {
    const [entry] = await AuditLog.create([{
        actorUserId, gymId, action, entityType, entityId: String(entityId), details
    }], session ? { session } : undefined);
    return entry;
}
