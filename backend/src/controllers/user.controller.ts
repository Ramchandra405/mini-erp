import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { userService } from "../services/user.service";

export const userController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.list(req.query as any);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.params.id);
    sendSuccess(res, user);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.create(req.body);
    sendCreated(res, user);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.update(req.params.id, req.body);
    sendSuccess(res, user);
  }),

  deactivate: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.deactivate(req.params.id);
    sendSuccess(res, user);
  }),
};
