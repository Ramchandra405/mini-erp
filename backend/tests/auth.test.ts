import request from "supertest";
import app from "../src/server";
import { prisma } from "../src/config/prisma";

describe("Auth", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects login with invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("logs in successfully with seeded admin credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "Password@123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe("ADMIN");
  });

  it("rejects protected routes without a token", async () => {
    const res = await request(app).get("/api/customers");
    expect(res.status).toBe(401);
  });

  it("rejects WAREHOUSE role from creating a customer (RBAC)", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "warehouse@example.com", password: "Password@123" });

    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${login.body.data.token}`)
      .send({ customerName: "Test", mobileNumber: "9999999999", customerType: "RETAIL" });

    expect(res.status).toBe(403);
  });
});
