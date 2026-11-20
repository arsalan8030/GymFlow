import dotenv from "dotenv";
import { connectDatabase, default as mongoose } from "../src/config/database.js";
import "../src/models/User.js";
import "../src/models/Gym.js";
import "../src/models/Member.js";
import "../src/models/MembershipPlan.js";
import "../src/models/Membership.js";
import "../src/models/Payment.js";
import "../src/models/Attendance.js";
import "../src/models/Trainer.js";
import "../src/models/Announcement.js";
import "../src/models/WorkoutPlan.js";
import "../src/models/WeightLog.js";
import "../src/models/Notification.js";
import "../src/models/ActivationToken.js";
import "../src/models/AuditLog.js";
import "../src/models/PlatformPlan.js";

dotenv.config();

try {
    await connectDatabase();
    await Promise.all(Object.values(mongoose.models).map(model => model.createIndexes()));
    console.log("MongoDB indexes synchronized");
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
