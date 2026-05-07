import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET ?? "for-yin-secret-please-rotate";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export function makeToken(): string {
  const payload = `${Date.now()}.${crypto.randomBytes(16).toString("hex")}`;
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ts, nonce, sig] = parts;
  const expect = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${ts}.${nonce}`)
    .digest("hex");
  if (sig.length !== expect.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return false;
  const issuedAt = Number.parseInt(ts, 10);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > TOKEN_TTL_MS) return false;
  return true;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!verifyToken(req.header("x-admin-token"))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
