import { Router } from "express";
import { challanController } from "../controllers/challan.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import { createChallanSchema, updateChallanSchema, listChallansSchema } from "../validators/challan.validator";
import { idParamSchema } from "../validators/customer.validator";

const router = Router();
router.use(authenticate);

router.get("/", validateRequest(listChallansSchema), challanController.list);
router.post("/", authorize("ADMIN", "SALES"), validateRequest(createChallanSchema), challanController.create);
router.get("/:id", validateRequest(idParamSchema), challanController.getById);
router.put("/:id", authorize("ADMIN", "SALES"), validateRequest(updateChallanSchema), challanController.update);
router.post("/:id/confirm", authorize("ADMIN", "SALES"), validateRequest(idParamSchema), challanController.confirm);
router.post("/:id/cancel", authorize("ADMIN", "SALES"), validateRequest(idParamSchema), challanController.cancel);

export default router;
