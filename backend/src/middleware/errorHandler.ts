import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

// Centralized error handler — every thrown error in the app funnels here.
// Never leaks stack traces or raw DB internals to the client.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return res.status(409).json({
        success: false,
        message: `A record with this ${target} already exists`,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    return res.status(400).json({ success: false, message: "Database request error" });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ success: false, message: "Internal server error" });
}
