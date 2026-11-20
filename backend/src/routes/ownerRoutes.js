import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateRequest } from "../middleware/validateRequest.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as owner from "../controllers/ownerController.js";

const router = Router();
router.use(authenticate, authorize("OWNER"));

router.get("/dashboard", asyncHandler(owner.dashboard));
router.get("/members", asyncHandler(owner.listMembers));
router.post("/members",
    body("fullName").isString().trim().notEmpty(),
    body("phone").isString().trim().notEmpty(),
    body("email").optional({ values: "falsy" }).isEmail().normalizeEmail(),
    body("paymentMethod").optional().isIn(["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"]),
    validateRequest,
    asyncHandler(owner.addMember)
);
router.get("/memberships", asyncHandler(owner.listPlans));
router.post("/memberships",
    body("name").isString().trim().notEmpty(),
    body("durationDays").isInt({ min: 1 }),
    body("price").isFloat({ min: 0 }),
    validateRequest,
    asyncHandler(owner.createPlan)
);
router.get("/payments", asyncHandler(owner.listPayments));
router.post("/payments",
    body("memberId").isMongoId(),
    body("amount").isFloat({ gt: 0 }),
    body("paymentMethod").optional().isIn(["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"]),
    validateRequest,
    asyncHandler(owner.addPayment)
);
router.get("/attendance", asyncHandler(owner.listAttendance));
router.post("/attendance",
    body("memberId").isMongoId(),
    body("status").optional().isIn(["PRESENT", "ABSENT"]),
    validateRequest,
    asyncHandler(owner.markAttendance)
);
router.get("/trainers", asyncHandler(owner.listTrainers));
router.post("/trainers", body("name").isString().trim().notEmpty(), validateRequest, asyncHandler(owner.addTrainer));
router.get("/announcements", asyncHandler(owner.listAnnouncements));
router.post("/announcements",
    body("title").isString().trim().notEmpty(),
    body("message").isString().trim().notEmpty(),
    validateRequest,
    asyncHandler(owner.addAnnouncement)
);
router.get("/reports", asyncHandler(owner.reports));
router.patch("/gym-profile", asyncHandler(owner.updateGymProfile));

export default router;
