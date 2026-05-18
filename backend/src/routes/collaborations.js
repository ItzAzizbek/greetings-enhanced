import { Router } from 'express';
import { db } from '../firebase.js';
import { requireUser, requireAdmin } from '../middleware/auth.js';
import { deleteByUrl } from '../lib/uploads.js';

const router = Router();

const DAILY_RATE_CENTS = 2000; // $20/day default rate

function priceFor({ startsAt, endsAt }) {
  const days = Math.max(1, Math.ceil((endsAt - startsAt) / (1000 * 60 * 60 * 24)));
  return { days, amountCents: days * DAILY_RATE_CENTS };
}

// Submit a new collaboration request. Returns the adId and pricing so the
// frontend can show its own mock checkout page before calling /mock-pay.
router.post('/', requireUser, async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    const brand = req.body.brand?.trim() || null;
    const contactEmail = req.body.contactEmail?.trim() || null;
    const videoUrl = req.body.videoUrl?.trim();
    const startsAt = Number(req.body.startsAt);
    const endsAt = Number(req.body.endsAt);

    if (!title || !videoUrl || !startsAt || !endsAt) {
      return res
        .status(400)
        .json({ error: 'title, videoUrl, startsAt, and endsAt are required.' });
    }

    const { days, amountCents } = priceFor({ startsAt, endsAt });
    const adRef = db().collection('ads').doc();

    await adRef.set({
      title,
      videoUrl,
      source: 'collaboration',
      status: 'pending_payment',
      order: 9999,
      brand,
      contactEmail,
      startsAt,
      endsAt,
      submittedBy: req.user.uid,
      amountCents,
      days,
      createdAt: Date.now(),
    });

    res.json({
      adId: adRef.id,
      title,
      days,
      amountCents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Caller's own collaboration submissions
router.get('/mine', requireUser, async (req, res) => {
  const snap = await db().collection('ads').where('submittedBy', '==', req.user.uid).get();
  const submissions = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  res.json({ submissions });
});

// Admin queue of items awaiting review (paid)
router.get('/queue', requireAdmin, async (_req, res) => {
  const snap = await db().collection('ads').where('status', '==', 'pending_review').get();
  const queue = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  res.json({ queue });
});

// Mock checkout: marks an ad as paid. Demo-only — no real charge happens.
router.post('/:id/mock-pay', requireUser, async (req, res) => {
  const ref = db().collection('ads').doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: 'Not found' });
  if (snap.data().submittedBy !== req.user.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await ref.update({
    status: 'pending_review',
    paidAt: Date.now(),
    mockPayment: true,
  });
  res.json({ ok: true });
});

// Cancel a pending placement (user backed out of mock checkout).
router.post('/:id/cancel', requireUser, async (req, res) => {
  const ref = db().collection('ads').doc(req.params.id);
  const snap = await ref.get();
  if (!snap.exists) return res.json({ ok: true });
  const ad = snap.data();
  if (ad.submittedBy !== req.user.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (ad.status !== 'pending_payment') {
    return res.status(400).json({ error: 'Cannot cancel a placement that is not pending payment.' });
  }
  deleteByUrl(ad.videoUrl);
  await ref.delete();
  res.json({ ok: true });
});

export default router;
