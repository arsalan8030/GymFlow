import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { connectDatabase, default as mongoose } from "../src/config/database.js";
import Gym from "../src/models/Gym.js";
import User from "../src/models/User.js";
import Member from "../src/models/Member.js";
import MembershipPlan from "../src/models/MembershipPlan.js";
import Membership from "../src/models/Membership.js";
import Payment from "../src/models/Payment.js";
import Attendance from "../src/models/Attendance.js";
import Trainer from "../src/models/Trainer.js";
import WorkoutPlan from "../src/models/WorkoutPlan.js";
import Announcement from "../src/models/Announcement.js";

dotenv.config();

if (process.env.NODE_ENV === "production") {
    throw new Error("Development seed data cannot be loaded in production");
}

const demoPassword = "GymFlowDev123!";

async function seed() {
    await connectDatabase();
    const passwordHash = await bcrypt.hash(demoPassword, 12);

    for (let gymNumber = 1; gymNumber <= 3; gymNumber++) {
        const ownerEmail = `owner${gymNumber}@example.test`;
        const gym = await Gym.findOneAndUpdate(
            { gymCode: `DEV-GYM-${gymNumber}` },
            {
                $set: {
                    gymName: `GymFlow Fitness ${gymNumber}`,
                    ownerName: `Gym Owner ${gymNumber}`,
                    phone: `555-010${gymNumber}`,
                    email: `gym${gymNumber}@example.test`,
                    address: `${gymNumber} Fitness Avenue`,
                    city: "Sample City",
                    state: "Sample State",
                    status: "ACTIVE",
                    "subscription.planName": "Pro",
                    "subscription.startDate": new Date(),
                    "subscription.expiryDate": new Date(Date.now() + 365 * 86400000),
                    "subscription.status": "ACTIVE"
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        const owner = await User.findOneAndUpdate(
            { loginId: ownerEmail },
            {
                $set: {
                    gymId: gym._id,
                    email: ownerEmail,
                    passwordHash,
                    role: "OWNER",
                    status: "ACTIVE"
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        gym.ownerId = owner._id;
        await gym.save();

        const planDocs = [];
        for (const [name, durationDays, price] of [["Monthly",30,2499],["Quarterly",90,5999],["Annual",365,19999]]) {
            const plan = await MembershipPlan.findOneAndUpdate(
                { gymId: gym._id, name },
                { $set: { durationDays, price, description: "Development membership plan", status: "ACTIVE" } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            planDocs.push(plan);
        }

        const trainer = await Trainer.findOneAndUpdate(
            { gymId: gym._id, name: `Trainer ${gymNumber}` },
            { $set: { specialization: "Strength and conditioning", phone: `555-020${gymNumber}`, status: "ACTIVE" } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        for (let memberNumber = 1; memberNumber <= 15; memberNumber++) {
            const memberCode = `DEV-${gymNumber}-${String(memberNumber).padStart(3, "0")}`;
            const memberEmail = `member${gymNumber}.${memberNumber}@example.test`;
            const memberUser = await User.findOneAndUpdate(
                { loginId: memberCode.toLowerCase() },
                { $set: { gymId: gym._id, email: memberEmail, passwordHash, role: "MEMBER", status: "ACTIVE" } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            const member = await Member.findOneAndUpdate(
                { gymId: gym._id, memberId: memberCode },
                {
                    $set: {
                        userId: memberUser._id,
                        fullName: `Member ${gymNumber}.${memberNumber}`,
                        phone: `555-100${gymNumber}${String(memberNumber).padStart(2, "0")}`,
                        email: memberEmail,
                        joiningDate: new Date(Date.now() - memberNumber * 86400000),
                        trainerId: trainer._id,
                        status: "ACTIVE"
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            const startDate = new Date(Date.now() - 10 * 86400000);
            const endDate = new Date(startDate.getTime() + 30 * 86400000);
            const membership = await Membership.findOneAndUpdate(
                { gymId: gym._id, memberId: member._id },
                {
                    $set: {
                        planId: planDocs[0]._id,
                        startDate,
                        endDate,
                        totalFee: planDocs[0].price,
                        paidAmount: memberNumber % 4 === 0 ? 1000 : planDocs[0].price,
                        status: "ACTIVE"
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            if (memberNumber % 4 !== 0) {
                await Payment.findOneAndUpdate(
                    { receiptNumber: `DEV-${gymNumber}-${memberNumber}` },
                    {
                        $set: {
                            gymId: gym._id, memberId: member._id, membershipId: membership._id,
                            amount: planDocs[0].price, paymentMethod: "UPI",
                            receiptNumber: `DEV-${gymNumber}-${memberNumber}`, paymentDate: startDate,
                            createdBy: owner._id, status: "COMPLETED"
                        }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }
            await Attendance.findOneAndUpdate(
                { gymId: gym._id, memberId: member._id, attendanceDate: new Date(new Date().setUTCHours(0,0,0,0)) },
                { $set: { status: memberNumber % 3 ? "PRESENT" : "ABSENT" } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            await WorkoutPlan.findOneAndUpdate(
                { gymId: gym._id, memberId: member._id, planName: "Foundation strength" },
                {
                    $set: {
                        trainerId: trainer._id,
                        goal: "Build strength",
                        weeklySchedule: "Monday, Wednesday, Friday",
                        exercises: [
                            { name: "Squat", sets: 3, repetitions: "8-10", restSeconds: 90 },
                            { name: "Bench press", sets: 3, repetitions: "8-10", restSeconds: 90 }
                        ],
                        status: "ACTIVE"
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        await Announcement.findOneAndUpdate(
            { gymId: gym._id, title: "Welcome to GymFlow Fitness" },
            { $set: { message: "Your gym updates and training information are available in your member portal.", status: "ACTIVE" } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    }

    console.log(`Development seed completed. Owner login: owner1@example.test / ${demoPassword}`);
}

try {
    await seed();
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
