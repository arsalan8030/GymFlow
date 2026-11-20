import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import MembershipPlan from "../models/MembershipPlan.js";
import Payment from "../models/Payment.js";
import ActivationToken from "../models/ActivationToken.js";
import HttpError from "../utils/HttpError.js";
import { inMongoTransaction } from "./transactionService.js";

export async function createMember({ gymId, ownerUserId, input }) {
    const fee = Number(input.membershipFee || 0);
    const discount = Number(input.discount || 0);
    const initialPayment = Number(input.initialPayment || 0);
    const durationDays = Number(input.durationDays || 30);
    const methods = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"];
    if (![fee, discount, initialPayment, durationDays].every(Number.isFinite) ||
        fee < 0 || discount < 0 || initialPayment < 0 || durationDays < 1 || !Number.isInteger(durationDays) ||
        discount > fee || initialPayment > fee - discount) {
        throw new HttpError(400, "Membership fee, discount, payment or duration is invalid");
    }
    if (initialPayment > 0 && !methods.includes(input.paymentMethod || "CASH")) {
        throw new HttpError(400, "Invalid payment method");
    }

    const session = await mongoose.startSession();
    const memberId = `MF-${Date.now().toString().slice(-8)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const activationToken = crypto.randomBytes(32).toString("hex");
    let createdMember;

    try {
        await inMongoTransaction(session, async () => {
            let plan = null;
            if (input.planId) {
                plan = await MembershipPlan.findOne({ _id: input.planId, gymId, status: "ACTIVE" }).session(session);
                if (!plan) throw new HttpError(404, "Membership plan not found");
            }

            const [user] = await User.create([{
                gymId,
                loginId: memberId.toLowerCase(),
                email: input.email ? String(input.email).trim().toLowerCase() : undefined,
                role: "MEMBER",
                status: "INVITED"
            }], { session });
            const [member] = await Member.create([{
                gymId,
                userId: user._id,
                memberId,
                fullName: input.fullName,
                phone: input.phone,
                email: input.email || "",
                dateOfBirth: input.dateOfBirth || null,
                gender: input.gender || "",
                address: input.address || "",
                emergencyContact: input.emergencyContact || "",
                joiningDate: input.joiningDate || new Date(),
                trainerId: input.trainerId || null,
                notes: input.notes || ""
            }], { session });

            const startDate = new Date(input.joiningDate || Date.now());
            const endDate = new Date(startDate);
            endDate.setUTCDate(endDate.getUTCDate() + durationDays);
            const [membership] = await Membership.create([{
                gymId,
                memberId: member._id,
                planId: plan?._id || null,
                startDate,
                endDate,
                totalFee: fee - discount,
                discount,
                paidAmount: initialPayment,
                status: "ACTIVE"
            }], { session });

            if (initialPayment > 0) {
                await Payment.create([{
                    gymId,
                    memberId: member._id,
                    membershipId: membership._id,
                    amount: initialPayment,
                    paymentMethod: input.paymentMethod || "CASH",
                    referenceNumber: input.referenceNumber || "",
                    receiptNumber: `GF-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
                    paymentDate: input.paymentDate || new Date(),
                    notes: "Initial payment",
                    createdBy: ownerUserId
                }], { session });
            }

            await ActivationToken.create([{
                userId: user._id,
                tokenHash: crypto.createHash("sha256").update(activationToken).digest("hex"),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }], { session });
            createdMember = member;
        });
    } catch (error) {
        const user = await User.findOne({ loginId: memberId.toLowerCase() }).select("_id");
        const member = await Member.findOne({ gymId, memberId }).select("_id");
        if (member) {
            await Promise.all([
                Payment.deleteMany({ memberId: member._id }),
                Membership.deleteMany({ memberId: member._id }),
                Member.deleteOne({ _id: member._id })
            ]);
        }
        if (user) {
            await ActivationToken.deleteMany({ userId: user._id });
            await User.deleteOne({ _id: user._id });
        }
        throw error;
    } finally {
        await session.endSession();
    }

    return { member: createdMember, memberId, activationToken };
}
