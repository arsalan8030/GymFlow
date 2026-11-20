import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateRequest } from "../middleware/validateRequest.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as admin from "../controllers/adminController.js";

const router = Router();
router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/dashboard", asyncHandler(admin.dashboard));
router.get("/gyms", asyncHandler(admin.listGyms));
router.post("/gyms",
    body("gymName").isString().trim().notEmpty(),
    body("ownerName").isString().trim().notEmpty(),
    body("ownerEmail").isEmail().normalizeEmail(),
    validateRequest,
    asyncHandler(admin.createGym)
);
router.patch("/gyms/:id/status",
    param("id").isMongoId(),
    body("status").isIn(["ACTIVE", "INACTIVE"]),
    validateRequest,
    asyncHandler(admin.setGymStatus)
);
router.get("/owners", asyncHandler(admin.listOwners));
router.get("/plans", asyncHandler(admin.listPlans));
router.post("/plans",
    body("name").isString().trim().notEmpty(),
    body("monthlyPrice").isFloat({ min: 0 }),
    body("yearlyPrice").isFloat({ min: 0 }),
    body("maxMembers").isInt({ min: 1 }),
    body("features").optional().isArray(),
    validateRequest,
    asyncHandler(admin.createPlan)
);
router.get("/activity", asyncHandler(admin.activity));

export default router;
