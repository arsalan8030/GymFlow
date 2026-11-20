import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { connectDatabase, default as mongoose } from "../src/config/database.js";
import User from "../src/models/User.js";

dotenv.config();

const email = String(process.argv[2] || "").trim().toLowerCase();
const password = process.argv[3];

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12) {
    console.error("Usage: npm run seed:admin -- admin@example.com <password-with-at-least-12-characters>");
    process.exit(1);
}

try {
    await connectDatabase();
    if (await User.exists({ $or: [{ loginId: email }, { email }] })) {
        throw new Error("An account with that login already exists");
    }
    await User.create({
        loginId: email,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "SUPER_ADMIN",
        status: "ACTIVE"
    });
    console.log(`Super Admin created: ${email}`);
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
