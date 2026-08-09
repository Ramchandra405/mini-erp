import request from "supertest";
import app from "../src/server";
import { prisma } from "../src/config/prisma";

let salesToken: string;

async function loginAs(email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: "Password@123" });
  return res.body.data.token as string;
}

describe("Customer CRM", () => {
  beforeAll(async () => {
    salesToken = await loginAs("sales@example.com");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a customer with required fields", async () => {
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({
        customerName: "Acme Corp",
        mobileNumber: "9876543210",
        customerType: "WHOLESALE",
        status: "LEAD",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.customerName).toBe("Acme Corp");
  });

  it("paginates and searches customers", async () => {
    const res = await request(app)
      .get("/api/customers?page=1&limit=5&search=Acme")
      .set("Authorization", `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.meta.limit).toBe(5);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it("adds and lists follow-ups for a customer", async () => {
    const created = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ customerName: "Followup Co", mobileNumber: "9111111111", customerType: "RETAIL" });

    const customerId = created.body.data.id;

    const followUp = await request(app)
      .post(`/api/customers/${customerId}/followups`)
      .set("Authorization", `Bearer ${salesToken}`)
      .send({ note: "Called customer, interested in bulk order" });

    expect(followUp.status).toBe(201);

    const list = await request(app)
      .get(`/api/customers/${customerId}/followups`)
      .set("Authorization", `Bearer ${salesToken}`);

    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThanOrEqual(1);
  });
});
