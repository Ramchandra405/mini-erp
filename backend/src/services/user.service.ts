import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { hashPassword } from "../utils/password";
import { buildMeta, parsePagination } from "../utils/pagination";

const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userService = {
  async list(params: { page?: string; limit?: string }) {
    const { page, limit, skip } = parsePagination(params);
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: "desc" }, select: safeSelect }),
      prisma.user.count(),
    ]);
    return { items, meta: buildMeta(page, limit, total) };
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: safeSelect });
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  async create(input: { name: string; email: string; password: string; role: Prisma.UserCreateInput["role"] }) {
    const passwordHash = await hashPassword(input.password);
    return prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, role: input.role },
      select: safeSelect,
    });
  },

  async update(id: string, data: { name?: string; role?: Prisma.UserCreateInput["role"]; password?: string }) {
    const updateData: Prisma.UserUpdateInput = { name: data.name, role: data.role };
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }
    return prisma.user.update({ where: { id }, data: updateData, select: safeSelect });
  },

  async deactivate(id: string) {
    return prisma.user.update({ where: { id }, data: { isActive: false }, select: safeSelect });
  },
};
