import { Router } from 'express';
import { db } from '../firebase.js';
import { requireAdmin } from '../middleware/auth.js';
import { deleteByUrl } from '../lib/uploads.js';

const router = Router();

// Public: ordered list of approved & active ads for the TV loop
router.get('/playlist', async (_req, res) => {
  try {
    const now = Date.now();
    const snap = await db().collection('ads').where('status', '==', 'approved').get();

    const ads = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((ad) => {
        const startOk = !ad.startsAt || ad.startsAt <= now;
        const endOk = !ad.endsAt || ad.endsAt >= now;
        return startOk && endOk;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    res.json({ ads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', requireAdmin, async (_req, res) => {
  const snap = await db().collection('ads').orderBy('order', 'asc').get();
  res.json({ ads: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    const videoUrl = req.body.videoUrl?.trim();
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    if (!videoUrl) return res.status(400).json({ error: 'A video URL is required.' });

    const tail = await db().collection('ads').orderBy('order', 'desc').limit(1).get();
    const nextOrder = tail.empty ? 0 : (tail.docs[0].data().order ?? 0) + 1;

    const ref = db().collection('ads').doc();
    await ref.set({
      title,
      videoUrl,
      source: 'house',
      status: 'approved',
      order: nextOrder,
      createdAt: Date.now(),
      createdBy: req.user.uid,
    });
    res.json({ id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db().collection('ads').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Ad not found.' });
    const existing = snap.data();

    const updates = { updatedAt: Date.now() };
    if (typeof req.body.title === 'string') updates.title = req.body.title.trim();
    if (typeof req.body.status === 'string') updates.status = req.body.status;

    if (typeof req.body.videoUrl === 'string' && req.body.videoUrl) {
      deleteByUrl(existing.videoUrl);
      updates.videoUrl = req.body.videoUrl;
    }

    await ref.update(updates);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const ref = db().collection('ads').doc(req.params.id);
  const snap = await ref.get();
  if (snap.exists) deleteByUrl(snap.data().videoUrl);
  await ref.delete();
  res.json({ ok: true });
});

router.post('/reorder', requireAdmin, async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array of ids' });

  const batch = db().batch();
  order.forEach((id, i) => {
    batch.update(db().collection('ads').doc(id), { order: i });
  });
  await batch.commit();
  res.json({ ok: true });
});

router.post('/:id/review', requireAdmin, async (req, res) => {
  const { decision, note } = req.body || {};
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approved or rejected' });
  }
  await db().collection('ads').doc(req.params.id).update({
    status: decision,
    reviewNote: note ?? null,
    reviewedAt: Date.now(),
    reviewedBy: req.user.uid,
  });
  res.json({ ok: true });
});

export default router;
