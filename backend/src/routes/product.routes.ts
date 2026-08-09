import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateRequest } from "../middleware/validateRequest";
import { createProductSchema, updateProductSchema, listProductsSchema } from "../validators/product.validator";
import { idParamSchema } from "../validators/customer.validator";

const router = Router();
router.use(authenticate);

router.get("/", validateRequest(listProductsSchema), productController.list);
router.post("/", authorize("ADMIN", "WAREHOUSE"), validateRequest(createProductSchema), productController.create);
router.get("/:id", validateRequest(idParamSchema), productController.getById);
router.put("/:id", authorize("ADMIN", "WAREHOUSE"), validateRequest(updateProductSchema), productController.update);
router.delete("/:id", authorize("ADMIN"), validateRequest(idParamSchema), productController.deactivate);

export default router;
