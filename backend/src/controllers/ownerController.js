import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import MembershipPlan from "../models/MembershipPlan.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";
import Trainer from "../models/Trainer.js";
import Announcement from "../models/Announcement.js";
import HttpError from "../utils/HttpError.js";
import { createMember } from "../services/memberService.js";
import { recordPayment } from "../services/paymentService.js";
import { recordAudit } from "../services/auditService.js";
import { memberRow, serialize } from "../utils/serialize.js";

const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const gymObjectId = req => new mongoose.Types.ObjectId(req.user.gymId);

export async function dashboard(req, res) {
    const gymId = gymObjectId(req);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalMembers, activeMembers, revenue, membershipTotals, todayAttendance, expiringMemberships, recentDocs, monthlyRevenue] = await Promise.all([
        Member.countDocuments({ gymId }),
        Member.countDocuments({ gymId, status: "ACTIVE" }),
        Payment.aggregate([
            { $match: { gymId, status: "COMPLETED", paymentDate: { $gte: monthStart } } },
            { $group: { _id: null, value: { $sum: "$amount" } } }
        ]),
        Membership.aggregate([
            { $match: { gymId, status: "ACTIVE" } },
            { $group: { _id: null, value: { $sum: { $max: [0, { $subtract: ["$totalFee", "$paidAmount"] }] } } } }
        ]),
        Attendance.countDocuments({
            gymId,
            attendanceDate: { $gte: new Date(new Date().setHours(0,0,0,0)), $lt: new Date(new Date().setHours(24,0,0,0)) },
            status: "PRESENT"
        }),
        Membership.countDocuments({
            gymId, status: "ACTIVE",
            endDate: { $gte: new Date(new Date().setHours(0,0,0,0)), $lte: new Date(Date.now() + 7 * 86400000) }
        }),
        Payment.find({ gymId }).sort({ createdAt: -1 }).limit(5).populate("memberId", "fullName memberId").lean(),
        Payment.aggregate([
            { $match: { gymId, paymentDate: { $gte: new Date(Date.now() - 365 * 86400000) }, status: "COMPLETED" } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } }, value: { $sum: "$amount" } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, month: "$_id", value: 1 } }
        ])
    ]);

    const recentPayments = recentDocs.map(payment => ({
        ...serialize(payment),
        full_name: payment.memberId?.fullName || "",
        member_id: payment.memberId?.memberId || ""
    }));
    return res.json({
        cards: {
            totalMembers, activeMembers,
            monthlyRevenue: revenue[0]?.value || 0,
            pendingFees: membershipTotals[0]?.value || 0,
            todaysAttendance: todayAttendance,
            expiringMemberships
        },
        recentPayments,
        monthlyRevenue
    });
}

export async function listMembers(req, res) {
    const gymId = gymObjectId(req);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = { gymId };
    if (req.query.search) {
        const expression = new RegExp(escapeRegex(req.query.search), "i");
        filter.$or = [{ fullName: expression }, { memberId: expression }, { phone: expression }];
    }
    if (req.query.status) {
        if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(req.query.status)) throw new HttpError(400, "Invalid member status filter");
        filter.status = req.query.status;
    }
    const [members, total] = await Promise.all([
        Member.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Member.countDocuments(filter)
    ]);
    const memberIds = members.map(member => member._id);
    const memberships = await Membership.find({ gymId, memberId: { $in: memberIds } })
        .sort({ createdAt: -1 }).populate("planId", "name").lean();
    const latest = new Map();
    for (const membership of memberships) {
        if (!latest.has(String(membership.memberId))) latest.set(String(membership.memberId), membership);
    }
    return res.json({
        members: members.map(member => {
            const membership = latest.get(String(member._id));
            return memberRow(member, membership, membership?.planId);
        }),
        page,
        limit,
        total
    });
}

export async function addMember(req, res) {
    const body = req.body;
    if (!body.fullName || !body.phone) throw new HttpError(400, "Full name and phone are required");
    const created = await createMember({ gymId: gymObjectId(req), ownerUserId: req.user.sub, input: body });
    await recordAudit({
        actorUserId: req.user.sub,
        gymId: req.user.gymId,
        action: "MEMBER_CREATED",
        entityType: "Member",
        entityId: created.member._id
    });
    return res.status(201).json({
        id: String(created.member._id),
        memberId: created.memberId,
        activationToken: created.activationToken
    });
}

export async function listPlans(req, res) {
    const plans = await MembershipPlan.find({ gymId: gymObjectId(req) }).sort({ name: 1 }).lean();
    return res.json({ plans: plans.map(serialize) });
}

export async function createPlan(req, res) {
    const { name, durationDays, price, description, benefits } = req.body;
    if (!name || !Number.isInteger(Number(durationDays)) || Number(durationDays) < 1 ||
        !Number.isFinite(Number(price)) || Number(price) < 0) {
        throw new HttpError(400, "Plan name, valid duration and non-negative price are required");
    }
    const plan = await MembershipPlan.create({
        gymId: gymObjectId(req), name, durationDays: Number(durationDays), price: Number(price),
        description: description || "", benefits: Array.isArray(benefits) ? benefits : []
    });
    return res.status(201).json({ id: String(plan._id) });
}

export async function listPayments(req, res) {
    const payments = await Payment.find({ gymId: gymObjectId(req) })
        .sort({ paymentDate: -1 }).populate("memberId", "fullName memberId").lean();
    return res.json({
        payments: payments.map(payment => ({
            ...serialize(payment),
            full_name: payment.memberId?.fullName || "",
            member_id: payment.memberId?.memberId || ""
        }))
    });
}

export async function addPayment(req, res) {
    const payment = await recordPayment({
        gymId: gymObjectId(req),
        actorUserId: req.user.sub,
        input: req.body
    });
    await recordAudit({
        actorUserId: req.user.sub,
        gymId: req.user.gymId,
        action: "PAYMENT_RECORDED",
        entityType: "Payment",
        entityId: payment._id,
        details: { amount: payment.amount, receiptNumber: payment.receiptNumber }
    });
    return res.status(201).json({ id: String(payment._id), receiptNumber: payment.receiptNumber });
}

export async function listAttendance(req, res) {
    const dateInput = req.query.date ? new Date(`${req.query.date}T00:00:00.000Z`) : new Date();
    if (Number.isNaN(dateInput.getTime())) throw new HttpError(400, "Invalid attendance date");
    const start = new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate()));
    const end = new Date(start.getTime() + 86400000);
    const rows = await Attendance.find({ gymId: gymObjectId(req), attendanceDate: { $gte: start, $lt: end } })
        .populate("memberId", "fullName memberId").sort({ createdAt: -1 }).lean();
    return res.json({
        date: start.toISOString().slice(0, 10),
        attendance: rows.map(row => ({
            ...serialize(row),
            full_name: row.memberId?.fullName || "",
            member_id: row.memberId?.memberId || ""
        }))
    });
}

export async function markAttendance(req, res) {
    const gymId = gymObjectId(req);
    const { memberId, date, status = "PRESENT", checkInTime } = req.body;
    if (!memberId || !["PRESENT", "ABSENT"].includes(status)) throw new HttpError(400, "Member and valid attendance status are required");
    const member = await Member.findOne({ _id: memberId, gymId }).select("_id");
    if (!member) throw new HttpError(404, "Member not found");
    const targetDate = date ? new Date(`${date}T00:00:00.000Z`) : new Date();
    if (Number.isNaN(targetDate.getTime())) throw new HttpError(400, "Invalid attendance date");
    targetDate.setUTCHours(0, 0, 0, 0);
    const row = await Attendance.findOneAndUpdate(
        { gymId, memberId: member._id, attendanceDate: targetDate },
        { $set: { status, checkInTime: checkInTime ? new Date(checkInTime) : null } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, attendance: serialize(row) });
}

export async function listTrainers(req, res) {
    const trainers = await Trainer.find({ gymId: gymObjectId(req) }).sort({ name: 1 }).lean();
    return res.json({ trainers: trainers.map(serialize) });
}

export async function addTrainer(req, res) {
    if (!req.body.name) throw new HttpError(400, "Trainer name is required");
    const trainer = await Trainer.create({
        gymId: gymObjectId(req),
        name: req.body.name,
        phone: req.body.phone || "",
        email: req.body.email || "",
        specialization: req.body.specialization || "",
        salary: req.body.salary === undefined ? null : Number(req.body.salary)
    });
    return res.status(201).json({ id: String(trainer._id) });
}

export async function listAnnouncements(req, res) {
    const announcements = await Announcement.find({ gymId: gymObjectId(req) }).sort({ createdAt: -1 }).lean();
    return res.json({ announcements: announcements.map(serialize) });
}

export async function addAnnouncement(req, res) {
    const { title, message, expiryDate } = req.body;
    if (!title || !message) throw new HttpError(400, "Title and message are required");
    const announcement = await Announcement.create({
        gymId: gymObjectId(req), title, message, expiryDate: expiryDate || null
    });
    return res.status(201).json({ id: String(announcement._id) });
}

export async function reports(req, res) {
    const gymId = gymObjectId(req);
    const [membersByStatus, paymentsByMethod, monthlyRevenue] = await Promise.all([
        Member.aggregate([{ $match: { gymId } }, { $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { _id: 0, status: "$_id", count: 1 } }]),
        Payment.aggregate([{ $match: { gymId, status: "COMPLETED" } }, { $group: { _id: "$paymentMethod", total: { $sum: "$amount" } } }, { $project: { _id: 0, payment_method: "$_id", total: 1 } }]),
        Payment.aggregate([
            { $match: { gymId, status: "COMPLETED" } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } }, total: { $sum: "$amount" } } },
            { $sort: { _id: 1 } }, { $project: { _id: 0, month: "$_id", total: 1 } }
        ])
    ]);
    return res.json({ membersByStatus, paymentsByMethod, monthlyRevenue });
}

export async function updateGymProfile(req, res) {
    const allowed = ["gymName", "phone", "email", "address", "city", "state", "pinCode"];
    const changes = Object.fromEntries(allowed.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    const gym = await Gym.findByIdAndUpdate(req.user.gymId, { $set: changes }, { new: true, runValidators: true });
    if (!gym) throw new HttpError(404, "Gym not found");
    return res.json({ gym: serialize(gym) });
}
