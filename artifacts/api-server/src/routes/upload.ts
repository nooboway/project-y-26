import express, { Request, Response } from 'express';
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
  return sig === expect;
}

const router = express.Router();

router.post(
  '/admin/upload',
  (req: Request, res: Response): void => {
    // HMAC Verification
    const token = req.headers['x-admin-token'];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [receivedHmac, timestamp] = String(token).split('.');
    if (!receivedHmac || !timestamp) {
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }

    const expectedHmac = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(timestamp)
      .digest('hex');

    if (receivedHmac !== expectedHmac) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const tokenTime = parseInt(timestamp, 10);
    if (now - tokenTime > 60 * 60 * 24) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }

    // Process Upload
    upload.single('file')(req as any, res as any, (err: any) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }

      if (!(req as any).file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Upload to Cloudinary using stream
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'project-y-26',
          resource_type: 'auto',
        },
        (error: any, result: any) => {
          if (error) {
            res.status(500).json({ error: error.message });
            return;
          }
          res.json({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            width: result.width,
            height: result.height,
            duration: result.duration,
            bytes: result.bytes,
          });
        }
      );

      stream.end((req as any).file.buffer);
    });
  }
);

export default router;
