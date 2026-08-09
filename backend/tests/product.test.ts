import request from "supertest";
import app from "../src/server";
import { prisma } from "../src/config/prisma";

let adminToken: string;

async function loginAs(email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password@123" });
  return res.body.data.token as string;
}

describe("Product + Inventory", () => {
  beforeAll(async () => {
    adminToken = await loginAs("admin@example.com");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ productName: "Test Widget", sku: `SKU-TEST-${Date.now()}`, category: "Test", unitPrice: 50, currentStock: 100, minimumStock: 10 });

    expect(res.status).toBe(201);
    expect(res.body.data.currentStock).toBe(100);
  });

  it("rejects a manual OUT movement larger than current stock", async () => {
    const product = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ productName: "Low Stock Widget", sku: `SKU-LOW-${Date.now()}`, category: "Test", unitPrice: 10, currentStock: 5, minimumStock: 1 });

    const res = await request(app)
      .post("/api/inventory/movements")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ productId: product.body.data.id, quantity: 10, movementType: "OUT", reason: "Test overdraw" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient stock/i);

    const unchanged = await request(app)
      .get(`/api/products/${product.body.data.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(unchanged.body.data.currentStock).toBe(5);
  });
});
