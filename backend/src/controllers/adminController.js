import crypto from "crypto";
import mongoose from "mongoose";
import Gym from "../models/Gym.js";
import Member from "../models/Member.js";
import User from "../models/User.js";
import ActivationToken from "../models/ActivationToken.js";
import PlatformPlan from "../models/PlatformPlan.js";
import AuditLog from "../models/AuditLog.js";
import HttpError from "../utils/HttpError.js";
import { recordAudit } from "../services/auditService.js";
import { serialize } from "../utils/serialize.js";
import { inMongoTransaction } from "../services/transactionService.js";

const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function dashboard(req, res) {
    const [totalGyms, activeGyms, suspendedGyms, totalMembers, totalOwners, totalSubscriptions, gymGrowth, gymStatus, memberGrowth] = await Promise.all([
        Gym.countDocuments(),
        Gym.countDocuments({ status: "ACTIVE" }),
        Gym.countDocuments({ status: "INACTIVE" }),
        Member.countDocuments(),
        User.countDocuments({ role: "OWNER" }),
        Gym.countDocuments({ "subscription.status": "ACTIVE" }),
        Gym.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 365 * 86400000) } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, month: "$_id", count: 1 } }
        ]),
        Gym.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { _id: 0, status: "$_id", count: 1 } }]),
        Member.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 365 * 86400000) } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, month: "$_id", count: 1 } }
        ])
    ]);

    return res.json({
        cards: { totalGyms, activeGyms, suspendedGyms, totalMembers, totalOwners, totalSubscriptions },
        gymGrowth,
        gymStatus,
        memberGrowth
    });
}

export async function listGyms(req, res) {
    const { search = "", status = "" } = req.query;
    const filter = {};
    if (search) {
        const expression = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ gymName: expression }, { gymCode: expression }, { email: expression }];
    }
    if (status) {
        if (!["ACTIVE", "INACTIVE"].includes(status)) throw new HttpError(400, "Invalid gym status filter");
        filter.status = status;
    }
    const gyms = await Gym.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ gyms: gyms.map(serialize) });
}

export async function createGym(req, res) {
    const body = req.body;
    if (!body.gymName || !body.ownerName || !body.ownerEmail) {
        throw new HttpError(400, "Gym name, owner name and owner email are required");
    }
    const ownerEmail = String(body.ownerEmail).trim().toLowerCase();
    if (await User.exists({ $or: [{ loginId: ownerEmail }, { email: ownerEmail }] })) {
        throw new HttpError(409, "An account with the owner email already exists");
    }

    const activationToken = crypto.randomBytes(32).toString("hex");
    const session = await mongoose.startSession();
    let owner;
    let gym;
    try {
        await inMongoTransaction(session, async () => {
            [gym] = await Gym.create([{
                gymCode: `GYM-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
                gymName: body.gymName,
                ownerName: body.ownerName,
                phone: body.gymPhone || "",
                email: body.gymEmail || "",
                address: body.address || "",
                city: body.city || "",
                state: body.state || "",
                pinCode: body.pinCode || "",
                subscription: {
                    planName: body.planName || "Starter",
                    startDate: body.startDate || new Date(),
                    expiryDate: body.expiryDate || new Date(Date.now() + 365 * 86400000),
                    status: "ACTIVE"
                }
            }], { session });
            [owner] = await User.create([{
                gymId: gym._id,
                loginId: ownerEmail,
                email: ownerEmail,
                passwordHash: null,
                role: "OWNER",
                status: "INVITED"
            }], { session });
            gym.ownerId = owner._id;
            await gym.save({ session });
            await ActivationToken.create([{
                userId: owner._id,
                tokenHash: crypto.createHash("sha256").update(activationToken).digest("hex"),
                expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
            }], { session });
            await recordAudit({
                actorUserId: req.user.sub,
                action: "GYM_CREATED",
                entityType: "Gym",
                entityId: gym._id,
                details: { gymCode: gym.gymCode },
                session
            });
        });
        return res.status(201).json({ id: String(gym._id), gymCode: gym.gymCode, ownerActivationToken: activationToken });
    } catch (error) {
        if (owner) {
            await ActivationToken.deleteMany({ userId: owner._id });
            await User.deleteOne({ _id: owner._id });
        }
        if (gym) await Gym.deleteOne({ _id: gym._id });
        throw error;
    } finally {
        await session.endSession();
    }
}

export async function setGymStatus(req, res) {
    const status = req.body.status;
    if (!["ACTIVE", "INACTIVE"].includes(status)) throw new HttpError(400, "Invalid status");
    const session = await mongoose.startSession();
    try {
        await inMongoTransaction(session, async () => {
            const gym = await Gym.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true, session });
            if (!gym) throw new HttpError(404, "Gym not found");
            await recordAudit({ actorUserId: req.user.sub, action: `GYM_${status}`, entityType: "Gym", entityId: gym._id, session });
        });
    } finally {
        await session.endSession();
    }
    return res.json({ success: true });
}

export async function listOwners(req, res) {
    const owners = await User.find({ role: "OWNER" }).select("gymId loginId email status createdAt").populate("gymId", "gymName gymCode status").lean();
    return res.json({ owners: owners.map(serialize) });
}

export async function listPlans(req, res) {
    const plans = await PlatformPlan.find().sort({ monthlyPrice: 1 }).lean();
    return res.json({ plans: plans.map(serialize) });
}

export async function createPlan(req, res) {
    const { name, monthlyPrice, yearlyPrice, maxMembers, features = [] } = req.body;
    if (!name || !Number.isFinite(Number(monthlyPrice)) || !Number.isFinite(Number(yearlyPrice)) ||
        !Number.isInteger(Number(maxMembers)) || Number(maxMembers) < 1 ||
        !Array.isArray(features) || !features.every(feature => typeof feature === "string")) {
        throw new HttpError(400, "A plan name, prices, member limit and feature list are required");
    }
    const session = await mongoose.startSession();
    let plan;
    try {
        await inMongoTransaction(session, async () => {
            [plan] = await PlatformPlan.create([{
                name, monthlyPrice: Number(monthlyPrice), yearlyPrice: Number(yearlyPrice),
                maxMembers: Number(maxMembers), features
            }], { session });
            await recordAudit({
                actorUserId: req.user.sub, action: "PLATFORM_PLAN_CREATED",
                entityType: "PlatformPlan", entityId: plan._id, session
            });
        });
    } finally {
        await session.endSession();
    }
    return res.status(201).json({ id: String(plan._id) });
}

export async function activity(req, res) {
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit)
        .populate("actorUserId", "loginId role").populate("gymId", "gymName gymCode").lean();
    return res.json({ activity: logs.map(serialize) });
}
