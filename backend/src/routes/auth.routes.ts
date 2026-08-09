import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { validateRequest } from "../middleware/validateRequest";
import { loginSchema } from "../validators/auth.validator";
import { loginRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/login", loginRateLimiter, validateRequest(loginSchema), authController.login);
router.get("/me", authenticate, authController.me);
router.post("/logout", authenticate, authController.logout);

export default router;
