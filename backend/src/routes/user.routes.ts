import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.get("/", userController.list);
router.post("/", userController.create);
router.get("/:id", userController.getById);
router.put("/:id", userController.update);
router.patch("/:id/deactivate", userController.deactivate);

export default router;
