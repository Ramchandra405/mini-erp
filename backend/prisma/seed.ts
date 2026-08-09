import { PrismaClient, CustomerType, CustomerStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding database...");

  const passwordHash = await hash("Password@123");

  const [admin, sales, warehouse, accounts] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: { name: "Admin User", email: "admin@example.com", passwordHash, role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: "sales@example.com" },
      update: {},
      create: { name: "Sales User", email: "sales@example.com", passwordHash, role: "SALES" },
    }),
    prisma.user.upsert({
      where: { email: "warehouse@example.com" },
      update: {},
      create: { name: "Warehouse User", email: "warehouse@example.com", passwordHash, role: "WAREHOUSE" },
    }),
    prisma.user.upsert({
      where: { email: "accounts@example.com" },
      update: {},
      create: { name: "Accounts User", email: "accounts@example.com", passwordHash, role: "ACCOUNTS" },
    }),
  ]);

  console.log("Users seeded:", [admin.email, sales.email, warehouse.email, accounts.email]);

  const customerTypes: CustomerType[] = ["RETAIL", "WHOLESALE", "DISTRIBUTOR"];
  const statuses: CustomerStatus[] = ["LEAD", "ACTIVE", "INACTIVE"];

  const customers = [];
  for (let i = 1; i <= 10; i++) {
    const customer = await prisma.customer.create({
      data: {
        customerName: `Customer ${i}`,
        mobileNumber: `9000000${String(i).padStart(3, "0")}`,
        email: `customer${i}@example.com`,
        businessName: `Business ${i} Pvt Ltd`,
        gstNumber: i % 3 === 0 ? undefined : `GST${1000 + i}`,
        customerType: customerTypes[i % customerTypes.length],
        address: `${i} Market Street, City`,
        status: statuses[i % statuses.length],
        followUpDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        notes: `Initial notes for customer ${i}`,
      },
    });
    customers.push(customer);
  }
  console.log(`Seeded ${customers.length} customers`);

  const categories = ["Electronics", "Hardware", "Stationery", "Packaging", "Tools"];
  const products = [];
  for (let i = 1; i <= 15; i++) {
    const product = await prisma.product.create({
      data: {
        productName: `Product ${i}`,
        sku: `SKU-${String(i).padStart(4, "0")}`,
        category: categories[i % categories.length],
        unitPrice: (100 + i * 25).toFixed(2),
        currentStock: i % 5 === 0 ? 5 : 100, // some low-stock examples
        minimumStock: 10,
        warehouseLocation: `Rack-${(i % 4) + 1}`,
      },
    });
    products.push(product);
  }
  console.log(`Seeded ${products.length} products`);

  // A few manual stock movements
  for (let i = 0; i < 5; i++) {
    const product = products[i];
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity: 20,
        movementType: "IN",
        reason: "Initial stock receipt",
        createdById: warehouse.id,
        referenceType: "MANUAL",
      },
    });
  }
  console.log("Seeded initial stock movements");

  // Follow-ups
  for (let i = 0; i < 5; i++) {
    await prisma.customerFollowUp.create({
      data: {
        customerId: customers[i].id,
        note: `Follow-up call scheduled with ${customers[i].customerName}`,
        followUpDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        createdById: sales.id,
      },
    });
  }
  console.log("Seeded customer follow-ups");

  // A handful of challans: some draft, some confirmed
  for (let i = 0; i < 4; i++) {
    const customer = customers[i];
    const product = products[i + 5];

    const year = new Date().getFullYear();
    const counter = await prisma.challanCounter.upsert({
      where: { year },
      create: { year, count: 1 },
      update: { count: { increment: 1 } },
    });
    const challanNumber = `CH-${year}-${String(counter.count).padStart(6, "0")}`;

    const quantity = 5;
    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId: customer.id,
        createdById: sales.id,
        totalQuantity: quantity,
        totalAmount: product.unitPrice.mul(quantity),
        status: i % 2 === 0 ? "CONFIRMED" : "DRAFT",
        confirmedAt: i % 2 === 0 ? new Date() : null,
        items: {
          create: [
            {
              productId: product.id,
              productNameSnapshot: product.productName,
              skuSnapshot: product.sku,
              unitPriceSnapshot: product.unitPrice,
              quantity,
            },
          ],
        },
      },
    });

    if (challan.status === "CONFIRMED") {
      await prisma.product.update({
        where: { id: product.id },
        data: { currentStock: { decrement: quantity } },
      });
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          quantity,
          movementType: "OUT",
          reason: `Challan ${challan.challanNumber} confirmed`,
          createdById: sales.id,
          referenceType: "CHALLAN",
          referenceId: challan.id,
        },
      });
    }
  }
  console.log("Seeded sample challans (draft + confirmed)");

  console.log("Seeding complete.");
  console.log("\nTest accounts (password for all: Password@123):");
  console.log("  admin@example.com     (ADMIN)");
  console.log("  sales@example.com     (SALES)");
  console.log("  warehouse@example.com (WAREHOUSE)");
  console.log("  accounts@example.com  (ACCOUNTS)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
