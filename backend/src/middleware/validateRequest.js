import { validationResult } from "express-validator";
import HttpError from "../utils/HttpError.js";

export function validateRequest(req, res, next) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const message = result.array({ onlyFirstError: true }).map(error => error.msg).join(", ");
        return next(new HttpError(400, message));
    }
    return next();
}
