import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Gym from "../models/Gym.js";
import HttpError from "../utils/HttpError.js";

export async function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
        ? header.slice(7)
        : req.cookies?.gymflow_access;
    if (!token) return next(new HttpError(401, "Authentication required"));
    if (!header.startsWith("Bearer ")) {
        const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
            .split(",").map(origin => origin.trim());
        if (!req.headers.origin || !allowedOrigins.includes(req.headers.origin)) {
            return next(new HttpError(403, "Untrusted request origin"));
        }
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { issuer: "gymflow" });
    } catch {
        return next(new HttpError(401, "Invalid or expired session"));
    }

    const user = await User.findById(payload.sub).select("gymId role status loginId");
    if (!user || user.status !== "ACTIVE") {
        return next(new HttpError(401, "Account is unavailable"));
    }
    if (user.gymId) {
        const gym = await Gym.findById(user.gymId).select("status");
        if (!gym || gym.status !== "ACTIVE") {
            return next(new HttpError(403, "Gym account is inactive"));
        }
    }
    req.user = {
        sub: String(user._id),
        role: user.role,
        gymId: user.gymId ? String(user.gymId) : null,
        loginId: user.loginId
    };
    return next();
}

export function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new HttpError(403, "Forbidden"));
        }
        return next();
    };
}
