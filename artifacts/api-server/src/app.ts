import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app = express();

let _startupPromise: Promise<unknown> | null = null;
export function setStartupGate(p: Promise<unknown>): void { _startupPromise = p; }

app.use((_req: Request, _res: Response, next: NextFunction) => {
  if (_startupPromise) { _startupPromise.then(() => next(), () => next()); } else { next(); }
});

app.use(
  (pinoHttp as any)({
    logger,
    serializers: {
      req(req: Request) {
        return {
          id: (req as any).id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: Response) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// No-store on every API response (Vercel sets this via vercel.json too,
// but Render and direct hits don't honor that — middleware covers both).
app.use("/api", (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  next();
});

app.use("/api", router);

export default app;
