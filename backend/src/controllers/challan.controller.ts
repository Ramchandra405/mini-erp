import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { challanService } from "../services/challan.service";
import { ApiError } from "../utils/ApiError";

export const challanController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await challanService.list(req.query as any);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challanService.getById(req.params.id);
    sendSuccess(res, challan);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const challan = await challanService.create(req.body.customerId, req.user.id, req.body.items);
    sendCreated(res, challan);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challanService.update(req.params.id, req.body.items, req.body.customerId);
    sendSuccess(res, challan);
  }),

  confirm: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const challan = await challanService.confirm(req.params.id, req.user.id);
    sendSuccess(res, challan);
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const challan = await challanService.cancel(req.params.id);
    sendSuccess(res, challan);
  }),
};
