import HttpError from "../utils/HttpError.js";

export function notFound(req, res, next) {
    next(new HttpError(404, "Route not found"));
}

export function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ message: "Invalid JSON request body" });
    }
    if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
    }
    if (error.name === "CastError") {
        return res.status(400).json({ message: "Invalid resource identifier" });
    }
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || "value";
        return res.status(409).json({ message: `${field} already exists` });
    }
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) console.error(error);
    return res.status(statusCode).json({
        message: statusCode >= 500 ? "An unexpected server error occurred" : error.message
    });
}
