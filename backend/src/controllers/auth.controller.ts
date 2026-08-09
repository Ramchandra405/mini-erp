import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { authService } from "../services/auth.service";
import { ApiError } from "../utils/ApiError";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.me(req.user.id);
    sendSuccess(res, user);
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    // Stateless JWT — logout is a client-side token discard. Endpoint exists
    // for a consistent API contract and future refresh-token/blacklist support.
    sendSuccess(res, { message: "Logged out" });
  }),
};
