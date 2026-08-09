import request from "supertest";
import app from "../src/server";
import { prisma } from "../src/config/prisma";

async function loginAs(email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password@123" });
  return res.body.data.token as string;
}

/**
 * Covers the FULL final-acceptance-test flow from the specification:
 * draft -> stock unchanged -> confirm -> stock reduced -> OUT movement
 * created -> duplicate confirmation rejected -> insufficient stock rejected
 * -> product snapshot preserved after the product is edited later.
 */
describe("Sales Challan business logic (critical)", () => {
  let salesToken: string;
  let customerId: string;
  let productId: string;

  beforeAll(async () => {
    salesToken = await loginAs("sales@example.com");

    const customer = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ customerName: "Challan Test Customer", mobileNumber: "9222222222", customerType: "RETAIL" });
    customerId = customer.body.data.id;

    const product = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ productName: "Challan Test Product", sku: `SKU-CH-${Date.now()}`, category: "Test", unitPrice: 20, currentStock: 100, minimumStock: 5 });
    productId = product.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("draft challan does NOT change stock", async () => {
    const draft = await request(app)
      .post("/api/challans")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ customerId, items: [{ productId, quantity: 10 }] });

    expect(draft.status).toBe(201);
    expect(draft.body.data.status).toBe("DRAFT");
    expect(draft.body.data.challanNumber).toMatch(/^CH-\d{4}-\d{6}$/);

    const product = await request(app)
      .get(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${salesToken}`);
    expect(product.body.data.currentStock).toBe(100);
  });

  it("confirming reduces stock, creates OUT movement, and rejects duplicate confirmation", async () => {
    const draft = await request(app)
      .post("/api/challans")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ customerId, items: [{ productId, quantity: 10 }] });
    const challanId = draft.body.data.id;

    const confirmed = await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set("Authorization", `Bearer ${salesToken}`);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.status).toBe("CONFIRMED");

    const product = await request(app)
      .get(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${salesToken}`);
    expect(product.body.data.currentStock).toBe(90);

    const movements = await request(app)
      .get(`/api/inventory/movements?productId=${productId}&movementType=OUT`)
      .set("Authorization", `Bearer ${salesToken}`);
    expect(movements.body.data.items.some((m: any) => m.quantity === 10)).toBe(true);

    // Duplicate confirmation must be rejected and stock must not change again
    const duplicate = await request(app)
      .post(`/api/challans/${challanId}/confirm`)
      .set("Authorization", `Bearer ${salesToken}`);
    expect(duplicate.status).toBe(400);
    expect(duplicate.body.message).toMatch(/already been confirmed/i);

    const stillNinety = await request(app)
      .get(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${salesToken}`);
    expect(stillNinety.body.data.currentStock).toBe(90);
  });

  it("rejects confirmation when requested quantity exceeds available stock, with no partial update", async () => {
    const before = await request(app)
      .get(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${salesToken}`);
    const stockBefore = before.body.data.currentStock;

    const draft = await request(app)
      .post("/api/challans")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ customerId, items: [{ productId, quantity: stockBefore + 1000 }] });

    const res = await request(app)
      .post(`/api/challans/${draft.body.data.id}/confirm`)
      .set("Authorization", `Bearer ${salesToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient stock/i);

    const after = await request(app)
      .get(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${salesToken}`);
    expect(after.body.data.currentStock).toBe(stockBefore);
  });

  it("preserves the historical product snapshot even after the product is edited", async () => {
    const draft = await request(app)
      .post("/api/challans")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ customerId, items: [{ productId, quantity: 1 }] });

    const originalSnapshotName = draft.body.data.items[0].productNameSnapshot;

    await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ productName: "Renamed After Challan Created" });

    const fetched = await request(app)
      .get(`/api/challans/${draft.body.data.id}`)
      .set("Authorization", `Bearer ${salesToken}`);

    expect(fetched.body.data.items[0].productNameSnapshot).toBe(originalSnapshotName);
    expect(fetched.body.data.items[0].productNameSnapshot).not.toBe("Renamed After Challan Created");
  });

  it("generates unique, sequential challan numbers", async () => {
    const a = await request(app)
      .post("/api/challans")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ customerId, items: [{ productId, quantity: 1 }] });
    const b = await request(app)
      .post("/api/challans")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ customerId, items: [{ productId, quantity: 1 }] });

    expect(a.body.data.challanNumber).not.toBe(b.body.data.challanNumber);
  });
});
