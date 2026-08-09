import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { dashboardService } from "../services/dashboard.service";

export const dashboardController = {
  summary: asyncHandler(async (_req: Request, res: Response) => {
    const result = await dashboardService.summary();
    sendSuccess(res, result);
  }),
};
