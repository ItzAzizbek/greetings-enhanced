import { Router } from 'express';
import { db } from '../firebase.js';
import { requireAdmin } from '../middleware/auth.js';
import { deleteByUrl } from '../lib/uploads.js';
import { parseBirthday } from '../lib/birthday.js';

const router = Router();

router.get('/', requireAdmin, async (_req, res) => {
  const snap = await db().collection('persons').orderBy('name').get();
  res.json({ persons: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const greeting = req.body.greeting?.trim() || null;
    const linkedUserId = req.body.linkedUserId?.trim() || null;
    const photoUrl = req.body.photoUrl?.trim() || null;

    if (!name) return res.status(400).json({ error: 'Name is required.' });

    let birthday = null;
    if (req.body.birthday) {
      const parsed = parseBirthday(req.body.birthday);
      if (parsed?.error) {
        return res.status(400).json({ error: `Birthday: ${parsed.error}` });
      }
      birthday = parsed?.value ?? null;
    }

    const ref = db().collection('persons').doc();
    await ref.set({
      name,
      greeting: greeting ?? `Welcome, ${name}.`,
      linkedUserId,
      photoUrl,
      birthday,
      entries: 0,
      streak: 0,
      lastSeen: null,
      createdAt: Date.now(),
    });
    res.json({ id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db().collection('persons').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'Person not found.' });
    }
    const existing = snap.data();

    const updates = { updatedAt: Date.now() };
    if (typeof req.body.name === 'string') updates.name = req.body.name.trim();
    if (typeof req.body.greeting === 'string') updates.greeting = req.body.greeting.trim();
    if (typeof req.body.linkedUserId === 'string') {
      updates.linkedUserId = req.body.linkedUserId.trim() || null;
    }
    if (typeof req.body.birthday === 'string') {
      if (req.body.birthday.trim() === '') {
        updates.birthday = null;
      } else {
        const parsed = parseBirthday(req.body.birthday);
        if (parsed?.error) {
          return res.status(400).json({ error: `Birthday: ${parsed.error}` });
        }
        updates.birthday = parsed.value;
      }
    }
    if (req.body.removePhoto === true || req.body.removePhoto === 'true') {
      deleteByUrl(existing.photoUrl);
      updates.photoUrl = null;
    }
    if (typeof req.body.photoUrl === 'string' && req.body.photoUrl) {
      deleteByUrl(existing.photoUrl);
      updates.photoUrl = req.body.photoUrl;
    }

    await ref.update(updates);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const ref = db().collection('persons').doc(req.params.id);
  const snap = await ref.get();
  if (snap.exists) deleteByUrl(snap.data().photoUrl);
  await ref.delete();
  res.json({ ok: true });
});

export default router;
