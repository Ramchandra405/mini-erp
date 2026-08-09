import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta, parsePagination } from "../utils/pagination";

export const followUpService = {
  async listForCustomer(customerId: string, params: { page?: string; limit?: string }) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
    if (!customer) throw ApiError.notFound("Customer not found");

    const { page, limit, skip } = parsePagination(params);
    const [items, total] = await prisma.$transaction([
      prisma.customerFollowUp.findMany({
        where: { customerId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { name: true } } },
      }),
      prisma.customerFollowUp.count({ where: { customerId } }),
    ]);

    return { items, meta: buildMeta(page, limit, total) };
  },

  async create(customerId: string, createdById: string, note: string, followUpDate?: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
    if (!customer) throw ApiError.notFound("Customer not found");

    return prisma.customerFollowUp.create({
      data: {
        customerId,
        createdById,
        note,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      },
    });
  },
};
