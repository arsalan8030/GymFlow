import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { memberRow, serialize } from "../src/utils/serialize.js";

test("serialize converts Mongo identifiers and API aliases while omitting secrets", () => {
    const id = new mongoose.Types.ObjectId();
    const gymId = new mongoose.Types.ObjectId();
    const result = serialize({
        _id: id,
        gymId,
        fullName: "Test Member",
        passwordHash: "never return this",
        createdAt: new Date("2026-01-01T00:00:00.000Z")
    });

    assert.equal(result.id, String(id));
    assert.equal(result.gym_id, String(gymId));
    assert.equal(result.full_name, "Test Member");
    assert.equal(result.passwordHash, undefined);
    assert.equal(result.created_at.toISOString(), "2026-01-01T00:00:00.000Z");
});

test("member list rows compute a non-negative pending balance", () => {
    const result = memberRow(
        { _id: new mongoose.Types.ObjectId(), fullName: "Member", memberId: "MF-1" },
        { totalFee: 500, paidAmount: 600, startDate: new Date(), endDate: new Date() },
        { name: "Monthly" }
    );

    assert.equal(result.pending_amount, 0);
    assert.equal(result.membership_plan, "Monthly");
});
