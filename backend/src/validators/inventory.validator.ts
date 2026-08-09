import { z } from "zod";

export const createMovementSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive("Quantity must be greater than 0"),
    movementType: z.enum(["IN", "OUT"]),
    reason: z.string().min(1, "Reason is required"),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listMovementsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    productId: z.string().uuid().optional(),
    movementType: z.enum(["IN", "OUT"]).optional(),
  }),
  params: z.object({}).optional(),
});
