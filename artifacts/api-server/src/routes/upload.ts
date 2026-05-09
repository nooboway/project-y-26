import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { normaliseExternalUrl } from "../lib/urlNormalise.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Vercel serverless caps request bodies at ~4.5 MB. Files larger than that
// (long voice notes, video) must use /admin/upload-url — paste a URL and
// Cloudinary fetches it server-side. No file bytes pass through this server.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

type UploadResult = {
  url: string; publicId: string; resourceType: string;
  format?: string; width?: number; height?: number; duration?: number; bytes?: number;
};

function fromResult(r: any): UploadResult {
  return {
    url: r.secure_url, publicId: r.public_id, resourceType: r.resource_type,
    format: r.format, width: r.width, height: r.height, duration: r.duration, bytes: r.bytes,
  };
}

function uploadBuffer(buf: Buffer): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "project-y-26", resource_type: "auto", use_filename: true, unique_filename: true },
      (err, result) => (err || !result ? reject(err ?? new Error("Upload failed")) : resolve(fromResult(result)))
    );
    stream.end(buf);
  });
}

const router = express.Router();

// Multipart file — images, audio up to 4 MB
router.post("/admin/upload", requireAdmin, upload.single("file"),
  async (req: any, res: any): Promise<void> => {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    try { res.json(await uploadBuffer(req.file.buffer)); }
    catch (err: any) { res.status(500).json({ error: err?.message ?? "Upload failed" }); }
  }
);

// URL paste — YouTube/Vimeo/SoundCloud returned as-is for embed;
// Dropbox/Drive/direct re-hosted permanently via Cloudinary
router.post("/admin/upload-url", requireAdmin,
  async (req: any, res: any): Promise<void> => {
    const raw = String(req.body?.url ?? "").trim();
    if (!raw) { res.status(400).json({ error: "Missing url" }); return; }
    const decided = normaliseExternalUrl(raw);
    if (decided.kind === "embed") {
      res.json({ url: decided.url, embed: true, provider: decided.provider }); return;
    }
    try {
      const result = await cloudinary.uploader.upload(decided.url, {
        folder: "project-y-26", resource_type: "auto",
        use_filename: true, unique_filename: true,
      });
      res.json(fromResult(result));
    } catch (err: any) {
      res.status(502).json({ error: err?.message ?? "Cloudinary fetch failed" });
    }
  }
);

export default router;
