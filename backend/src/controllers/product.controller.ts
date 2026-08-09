import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { productService } from "../services/product.service";

export const productController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await productService.list(req.query as any);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getById(req.params.id);
    sendSuccess(res, product);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;
    const product = await productService.create({
      productName: body.productName,
      sku: body.sku,
      category: body.category,
      unitPrice: body.unitPrice,
      currentStock: body.currentStock ?? 0,
      minimumStock: body.minimumStock ?? 0,
      warehouseLocation: body.warehouseLocation || undefined,
    });
    sendCreated(res, product);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.update(req.params.id, req.body);
    sendSuccess(res, product);
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.deactivate(req.params.id);
    sendSuccess(res, product);
  }),
};
