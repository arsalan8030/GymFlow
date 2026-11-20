import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateRequest } from "../middleware/validateRequest.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as member from "../controllers/memberController.js";

const router = Router();
router.use(authenticate, authorize("MEMBER"));

router.get("/dashboard", asyncHandler(member.dashboard));
router.post("/progress",
    body("weightKg").isFloat({ min: 1, max: 500 }),
    validateRequest,
    asyncHandler(member.addProgress)
);
router.get("/:section", asyncHandler(member.section));

export default router;
