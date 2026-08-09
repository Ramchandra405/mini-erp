import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import { createMovementSchema, listMovementsSchema } from "../validators/inventory.validator";

const router = Router();
router.use(authenticate);

router.get("/", inventoryController.summary);
router.get("/movements", validateRequest(listMovementsSchema), inventoryController.listMovements);
router.post(
  "/movements",
  authorize("ADMIN", "WAREHOUSE"),
  validateRequest(createMovementSchema),
  inventoryController.createMovement
);

export default router;
