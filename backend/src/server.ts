import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`Mini ERP + CRM backend listening on port ${env.port} [${env.nodeEnv}]`);
  });
}

export default app;
