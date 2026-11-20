import { Router } from "express";
import { body, param } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateRequest } from "../middleware/validateRequest.js";
import * as auth from "../controllers/authController.js";

const router = Router();

router.post("/:role/login",
    param("role").isIn(["admin", "owner", "member"]).withMessage("Invalid login type"),
    body("password").isString().notEmpty().withMessage("Password is required"),
    validateRequest,
    asyncHandler(auth.login)
);
router.post("/logout", auth.logout);
router.get("/session", asyncHandler(auth.sessionStatus));
router.get("/me", authenticate, asyncHandler(auth.currentUser));
router.post("/activate-member",
    body("token").isString().notEmpty(),
    body("password").isString().isLength({ min: 12 }).withMessage("Password must be at least 12 characters"),
    validateRequest,
    asyncHandler(auth.activateAccount)
);

export default router;
