import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { Request, Response } from "express";
import app from "./app.js"; 
import { ensureSeed } from "./lib/seed.js";
import { logger } from "./lib/logger.js";

const __filename = fileURLToPath((import.meta as any).url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 10000;

// Ensure DB is seeded (for Render/standalone deployments)
ensureSeed().catch((err) => {
  logger.error({ err }, "Failed to seed database on startup");
});

// Serve the compiled React app from artifacts/for-yin/dist/public
// Note: In the bundled output (dist/server.mjs), __dirname is artifacts/api-server/dist
const frontendDistPath = path.resolve(__dirname, "../../../artifacts/for-yin/dist/public");
app.use(express.static(frontendDistPath));

// Fallback all other GET requests to the React app (client-side routing)
app.get(/(.*)/, (req: Request, res: Response) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server listening (Standalone/Render mode)");
});
