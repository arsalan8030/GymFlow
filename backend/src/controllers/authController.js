import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Member from "../models/Member.js";
import Gym from "../models/Gym.js";
import ActivationToken from "../models/ActivationToken.js";
import mongoose from "mongoose";
import { inMongoTransaction } from "../services/transactionService.js";
import HttpError from "../utils/HttpError.js";

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function createAccessToken(user) {
    return jwt.sign(
        { sub: String(user._id), role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TTL || "20m", issuer: "gymflow" }
    );
}

export async function login(req, res) {
    const roleMap = { admin: "SUPER_ADMIN", owner: "OWNER", member: "MEMBER" };
    const role = roleMap[String(req.params.role).toLowerCase()];
    if (!role) throw new HttpError(400, "Invalid login type");

    const loginId = String(req.body.email || req.body.loginId || req.body.memberId || "").trim().toLowerCase();
    const password = req.body.password;
    if (!loginId || typeof password !== "string") {
        throw new HttpError(400, "Credentials are required");
    }

    const user = await User.findOne({ loginId, role }).select("+passwordHash");
    if (!user || user.status !== "ACTIVE") throw new HttpError(401, "Invalid credentials or inactive account");
    if (user.lockUntil && user.lockUntil > new Date()) {
        throw new HttpError(429, "Too many failed sign-in attempts. Try again later.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash || "");
    if (!valid) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= LOCK_THRESHOLD) {
            user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
            user.failedLoginAttempts = 0;
        }
        await user.save();
        throw new HttpError(401, "Invalid credentials");
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = createAccessToken(user);
    res.cookie("gymflow_access", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 20 * 60 * 1000,
        path: "/"
    });
    return res.json({
        user: { id: String(user._id), role: user.role, gymId: user.gymId ? String(user.gymId) : null, loginId: user.loginId }
    });
}

export function logout(req, res) {
    res.clearCookie("gymflow_access", { path: "/" });
    return res.json({ success: true });
}

export async function currentUser(req, res) {
    const user = await User.findById(req.user.sub).select("gymId loginId email role status createdAt").lean();
    if (!user) throw new HttpError(404, "Account not found");
    return res.json({ user: { ...user, id: String(user._id), gymId: user.gymId ? String(user.gymId) : null } });
}

export async function sessionStatus(req, res) {
    const token = req.cookies?.gymflow_access;
    if (!token) return res.json({ user: null });

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { issuer: "gymflow" });
    } catch {
        res.clearCookie("gymflow_access", { path: "/" });
        return res.json({ user: null });
    }

    const user = await User.findById(payload.sub).select("gymId loginId role status");
    if (!user || user.status !== "ACTIVE") {
        res.clearCookie("gymflow_access", { path: "/" });
        return res.json({ user: null });
    }
    if (user.gymId) {
        const gym = await Gym.findById(user.gymId).select("status");
        if (!gym || gym.status !== "ACTIVE") {
            res.clearCookie("gymflow_access", { path: "/" });
            return res.json({ user: null });
        }
    }
    return res.json({
        user: { id: String(user._id), role: user.role, gymId: user.gymId ? String(user.gymId) : null, loginId: user.loginId }
    });
}

export async function activateAccount(req, res) {
    const { token, password } = req.body;
    if (!token || typeof password !== "string" || password.length < 12) {
        throw new HttpError(400, "Activation token and a password of at least 12 characters are required");
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const activation = await ActivationToken.findOne({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() }
    });
    if (!activation) throw new HttpError(400, "Activation link is invalid or expired");

    const passwordHash = await bcrypt.hash(password, 12);
    const session = await mongoose.startSession();
    try {
        await inMongoTransaction(session, async () => {
            const user = await User.findById(activation.userId).session(session);
            if (!user || user.status !== "INVITED") throw new HttpError(400, "This account cannot be activated");
            user.passwordHash = passwordHash;
            user.status = "ACTIVE";
            await user.save({ session });
            await ActivationToken.updateOne(
                { _id: activation._id, usedAt: null },
                { $set: { usedAt: new Date() } },
                { session }
            );
            if (user.role === "MEMBER") {
                await Member.updateOne({ userId: user._id }, { $set: { status: "ACTIVE" } }, { session });
            }
        });
    } finally {
        await session.endSession();
    }
    return res.json({ success: true, message: "Account activated" });
}
