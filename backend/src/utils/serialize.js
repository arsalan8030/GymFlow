const aliases = {
    gymId: "gym_id",
    gymCode: "gym_code",
    gymName: "gym_name",
    ownerName: "owner_name",
    ownerPhone: "owner_phone",
    planName: "plan_name",
    durationDays: "duration_days",
    fullName: "full_name",
    memberId: "member_id",
    userId: "user_id",
    dateOfBirth: "date_of_birth",
    emergencyContact: "emergency_contact",
    joiningDate: "joining_date",
    startDate: "start_date",
    endDate: "end_date",
    totalFee: "total_fee",
    paidAmount: "paid_amount",
    pendingAmount: "pending_amount",
    paymentMethod: "payment_method",
    referenceNumber: "reference_number",
    paymentDate: "payment_date",
    receiptNumber: "receipt_number",
    checkInTime: "check_in_time",
    checkOutTime: "check_out_time",
    attendanceDate: "attendance_date",
    expiryDate: "expiry_date",
    createdAt: "created_at",
    updatedAt: "updated_at",
    logDate: "log_date",
    weightKg: "weight_kg",
    trainerId: "trainer_id",
    weeklySchedule: "weekly_schedule",
    monthlyPrice: "monthly_price",
    yearlyPrice: "yearly_price",
    maxMembers: "max_members",
    actorUserId: "actor_user_id",
    entityType: "entity_type",
    entityId: "entity_id",
    isRead: "is_read"
};

export function serialize(value) {
    if (Array.isArray(value)) return value.map(serialize);
    if (!value || typeof value !== "object" || value instanceof Date) return value;
    if (value._bsontype === "ObjectId") return String(value);
    const source = typeof value.toObject === "function"
        ? value.toObject({ virtuals: true })
        : value;
    const result = {};
    for (const [key, child] of Object.entries(source)) {
        if (key === "__v" || key === "passwordHash" || key === "password_hash") continue;
        const outputKey = key === "_id" ? "id" : (aliases[key] || key);
        result[outputKey] = serialize(child);
    }
    return result;
}

export function memberRow(member, membership = null, plan = null) {
    return {
        ...serialize(member),
        membership_plan: plan?.name || null,
        start_date: membership?.startDate || null,
        end_date: membership?.endDate || null,
        total_fee: membership?.totalFee ?? null,
        paid_amount: membership?.paidAmount ?? null,
        pending_amount: membership ? Math.max(0, membership.totalFee - membership.paidAmount) : null
    };
}
