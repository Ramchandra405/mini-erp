import { MovementType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta, parsePagination } from "../utils/pagination";

interface ListMovementsParams {
  page?: string;
  limit?: string;
  productId?: string;
  movementType?: MovementType;
}

export const inventoryService = {
  async summary() {
    const [totalProducts, aggregate, products] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.aggregate({ where: { isActive: true }, _sum: { currentStock: true } }),
      prisma.product.findMany({ where: { isActive: true } }),
    ]);

    const lowStockProducts = products.filter((p) => p.currentStock <= p.minimumStock);

    return {
      totalProducts,
      totalStockUnits: aggregate._sum.currentStock ?? 0,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.slice(0, 10),
    };
  },

  async listMovements(params: ListMovementsParams) {
    const { page, limit, skip } = parsePagination(params);
    const where: Prisma.StockMovementWhereInput = {
      ...(params.productId ? { productId: params.productId } : {}),
      ...(params.movementType ? { movementType: params.movementType } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { productName: true, sku: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { items, meta: buildMeta(page, limit, total) };
  },

  // Manual stock adjustment (not challan-driven). Stock must never go negative.
  async createManualMovement(input: {
    productId: string;
    quantity: number;
    movementType: MovementType;
    reason: string;
    createdById: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: input.productId } });
      if (!product) throw ApiError.notFound("Product not found");

      if (input.movementType === "OUT" && product.currentStock < input.quantity) {
        throw ApiError.badRequest("Insufficient stock for product");
      }

      const delta = input.movementType === "IN" ? input.quantity : -input.quantity;

      const updated = await tx.product.update({
        where: { id: input.productId },
        data: { currentStock: { increment: delta } },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: input.productId,
          quantity: input.quantity,
          movementType: input.movementType,
          reason: input.reason,
          createdById: input.createdById,
          referenceType: "MANUAL",
        },
      });

      return { movement, product: updated };
    });
  },
};
