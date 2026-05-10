import express from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router = express.Router();

router.get("/healthz", async (_req: any, res: any) => {
  // Deep check — verifies DB connectivity, not just process liveness.
  let dbOk = false;
  let dbErr: string | undefined;
  const t0 = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      dbOk = true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    dbErr = err?.message ?? String(err);
  }
  const dbMs = Date.now() - t0;
  const status = dbOk ? "ok" : "degraded";
  // Validate `status` shape for the OpenAPI contract, then enrich for diagnostics.
  HealthCheckResponse.parse({ status });
  res.status(dbOk ? 200 : 503).json({
    status,
    db: dbOk ? "ok" : "fail",
    dbMs,
    ...(dbErr ? { dbErr } : {}),
  });
});

export default router;
