// Vercel serverless entry — exports the Express app without calling listen()
import app from "./app.js";
import { ensureSeed } from "./lib/seed.js";

ensureSeed().catch(() => {});

export default app;
