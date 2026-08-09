import { Prisma, CustomerStatus, CustomerType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta, parsePagination } from "../utils/pagination";

interface ListCustomersParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
}

export const customerService = {
  async list(params: ListCustomersParams) {
    const { page, limit, skip } = parsePagination(params);

    const where: Prisma.CustomerWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.customerType ? { customerType: params.customerType } : {}),
      ...(params.search
        ? {
            OR: [
              { customerName: { contains: params.search, mode: "insensitive" } },
              { businessName: { contains: params.search, mode: "insensitive" } },
              { mobileNumber: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.customer.count({ where }),
    ]);

    return { items, meta: buildMeta(page, limit, total) };
  },

  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
        challans: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!customer) throw ApiError.notFound("Customer not found");
    return customer;
  },

  async create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({ data });
  },

  async update(id: string, data: Prisma.CustomerUpdateInput) {
    await this.assertExists(id);
    return prisma.customer.update({ where: { id }, data });
  },

  async deactivate(id: string) {
    await this.assertExists(id);
    return prisma.customer.update({ where: { id }, data: { status: "INACTIVE" } });
  },

  async assertExists(id: string) {
    const exists = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw ApiError.notFound("Customer not found");
  },
};
