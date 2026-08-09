import { Prisma, ChallanStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta, parsePagination } from "../utils/pagination";
import { nextChallanNumber } from "./challanNumber.service";

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

interface ListChallansParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: ChallanStatus;
  customerId?: string;
}

async function buildSnapshotItems(
  tx: Prisma.TransactionClient,
  items: ChallanItemInput[]
) {
  const productIds = items.map((i) => i.productId);
  const products = await tx.product.findMany({ where: { id: { in: productIds } } });

  if (products.length !== new Set(productIds).size) {
    throw ApiError.badRequest("One or more products were not found");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalQuantity = 0;
  let totalAmount = new Prisma.Decimal(0);

  const snapshotItems = items.map((item) => {
    const product = productMap.get(item.productId)!;
    totalQuantity += item.quantity;
    totalAmount = totalAmount.plus(product.unitPrice.mul(item.quantity));
    return {
      productId: product.id,
      productNameSnapshot: product.productName,
      skuSnapshot: product.sku,
      unitPriceSnapshot: product.unitPrice,
      quantity: item.quantity,
    };
  });

  return { snapshotItems, totalQuantity, totalAmount };
}

export const challanService = {
  async list(params: ListChallansParams) {
    const { page, limit, skip } = parsePagination(params);

    const where: Prisma.ChallanWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.search ? { challanNumber: { contains: params.search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { customerName: true } }, items: true },
      }),
      prisma.challan.count({ where }),
    ]);

    return { items, meta: buildMeta(page, limit, total) };
  },

  async getById(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { name: true } },
        items: { include: { product: { select: { productName: true, sku: true, currentStock: true } } } },
      },
    });
    if (!challan) throw ApiError.notFound("Challan not found");
    return challan;
  },

  // Challan is created as DRAFT. Stock is NEVER touched here — only on confirm.
  async create(customerId: string, createdById: string, items: ChallanItemInput[]) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
    if (!customer) throw ApiError.badRequest("Customer not found");

    return prisma.$transaction(async (tx) => {
      const { snapshotItems, totalQuantity, totalAmount } = await buildSnapshotItems(tx, items);
      const challanNumber = await nextChallanNumber(tx);

      return tx.challan.create({
        data: {
          challanNumber,
          customerId,
          createdById,
          totalQuantity,
          totalAmount,
          status: "DRAFT",
          items: { create: snapshotItems },
        },
        include: { items: true },
      });
    });
  },

  // Editing is only allowed while status = DRAFT. Re-snapshots items/pricing.
  async update(id: string, items?: ChallanItemInput[], customerId?: string) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({ where: { id } });
      if (!challan) throw ApiError.notFound("Challan not found");
      if (challan.status !== "DRAFT") {
        throw ApiError.badRequest("Only draft challans can be edited");
      }

      if (customerId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId }, select: { id: true } });
        if (!customer) throw ApiError.badRequest("Customer not found");
      }

      let updateData: Prisma.ChallanUpdateInput = {
        ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
      };

      if (items && items.length > 0) {
        const { snapshotItems, totalQuantity, totalAmount } = await buildSnapshotItems(tx, items);
        await tx.challanItem.deleteMany({ where: { challanId: id } });
        updateData = {
          ...updateData,
          totalQuantity,
          totalAmount,
          items: { create: snapshotItems },
        };
      }

      return tx.challan.update({ where: { id }, data: updateData, include: { items: true } });
    });
  },

  async cancel(id: string) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({ where: { id } });
      if (!challan) throw ApiError.notFound("Challan not found");
      if (challan.status !== "DRAFT") {
        throw ApiError.badRequest("Only draft challans can be cancelled");
      }
      return tx.challan.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    });
  },

  /**
   * Confirms a DRAFT challan:
   *  1. Re-checks status === DRAFT INSIDE the transaction (closes the
   *     duplicate-confirmation race — a second concurrent confirm request
   *     will see the already-updated status and be rejected).
   *  2. Verifies sufficient stock for every item.
   *  3. Deducts stock and writes OUT stock movements.
   *  4. Marks the challan CONFIRMED.
   * Any failure rolls back the entire transaction — no partial stock updates.
   */
  async confirm(id: string, confirmedById: string) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!challan) throw ApiError.notFound("Challan not found");

      if (challan.status === "CONFIRMED") {
        throw ApiError.badRequest("Challan has already been confirmed");
      }
      if (challan.status === "CANCELLED") {
        throw ApiError.badRequest("Cancelled challans cannot be confirmed");
      }
      if (challan.status !== "DRAFT") {
        throw ApiError.badRequest("Only draft challans can be confirmed");
      }

      // Verify stock for every item BEFORE mutating anything
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw ApiError.badRequest(`Product no longer exists: ${item.skuSnapshot}`);
        }
        if (product.currentStock < item.quantity) {
          throw ApiError.badRequest(
            `Insufficient stock for product ${product.sku} (available: ${product.currentStock}, required: ${item.quantity})`
          );
        }
      }

      // All sufficient — deduct stock and log OUT movements
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: "OUT",
            reason: `Challan ${challan.challanNumber} confirmed`,
            createdById: confirmedById,
            referenceType: "CHALLAN",
            referenceId: challan.id,
          },
        });
      }

      return tx.challan.update({
        where: { id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
        include: { items: true },
      });
    });
  },
};
