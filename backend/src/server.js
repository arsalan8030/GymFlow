import dotenv from "dotenv";
dotenv.config();

const { default: app } = await import("./app.js");
const { connectDatabase, default: mongoose } = await import("./config/database.js");

function validateEnvironment() {
    const required = ["MONGODB_URI", "JWT_ACCESS_SECRET"];
    const missing = required.filter(name => !process.env[name]);
    if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    if (process.env.JWT_ACCESS_SECRET.length < 32 || /replace|change.?me/i.test(process.env.JWT_ACCESS_SECRET)) {
        throw new Error("JWT_ACCESS_SECRET must be a unique random value of at least 32 characters");
    }
    if (process.env.NODE_ENV === "production" && process.env.MONGODB_TRANSACTIONS !== "true") {
        throw new Error("MONGODB_TRANSACTIONS=true is required in production");
    }
    if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
        throw new Error("FRONTEND_URL is required in production");
    }
}

async function startServer() {
    try {
        validateEnvironment();
        await connectDatabase();
        const port = Number(process.env.PORT || 5000);
        const server = app.listen(port, () => {
            console.log(`GymFlow API listening on port ${port}`);
        });

        const shutdown = async signal => {
            console.log(`${signal} received; shutting down`);
            server.close(async () => {
                await mongoose.disconnect();
                process.exit(0);
            });
        };
        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error) {
        console.error(`Server startup failed: ${error.message}`);
        process.exit(1);
    }
}

startServer();
