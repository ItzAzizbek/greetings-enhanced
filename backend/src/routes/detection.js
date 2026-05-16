import { Router } from 'express';
import { db } from '../firebase.js';
import { requireAdmin } from '../middleware/auth.js';
import { birthdayYearKey, isBirthdayToday } from '../lib/birthday.js';

const router = Router();

const DEDUPE_WINDOW_MS = 30_000;
const STREAK_RESET_MS = 1000 * 60 * 60 * 36; // 36h grace window
const DAY_MS = 1000 * 60 * 60 * 24;

function sameLocalDay(a, b) {
  const da = new Date(a);
  const db_ = new Date(b);
  return (
    da.getFullYear() === db_.getFullYear() &&
    da.getMonth() === db_.getMonth() &&
    da.getDate() === db_.getDate()
  );
}

router.post('/event', async (req, res) => {
  const required = process.env.DETECTION_TOKEN;
  if (required) {
    const token = req.headers['x-detection-token'];
    if (token !== required) return res.status(401).json({ error: 'Invalid detection token' });
  }

  const { personId } = req.body || {};
  if (!personId) return res.status(400).json({ error: 'personId required' });

  const ref = db().collection('persons').doc(personId);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: 'Unknown person' });

  const person = snap.data();
  const now = Date.now();

  const isBirthday = isBirthdayToday(person.birthday, now);

  // Debounce repeat detections of the same person
  if (person.lastSeen && now - person.lastSeen < DEDUPE_WINDOW_MS) {
    return res.json({
      greeting: person.greeting,
      name: person.name,
      photoUrl: person.photoUrl ?? null,
      birthday: person.birthday ?? null,
      isBirthday,
      deduped: true,
    });
  }

  let streak = person.streak ?? 0;
  if (!person.lastSeen) {
    streak = 1;
  } else if (sameLocalDay(person.lastSeen, now)) {
    // same day — no change to streak
  } else if (now - person.lastSeen <= STREAK_RESET_MS) {
    streak += 1;
  } else {
    streak = 1;
  }

  await ref.update({
    entries: (person.entries ?? 0) + 1,
    streak,
    lastSeen: now,
  });

  await db().collection('entrances').add({
    personId,
    name: person.name,
    at: now,
  });

  // Auto-pin a single "Birthday" star per calendar year. Deterministic
  // doc ID makes the second-write-in-the-same-year a no-op.
  if (isBirthday) {
    const year = birthdayYearKey(now);
    const birthdayRef = db().collection('entrances').doc(`birthday-${personId}-${year}`);
    const existing = await birthdayRef.get();
    if (!existing.exists) {
      await birthdayRef.set({
        personId,
        name: person.name,
        at: now,
        label: 'Birthday',
        pinned: true,
        source: 'auto',
      });
    }
  }

  res.json({
    greeting: person.greeting,
    name: person.name,
    photoUrl: person.photoUrl ?? null,
    birthday: person.birthday ?? null,
    isBirthday,
    streak,
    entries: (person.entries ?? 0) + 1,
  });
});

// Admin-only: recent entrances feed for the dashboard.
router.get('/entrances', requireAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const snap = await db().collection('entrances').orderBy('at', 'desc').limit(limit).get();
  const entrances = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  res.json({ entrances });
});

// TV polling endpoint: returns the latest unhandled greeting event (if any).
router.get('/latest', async (req, res) => {
  const since = Number(req.query.since ?? 0);
  const snap = await db()
    .collection('entrances')
    .where('at', '>', since)
    .orderBy('at', 'desc')
    .limit(1)
    .get();

  if (snap.empty) return res.json({ event: null });
  const entry = { id: snap.docs[0].id, ...snap.docs[0].data() };
  const personSnap = await db().collection('persons').doc(entry.personId).get();
  const person = personSnap.exists ? personSnap.data() : {};
  res.json({
    event: {
      ...entry,
      greeting: person.greeting ?? `Welcome, ${entry.name}.`,
      photoUrl: person.photoUrl ?? null,
      birthday: person.birthday ?? null,
      isBirthday: isBirthdayToday(person.birthday, entry.at),
      streak: person.streak ?? null,
      entries: person.entries ?? null,
    },
  });
});

export default router;
