import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { signUpload } from '../lib/cloudinary.js';

const router = Router();

const KIND_TO_RESOURCE = {
  people: 'image',
  ads: 'video',
};

// Returns signed Cloudinary upload params so the browser can POST the file
// directly. Bypasses Vercel's 4.5 MB serverless payload limit.
router.post('/sign', requireUser, (req, res) => {
  const { kind } = req.body || {};
  const resourceType = KIND_TO_RESOURCE[kind];
  if (!resourceType) {
    return res.status(400).json({ error: 'kind must be "people" or "ads".' });
  }
  res.json(signUpload({ folder: kind, resourceType }));
});

export default router;
