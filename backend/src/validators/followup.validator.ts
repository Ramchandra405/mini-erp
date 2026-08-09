import { z } from "zod";

export const createFollowUpSchema = z.object({
  body: z.object({
    note: z.string().min(1, "Note is required"),
    followUpDate: z.string().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const listFollowUpsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({ page: z.string().optional(), limit: z.string().optional() }),
  params: z.object({ id: z.string().uuid() }),
});
