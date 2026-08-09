import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid("Valid customer is required"),
    items: z.array(itemSchema).min(1, "At least one product is required"),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid().optional(),
    items: z.array(itemSchema).min(1).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const listChallansSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]).optional(),
    customerId: z.string().uuid().optional(),
  }),
  params: z.object({}).optional(),
});
