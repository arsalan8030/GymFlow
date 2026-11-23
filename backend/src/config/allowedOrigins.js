const configuredOrigins = (process.env.FRONTEND_URL || "")
    .split(",").map(origin => origin.trim()).filter(Boolean);
const developmentOrigins = process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins]);

export function isAllowedOrigin(origin) {
    return typeof origin === "string" && allowedOrigins.has(origin);
}
