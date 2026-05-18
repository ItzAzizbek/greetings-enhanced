import multer from 'multer';
import path from 'node:path';
import { cloudinary, uploadBuffer } from './cloudinary.js';

const KIND_TO_RESOURCE = {
  people: 'image',
  ads: 'video',
};

function makeUpload({ allowedMime, allowedExt, maxSizeMb, label }) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (allowedMime.test(file.mimetype)) return cb(null, true);
      // Some browsers/OSes send a generic mimetype (e.g. application/octet-stream)
      // for formats like .mov — fall back to the file extension in that case.
      const ext = path.extname(file.originalname || '').toLowerCase();
      if (allowedExt && ext && allowedExt.has(ext)) return cb(null, true);
      cb(new Error(`${label}: unsupported file type (${file.mimetype}).`));
    },
  });
}

export const imageUpload = makeUpload({
  allowedMime: /^image\/(jpeg|jpg|png|webp|gif)$/,
  allowedExt: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']),
  maxSizeMb: 5,
  label: 'Photo',
});

export const videoUpload = makeUpload({
  allowedMime: /^video\/(mp4|webm|quicktime|ogg|x-matroska)$/,
  allowedExt: new Set(['.mp4', '.webm', '.mov', '.qt', '.ogv', '.mkv']),
  maxSizeMb: 200,
  label: 'Video',
});

// Uploads to Cloudinary under <kind>/<id> and returns the secure URL.
// Previously returned just a filename and the caller composed a URL via
// publicUrl(); now publicUrl is a pass-through so existing routes keep working.
export async function saveUpload(file, kind, id) {
  const result = await uploadBuffer({
    buffer: file.buffer,
    folder: kind,
    publicId: id,
    resourceType: KIND_TO_RESOURCE[kind] || 'auto',
  });
  return result.secure_url;
}

export function publicUrl(_req, _kind, filenameOrUrl) {
  return filenameOrUrl;
}

export async function deleteByUrl(url) {
  if (!url) return;
  // Cloudinary URLs:
  //   https://res.cloudinary.com/<cloud>/(image|video)/upload/v123/<folder>/<publicId>.<ext>
  const m = /res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/.exec(
    url,
  );
  if (!m) return;
  try {
    await cloudinary.uploader.destroy(m[2], {
      resource_type: m[1],
      invalidate: true,
    });
  } catch {
    // best-effort cleanup
  }
}

export function safeUnlink(_filePath) {
  // memory storage — nothing to clean up
}
