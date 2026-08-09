import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { inventoryService } from "../services/inventory.service";
import { ApiError } from "../utils/ApiError";

export const inventoryController = {
  summary: asyncHandler(async (_req: Request, res: Response) => {
    const result = await inventoryService.summary();
    sendSuccess(res, result);
  }),

  listMovements: asyncHandler(async (req: Request, res: Response) => {
    const result = await inventoryService.listMovements(req.query as any);
    sendSuccess(res, result);
  }),

  createMovement: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const result = await inventoryService.createManualMovement({
      ...req.body,
      createdById: req.user.id,
    });
    sendCreated(res, result);
  }),
};
