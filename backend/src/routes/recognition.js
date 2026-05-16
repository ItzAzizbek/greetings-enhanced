import { Router } from 'express';
import { db } from '../firebase.js';

const router = Router();

// Public: minimum profile data the /output kiosk needs to recognize known faces.
// Only persons that have a photoUrl are returned.
router.get('/profiles', async (_req, res) => {
  try {
    const snap = await db().collection('persons').get();
    const profiles = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => p.photoUrl)
      .map((p) => ({
        id: p.id,
        name: p.name,
        greeting: p.greeting ?? null,
        photoUrl: p.photoUrl,
        birthday: p.birthday ?? null,
      }));
    res.json({ profiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
