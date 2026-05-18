import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';

// On Vercel the working dir (/var/task) is read-only, so write under /tmp
// (writable but ephemeral). Local/long-lived hosts keep the repo-relative path.
const UPLOADS_ROOT = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.resolve(process.cwd(), 'uploads');
const TMP_DIR = path.join(UPLOADS_ROOT, 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

function makeUpload({ allowedMime, allowedExt, maxSizeMb, label }) {
  return multer({
    dest: TMP_DIR,
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

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/ogg': '.ogv',
  'video/x-matroska': '.mkv',
};

export function extFor(file) {
  const fromName = path.extname(file.originalname || '').toLowerCase();
  if (fromName) return fromName;
  return EXT_BY_MIME[file.mimetype] || '';
}

export function dirFor(kind) {
  const dir = path.join(UPLOADS_ROOT, kind);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function publicUrl(req, kind, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${kind}/${filename}`;
}

export async function saveUpload(file, kind, id) {
  const filename = `${id}${extFor(file)}`;
  await fs.promises.rename(file.path, path.join(dirFor(kind), filename));
  return filename;
}

export function safeUnlink(filePath) {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
}

// Given a stored absolute URL like http://host/uploads/<kind>/<filename>,
// delete the corresponding file from disk. No-op if URL is foreign or missing.
export function deleteByUrl(url) {
  if (!url) return;
  const m = /\/uploads\/([^/]+)\/([^/?#]+)$/.exec(url);
  if (!m) return;
  const filePath = path.join(UPLOADS_ROOT, m[1], m[2]);
  fs.promises.unlink(filePath).catch(() => {});
}
