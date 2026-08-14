import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.frontendUrl
      .split(",")
      .map((s) => s.trim()),
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes
app.use("/api", routes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(env.port, "0.0.0.0", () => {
    console.log(
      `Mini ERP + CRM backend listening on port ${env.port} [${env.nodeEnv}]`
    );
  });
}

export default app;
