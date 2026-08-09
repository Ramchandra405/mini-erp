import { z } from "zod";

const customerType = z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"]);
const customerStatus = z.enum(["LEAD", "ACTIVE", "INACTIVE"]);

export const createCustomerSchema = z.object({
  body: z.object({
    customerName: z.string().min(1, "Customer name is required"),
    mobileNumber: z.string().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid mobile number"),
    email: z.string().email().optional().or(z.literal("")).optional(),
    businessName: z.string().optional(),
    gstNumber: z.string().optional(),
    customerType,
    address: z.string().optional(),
    status: customerStatus.optional(),
    followUpDate: z.string().datetime().optional().or(z.string().optional()),
    notes: z.string().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateCustomerSchema = z.object({
  body: createCustomerSchema.shape.body.partial(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const listCustomersSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: customerStatus.optional(),
    customerType: customerType.optional(),
  }),
  params: z.object({}).optional(),
});

export const idParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid("Invalid id") }),
});
