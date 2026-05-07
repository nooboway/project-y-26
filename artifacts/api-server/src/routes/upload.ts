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

import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

router.post(
  '/admin/upload',
  requireAdmin,
  (req: Request, res: Response): void => {
    // Process Upload
    (upload.single('file') as any)(req, res, (err: any) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }

      if (!req.file) {
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
            url_secure: result.secure_url,
          });
        }
      );

      stream.end(req.file.buffer);
    });
  }
);

export default router;
