import { prisma } from "../config/prisma";

export const dashboardService = {
  async summary() {
    const [
      totalCustomers,
      activeCustomers,
      totalProducts,
      stockAgg,
      products,
      draftChallans,
      confirmedChallans,
      recentChallans,
      recentMovements,
      upcomingFollowUps,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: "ACTIVE" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.aggregate({ where: { isActive: true }, _sum: { currentStock: true } }),
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.challan.count({ where: { status: "DRAFT" } }),
      prisma.challan.count({ where: { status: "CONFIRMED" } }),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { customerName: true } } },
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { productName: true } } },
      }),
      prisma.customer.findMany({
        where: { followUpDate: { gte: new Date() } },
        orderBy: { followUpDate: "asc" },
        take: 5,
        select: { id: true, customerName: true, followUpDate: true },
      }),
    ]);

    const lowStockProducts = products.filter((p) => p.currentStock <= p.minimumStock);

    return {
      totalCustomers,
      activeCustomers,
      totalProducts,
      totalStockUnits: stockAgg._sum.currentStock ?? 0,
      lowStockCount: lowStockProducts.length,
      draftChallans,
      confirmedChallans,
      recentChallans,
      recentMovements,
      upcomingFollowUps,
    };
  },
};
