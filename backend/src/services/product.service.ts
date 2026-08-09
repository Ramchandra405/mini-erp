import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta, parsePagination } from "../utils/pagination";

interface ListProductsParams {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  lowStock?: string;
}

export const productService = {
  async list(params: ListProductsParams) {
    const { page, limit, skip } = parsePagination(params);

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(params.category ? { category: params.category } : {}),
      ...(params.search
        ? {
            OR: [
              { productName: { contains: params.search, mode: "insensitive" } },
              { sku: { contains: params.search, mode: "insensitive" } },
              { category: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    let items = await prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } });
    let total = await prisma.product.count({ where });

    if (params.lowStock === "true") {
      // low-stock filtering done post-query since it compares two columns
      const all = await prisma.product.findMany({ where });
      const low = all.filter((p) => p.currentStock <= p.minimumStock);
      total = low.length;
      items = low.slice(skip, skip + limit);
    }

    return { items, meta: buildMeta(page, limit, total) };
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw ApiError.notFound("Product not found");
    return product;
  },

  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  },

  async update(id: string, data: Prisma.ProductUpdateInput) {
    await this.assertExists(id);
    return prisma.product.update({ where: { id }, data });
  },

  async deactivate(id: string) {
    await this.assertExists(id);
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  },

  async assertExists(id: string) {
    const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw ApiError.notFound("Product not found");
  },
};
