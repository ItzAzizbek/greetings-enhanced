import 'dotenv/config';
import path from 'node:path';
import express from 'express';

import adsRouter from './routes/ads.js';
import personsRouter from './routes/persons.js';
import detectionRouter from './routes/detection.js';
import usersRouter from './routes/users.js';
import collaborationsRouter from './routes/collaborations.js';
import recognitionRouter from './routes/recognition.js';
import starsRouter from './routes/stars.js';
import uploadsRouter from './routes/uploads.js';

const app = express();

// Explicit CORS. We previously used the `cors` package with `origin: true`, but
// under Vercel's edge the reflected Access-Control-Allow-Origin header was being
// dropped while the other CORS headers came through — leaving the browser to
// reject every request. Setting the header by hand bypasses that.
// TEMP: allow-all per corp "personal checks". If CORS_ORIGINS is set (comma
// list), only those origins are reflected; otherwise everything is reflected.
const ALLOWED = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allow =
    !ALLOWED.length || (origin && ALLOWED.includes(origin));
  if (allow && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allow) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ||
      'Authorization,Content-Type',
  );
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  return next();
});

// Preserve raw body for webhook signature verification
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  }),
);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Serve user-uploaded photos
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), 'uploads'), {
    maxAge: '1h',
  }),
);

app.use('/api/ads', adsRouter);
app.use('/api/persons', personsRouter);
app.use('/api/detection', detectionRouter);
app.use('/api/users', usersRouter);
app.use('/api/collaborations', collaborationsRouter);
app.use('/api/recognition', recognitionRouter);
app.use('/api/stars', starsRouter);
app.use('/api/uploads', uploadsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

// Vercel sets process.env.VERCEL; in that case the platform invokes the
// exported app as a serverless handler, so don't bind a port.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Greetings Enhanced API listening on :${PORT}`);
  });
}

export default app;
