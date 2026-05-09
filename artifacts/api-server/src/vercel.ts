// Vercel serverless entry — exports the Express app without calling listen()
import app, { setStartupGate } from "./app.js";
import { ensureMigrate } from "./lib/migrate.js";
import { ensureSeed } from "./lib/seed.js";

const ready = ensureMigrate()
  .then(() => ensureSeed())
  .catch((err) => {
    console.error("[startup] migrate/seed failed:", err);
  });

setStartupGate(ready);

export default app;
