import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    productName: z.string().min(1, "Product name is required"),
    sku: z.string().min(1, "SKU is required"),
    category: z.string().min(1, "Category is required"),
    unitPrice: z.number().nonnegative("Unit price must be >= 0"),
    currentStock: z.number().int().nonnegative().optional(),
    minimumStock: z.number().int().nonnegative().optional(),
    warehouseLocation: z.string().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial().extend({
    isActive: z.boolean().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const listProductsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    lowStock: z.string().optional(),
  }),
  params: z.object({}).optional(),
});
