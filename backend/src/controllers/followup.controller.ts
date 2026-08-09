import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { followUpService } from "../services/followup.service";
import { ApiError } from "../utils/ApiError";

export const followUpController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await followUpService.listForCustomer(req.params.id, req.query as any);
    sendSuccess(res, result);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const followUp = await followUpService.create(req.params.id, req.user.id, req.body.note, req.body.followUpDate);
    sendCreated(res, followUp);
  }),
};
