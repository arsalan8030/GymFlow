import mongoose from "mongoose";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";
import WorkoutPlan from "../models/WorkoutPlan.js";
import WeightLog from "../models/WeightLog.js";
import Announcement from "../models/Announcement.js";
import Notification from "../models/Notification.js";
import HttpError from "../utils/HttpError.js";
import { serialize } from "../utils/serialize.js";

async function memberContext(req) {
    const member = await Member.findOne({
        gymId: new mongoose.Types.ObjectId(req.user.gymId),
        userId: new mongoose.Types.ObjectId(req.user.sub)
    });
    if (!member) throw new HttpError(404, "Member profile not found");
    return member;
}

export async function dashboard(req, res) {
    const member = await memberContext(req);
    const [membership, weights, payments, attendance, announcements, workout] = await Promise.all([
        Membership.findOne({ gymId: member.gymId, memberId: member._id }).sort({ createdAt: -1 }).populate("planId", "name").lean(),
        WeightLog.find({ gymId: member.gymId, memberId: member._id }).sort({ logDate: -1 }).limit(20).lean(),
        Payment.find({ gymId: member.gymId, memberId: member._id }).sort({ paymentDate: -1 }).limit(10).lean(),
        Attendance.find({ gymId: member.gymId, memberId: member._id }).sort({ attendanceDate: -1 }).limit(10).lean(),
        Announcement.find({
            gymId: member.gymId,
            status: "ACTIVE",
            $or: [{ expiryDate: null }, { expiryDate: { $gte: new Date() } }]
        }).sort({ createdAt: -1 }).limit(5).lean(),
        WorkoutPlan.findOne({ gymId: member.gymId, memberId: member._id, status: "ACTIVE" }).sort({ createdAt: -1 }).lean()
    ]);

    return res.json({
        member: serialize(member),
        membership: membership ? {
            ...serialize(membership),
            plan_name: membership.planId?.name || null
        } : null,
        weights: serialize(weights),
        payments: serialize(payments),
        attendance: serialize(attendance),
        announcements: serialize(announcements),
        workout: workout ? serialize(workout) : null
    });
}

export async function section(req, res) {
    const member = await memberContext(req);
    const sectionName = req.params.section;
    let rows;
    if (sectionName === "payments") {
        rows = await Payment.find({ gymId: member.gymId, memberId: member._id }).sort({ paymentDate: -1 }).lean();
    } else if (sectionName === "attendance") {
        rows = await Attendance.find({ gymId: member.gymId, memberId: member._id }).sort({ attendanceDate: -1 }).lean();
    } else if (sectionName === "workouts") {
        rows = await WorkoutPlan.find({ gymId: member.gymId, memberId: member._id }).sort({ createdAt: -1 }).lean();
    } else if (sectionName === "progress") {
        rows = await WeightLog.find({ gymId: member.gymId, memberId: member._id }).sort({ logDate: 1 }).lean();
    } else if (sectionName === "notifications") {
        rows = await Notification.find({
            gymId: member.gymId,
            $or: [{ userId: req.user.sub }, { memberId: member._id }]
        }).sort({ createdAt: -1 }).lean();
    } else if (sectionName === "profile") {
        rows = [member];
    } else if (sectionName === "membership") {
        rows = await Membership.find({ gymId: member.gymId, memberId: member._id }).sort({ createdAt: -1 }).populate("planId", "name").lean();
        rows = rows.map(row => ({ ...serialize(row), plan_name: row.planId?.name || null }));
        return res.json({ [sectionName]: rows });
    } else {
        throw new HttpError(404, "Unknown member resource");
    }
    return res.json({ [sectionName]: serialize(rows) });
}

export async function addProgress(req, res) {
    const member = await memberContext(req);
    const weightKg = Number(req.body.weightKg);
    if (!Number.isFinite(weightKg) || weightKg < 1 || weightKg > 500) {
        throw new HttpError(400, "A valid weight in kilograms is required");
    }
    const log = await WeightLog.create({
        gymId: member.gymId,
        memberId: member._id,
        logDate: req.body.date || new Date(),
        weightKg,
        notes: req.body.notes || ""
    });
    return res.status(201).json({ success: true, progress: serialize(log) });
}
