// Stars = entries in the `entrances` collection. Each detection writes a
// row there; admins can also add curated stars (named memories, milestones)
// and edit or remove existing ones.
import { Router } from 'express';
import { db } from '../firebase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const MAX_LIMIT = 500;

function serialize(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    personId: data.personId,
    name: data.name ?? null,
    at: data.at,
    label: data.label ?? null,
    pinned: data.pinned === true,
    source: data.source ?? 'auto',
  };
}

// Public: kiosk fetches a person's sky to render the constellation.
router.get('/:personId', async (req, res) => {
  const { personId } = req.params;
  if (!personId) return res.status(400).json({ error: 'personId required' });

  const limit = Math.min(Number(req.query.limit ?? MAX_LIMIT), MAX_LIMIT);
  const snap = await db()
    .collection('entrances')
    .where('personId', '==', personId)
    .orderBy('at', 'asc')
    .limit(limit)
    .get();

  res.json({ stars: snap.docs.map(serialize) });
});

// Admin: add a curated star. Useful for backdating memories, marking
// milestones, or rebuilding a sky after a Firestore reset.
router.post('/:personId', requireAdmin, async (req, res) => {
  const { personId } = req.params;
  const personRef = db().collection('persons').doc(personId);
  const personSnap = await personRef.get();
  if (!personSnap.exists) return res.status(404).json({ error: 'Unknown person' });

  const body = req.body || {};
  const at = Number(body.at) || Date.now();
  const label = typeof body.label === 'string' ? body.label.trim() || null : null;
  const pinned = body.pinned === true;

  const ref = await db().collection('entrances').add({
    personId,
    name: personSnap.data().name ?? null,
    at,
    label,
    pinned,
    source: 'manual',
  });

  res.json({ star: { id: ref.id, personId, at, label, pinned, source: 'manual' } });
});

// Admin: edit a star's label / pinned flag, or shift its timestamp.
router.patch('/:starId', requireAdmin, async (req, res) => {
  const ref = db().collection('entrances').doc(req.params.starId);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: 'Unknown star' });

  const body = req.body || {};
  const updates = {};
  if (typeof body.label === 'string') updates.label = body.label.trim() || null;
  if (typeof body.pinned === 'boolean') updates.pinned = body.pinned;
  if (typeof body.at === 'number' && Number.isFinite(body.at)) updates.at = body.at;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No editable fields supplied' });
  }

  await ref.update(updates);
  res.json({ ok: true });
});

// Admin: remove a star from the sky.
router.delete('/:starId', requireAdmin, async (req, res) => {
  await db().collection('entrances').doc(req.params.starId).delete();
  res.json({ ok: true });
});

export default router;
