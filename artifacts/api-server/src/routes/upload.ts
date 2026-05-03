import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB — covers video
});

// requireAdmin is duplicated here to avoid circular imports.
// If the project has a shared auth middleware, use that instead.
import crypto from 'node:crypto';
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET ?? 'for-yin-secret-please-rotate';

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [ts, nonce, sig] = parts;
  const expect = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${ts}.${nonce}`)
    .digest('hex');
  if (sig.length !== expect.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
}

function requireAdmin(req: any, res: any, next: any): void {
  if (!verifyToken(req.header('x-admin-token'))) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

const router = express.Router();

router.post(
  '/admin/upload',
  requireAdmin,
  upload.single('file'),
  async (req: any, res: any): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }
    // Determine Cloudinary resource_type from MIME type
    // Cloudinary uses 'video' for both video AND audio
    const mime = req.file.mimetype ?? '';
    const resourceType: 'image' | 'video' | 'raw' = mime.startsWith('video/')
      ? 'video'
      : mime.startsWith('audio/')
      ? 'video'
      : mime.startsWith('image/')
      ? 'image'
      : 'raw';

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'project-y-26',
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
          },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(req.file!.buffer);
      });
      res.json({
        url: result.secure_url as string,
        publicId: result.public_id as string,
        resourceType: result.resource_type as string,
        format: result.format as string,
        width: result.width as number | undefined,
        height: result.height as number | undefined,
        duration: result.duration as number | undefined,
        bytes: result.bytes as number,
      });
    } catch (err: any) {
      console.error('[upload] cloudinary error', err);
      res.status(500).json({ error: err?.message ?? 'Upload failed' });
    }
  }
);

export default router;
