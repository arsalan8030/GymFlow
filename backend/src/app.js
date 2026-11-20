import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",").map(origin => origin.trim()).filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(Object.assign(new Error("Origin is not allowed by CORS"), { statusCode: 403 }));
    },
    credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());
app.use("/api/v1/auth", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false
}));

app.get("/", (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    return res.status(connected ? 200 : 503).json({
        success: connected,
        service: "GymFlow API",
        database: connected ? "connected" : "disconnected"
    });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/owner", ownerRoutes);
app.use("/api/v1/member", memberRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
