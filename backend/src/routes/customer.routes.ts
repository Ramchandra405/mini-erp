import { Router } from "express";
import { customerController } from "../controllers/customer.controller";
import { followUpController } from "../controllers/followup.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersSchema,
  idParamSchema,
} from "../validators/customer.validator";
import { createFollowUpSchema, listFollowUpsSchema } from "../validators/followup.validator";

const router = Router();
router.use(authenticate);

router.get("/", authorize("ADMIN", "SALES", "ACCOUNTS"), validateRequest(listCustomersSchema), customerController.list);
router.post("/", authorize("ADMIN", "SALES"), validateRequest(createCustomerSchema), customerController.create);
router.get("/:id", authorize("ADMIN", "SALES", "ACCOUNTS"), validateRequest(idParamSchema), customerController.getById);
router.put("/:id", authorize("ADMIN", "SALES"), validateRequest(updateCustomerSchema), customerController.update);
router.delete("/:id", authorize("ADMIN"), validateRequest(idParamSchema), customerController.deactivate);

router.get(
  "/:id/followups",
  authorize("ADMIN", "SALES", "ACCOUNTS"),
  validateRequest(listFollowUpsSchema),
  followUpController.list
);
router.post(
  "/:id/followups",
  authorize("ADMIN", "SALES"),
  validateRequest(createFollowUpSchema),
  followUpController.create
);

export default router;
