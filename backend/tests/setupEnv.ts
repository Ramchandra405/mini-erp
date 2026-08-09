process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/test?schema=public";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.NODE_ENV = "test";
