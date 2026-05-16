import { Router } from 'express';
import { db } from '../firebase.js';
import { requireUser, isAdminEmail } from '../middleware/auth.js';

const router = Router();

// Returns the persona linked to the current Firebase user, if any.
router.get('/me', requireUser, async (req, res) => {
  const uid = req.user.uid;
  const email = req.user.email ?? null;
  const role = isAdminEmail(email) ? 'admin' : 'viewer';

  const personaQ = await db().collection('persons').where('linkedUserId', '==', uid).limit(1).get();
  const persona = personaQ.empty ? null : { id: personaQ.docs[0].id, ...personaQ.docs[0].data() };

  let recentEntrances = [];
  if (persona) {
    const entranceSnap = await db()
      .collection('entrances')
      .where('personId', '==', persona.id)
      .get();
    recentEntrances = entranceSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
      .slice(0, 20);
  }

  res.json({
    user: { uid, email, role },
    persona,
    recentEntrances,
  });
});

router.get('/leaderboard', async (_req, res) => {
  const snap = await db().collection('persons').orderBy('entries', 'desc').limit(25).get();
  const board = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      entries: data.entries ?? 0,
      streak: data.streak ?? 0,
      photoUrl: data.photoUrl ?? null,
    };
  });
  res.json({ leaderboard: board });
});

export default router;
