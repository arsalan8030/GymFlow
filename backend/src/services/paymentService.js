import crypto from "crypto";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Member from "../models/Member.js";
import Membership from "../models/Membership.js";
import HttpError from "../utils/HttpError.js";
import { inMongoTransaction } from "./transactionService.js";

export async function recordPayment({ gymId, actorUserId, input }) {
    const amount = Number(input.amount);
    if (!input.memberId || !Number.isFinite(amount) || amount <= 0) {
        throw new HttpError(400, "Member and a positive payment amount are required");
    }
    if (!["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"].includes(input.paymentMethod || "CASH")) {
        throw new HttpError(400, "Invalid payment method");
    }

    const session = await mongoose.startSession();
    const receiptNumber = `GF-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    let payment;
    let membershipToAdjust;
    try {
        await inMongoTransaction(session, async () => {
            const member = await Member.findOne({ _id: input.memberId, gymId }).select("_id").session(session);
            if (!member) throw new HttpError(404, "Member not found");

            let membership = input.membershipId
                ? await Membership.findOne({ _id: input.membershipId, memberId: member._id, gymId }).session(session)
                : await Membership.findOne({ memberId: member._id, gymId, status: "ACTIVE" })
                    .sort({ createdAt: -1 }).session(session);
            if (input.membershipId && !membership) throw new HttpError(404, "Membership not found");
            if (membership) {
                membershipToAdjust = membership;
                if (amount > membership.totalFee - membership.paidAmount) {
                    throw new HttpError(400, "Payment exceeds the remaining membership balance");
                }
                membership.paidAmount += amount;
                await membership.save({ session });
            }

            const [created] = await Payment.create([{
                gymId,
                memberId: member._id,
                membershipId: membership?._id || null,
                amount,
                paymentMethod: input.paymentMethod || "CASH",
                referenceNumber: input.referenceNumber || "",
                receiptNumber,
                paymentDate: input.paymentDate || new Date(),
                notes: input.notes || "",
                createdBy: actorUserId
            }], { session });
            payment = created;
        });
        return payment;
    } catch (error) {
        if (membershipToAdjust && process.env.MONGODB_TRANSACTIONS === "false") {
            await Membership.updateOne(
                { _id: membershipToAdjust._id, paidAmount: { $gte: amount } },
                { $inc: { paidAmount: -amount } }
            );
        }
        throw error;
    } finally {
        await session.endSession();
    }
}
