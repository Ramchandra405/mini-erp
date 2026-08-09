import { Prisma } from "@prisma/client";

// Atomically allocates the next challan number for the current year using an
// upsert+increment on a per-year counter row. Must be called INSIDE the same
// transaction as the challan creation to guarantee uniqueness under concurrency.
export async function nextChallanNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();

  const counter = await tx.challanCounter.upsert({
    where: { year },
    create: { year, count: 1 },
    update: { count: { increment: 1 } },
  });

  const padded = String(counter.count).padStart(6, "0");
  return `CH-${year}-${padded}`;
}
