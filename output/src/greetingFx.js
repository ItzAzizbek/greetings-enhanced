// "The Mirror" — quietly-clever greeting visuals.
// Star data is server-authoritative (admins curate it); this module only
// draws what it's handed. Star shape: { id, at, label?, pinned?, source? }.

export function normalizeStars(rawStars, currentAt) {
  const list = Array.isArray(rawStars)
    ? rawStars.filter((s) => s && typeof s.at === 'number')
    : [];
  list.sort((a, b) => a.at - b.at);
  if (typeof currentAt === 'number') {
    // If the current visit hasn't yet been persisted server-side, append
    // an ephemeral star so the constellation feels live.
    const seen = list.some((s) => Math.abs(s.at - currentAt) < 60_000);
    if (!seen) list.push({ at: currentAt, ephemeral: true });
  }
  return list;
}

// ── Time-of-day → soft accent ──────────────────────────────────────────
// Returns a horizon-tint color the rest of the composition picks up.
export function paletteForHour(hour) {
  if (hour < 6)  return { tint: 'rgba(70, 90, 140, 0.18)',  star: '#cfd9ff' }; // pre-dawn
  if (hour < 11) return { tint: 'rgba(245, 200, 140, 0.22)', star: '#fff3dd' }; // morning
  if (hour < 16) return { tint: 'rgba(220, 230, 235, 0.12)', star: '#ffffff' }; // midday
  if (hour < 20) return { tint: 'rgba(230, 150, 110, 0.20)', star: '#ffd9bb' }; // golden
  return            { tint: 'rgba(50, 70, 110, 0.22)',  star: '#cdd6f4' }; // night
}

// On birthdays the horizon takes a warm rose-gold cast — quiet, not loud.
export const BIRTHDAY_PALETTE = {
  tint: 'rgba(235, 160, 175, 0.28)',
  star: '#ffd6c2',
};

export function greetingEyebrow(hour, { isBirthday } = {}) {
  if (isBirthday) return 'A small celebration';
  if (hour < 5)  return 'Late, but welcome';
  if (hour < 11) return 'Good morning';
  if (hour < 16) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

// Match a YYYY-MM-DD birthday string against today's local date.
export function birthdayMatchesToday(birthday, atMs = Date.now()) {
  if (!birthday || typeof birthday !== 'string') return false;
  if (birthday.length < 10) return false;
  const d = new Date(atMs);
  const today =
    `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return birthday.slice(5, 10) === today;
}

// ── Generative portrait: live camera → drifting dot field ──────────────
// Samples the video each tick onto a small offscreen canvas, then plots
// soft dots at grid points where luminance crosses a threshold. The result
// is a barely-there silhouette that *is* the person looking back.
export function drawSilhouette(canvas, source, opts = {}) {
  if (!canvas || !source) return;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const W = canvas.width;
  const H = canvas.height;
  if (!W || !H) return;

  // Source frame is downsampled to a coarse luminance grid.
  const COLS = 96;
  const ROWS = 54;
  const off = drawSilhouette._off || (drawSilhouette._off = document.createElement('canvas'));
  off.width = COLS;
  off.height = ROWS;
  const octx = off.getContext('2d', { willReadFrequently: true });

  // Source may be a <video> or <img>; both expose intrinsic dimensions.
  const sw = source.videoWidth || source.naturalWidth || source.width;
  const sh = source.videoHeight || source.naturalHeight || source.height;
  if (!sw || !sh) return;

  // Cover-fit into the offscreen, mirrored on X (camera is mirrored in UI).
  const srcAspect = sw / sh;
  const dstAspect = COLS / ROWS;
  let dw = COLS;
  let dh = ROWS;
  let dx = 0;
  let dy = 0;
  if (srcAspect > dstAspect) {
    dh = ROWS;
    dw = ROWS * srcAspect;
    dx = (COLS - dw) / 2;
  } else {
    dw = COLS;
    dh = COLS / srcAspect;
    dy = (ROWS - dh) / 2;
  }
  octx.save();
  octx.clearRect(0, 0, COLS, ROWS);
  if (opts.mirror !== false) {
    octx.translate(COLS, 0);
    octx.scale(-1, 1);
    octx.drawImage(source, -dx - dw, dy, dw, dh);
  } else {
    octx.drawImage(source, dx, dy, dw, dh);
  }
  octx.restore();

  let img;
  try {
    img = octx.getImageData(0, 0, COLS, ROWS);
  } catch {
    return; // tainted canvas (cross-origin photo) — skip silently
  }
  const data = img.data;

  // Compute mean luminance to set an adaptive threshold.
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const mean = sum / (COLS * ROWS);
  const threshold = mean * 0.85; // dots appear on the brighter half of the frame

  ctx.clearRect(0, 0, W, H);
  const cellW = W / COLS;
  const cellH = H / ROWS;
  const star = opts.color || 'rgba(255, 255, 255, 0.55)';
  ctx.fillStyle = star;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const idx = (y * COLS + x) * 4;
      const l = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (l < threshold) continue;
      // Brighter pixels → bigger, more opaque dots.
      const norm = Math.min(1, (l - threshold) / (255 - threshold));
      const r = 0.6 + norm * 1.6;
      ctx.globalAlpha = 0.25 + norm * 0.6;
      ctx.beginPath();
      ctx.arc(x * cellW + cellW / 2, y * cellH + cellH / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// ── Personal constellation: each prior visit is a star ─────────────────
// Star coordinates are deterministic from the visit timestamp, so the
// same sky always reappears for the same person.
function hash01(n) {
  // Mulberry32-ish — deterministic, decent distribution for our purposes.
  let t = (n | 0) ^ 0x9e3779b9;
  t = Math.imul(t ^ (t >>> 16), 0x85ebca6b);
  t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35);
  t = (t ^ (t >>> 16)) >>> 0;
  return t / 4294967296;
}

function starPosition(at, W, H, padding) {
  const px = hash01(at);
  const py = hash01(at ^ 0x5a5a5a5a);
  return {
    x: padding + px * (W - padding * 2),
    y: padding + py * (H - padding * 2),
  };
}

export function drawConstellation(canvas, stars, opts = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  if (!W || !H) return;
  ctx.clearRect(0, 0, W, H);

  if (!stars || stars.length === 0) return;

  const accent = opts.accent || '#9fb9b1';
  const dim = 'rgba(255, 255, 255, 0.45)';
  const pad = 18;

  const points = stars.map((s) => ({
    ...s,
    ...starPosition(s.at, W, H, pad),
  }));

  // Streak-line: the most recent N stars joined by a faint polyline.
  const tail = points.slice(-7);
  if (tail.length > 1) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(tail[0].x, tail[0].y);
    for (let i = 1; i < tail.length; i++) ctx.lineTo(tail[i].x, tail[i].y);
    ctx.stroke();
  }

  // Past stars — small, dim. Pinned ones glow softly and keep their label.
  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i];
    const age = (points.length - 1 - i) / points.length;

    if (p.pinned) {
      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
      halo.addColorStop(0, accent);
      halo.addColorStop(1, 'rgba(159, 185, 177, 0)');
      ctx.fillStyle = halo;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const r = 0.8 + (1 - age) * 0.9;
      ctx.fillStyle = dim;
      ctx.globalAlpha = 0.35 + (1 - age) * 0.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Current visit — the bright star, with a soft halo.
  const cur = points[points.length - 1];
  const pulse = opts.pulse ?? 1;
  const grad = ctx.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, 14 * pulse);
  grad.addColorStop(0, accent);
  grad.addColorStop(0.4, 'rgba(159, 185, 177, 0.5)');
  grad.addColorStop(1, 'rgba(159, 185, 177, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cur.x, cur.y, 14 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cur.x, cur.y, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Pinned-star label: a single named star (the most recent pinned one
  // before the current visit) gets its label whispered next to it. Keeps
  // the panel calm — we never label every star.
  const namedPast = points
    .slice(0, -1)
    .reverse()
    .find((p) => p.pinned && p.label);
  if (namedPast) {
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const labelX = Math.min(namedPast.x + 8, W - 4);
    const labelY = Math.max(namedPast.y - 8, 10);
    ctx.textAlign = labelX > W - 60 ? 'right' : 'left';
    ctx.fillText(namedPast.label, labelX, labelY);
  }
}

// ── Milestone detection ────────────────────────────────────────────────
// Returns a short label if this visit deserves the shooting star, else null.
// Tuned to fire on ~10% of visits so it stays meaningful.
export function milestoneFor({ entries, streak, isBirthday }) {
  if (isBirthday) return 'birthday';
  if (entries === 1) return 'first visit';
  if (typeof entries === 'number') {
    if (entries === 10) return '10 visits';
    if (entries === 25) return '25 visits';
    if (entries === 50) return '50 visits';
    if (entries === 100) return '100 visits';
    if (entries > 100 && entries % 100 === 0) return `${entries} visits`;
  }
  if (typeof streak === 'number' && streak > 0 && streak % 7 === 0) {
    return streak === 7 ? 'one week' : `${streak / 7} weeks running`;
  }
  return null;
}

// ── Shooting star: a single trail across the canvas ────────────────────
// One-shot animation; caller invokes once per milestone and disposes.
export function animateShootingStar(canvas, { duration = 1600, onDone } = {}) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const start = performance.now();
  // Diagonal path from upper-left-ish to mid-right-ish, randomized.
  const x0 = -W * 0.05;
  const y0 = H * (0.1 + Math.random() * 0.2);
  const x1 = W * 0.75;
  const y1 = H * (0.55 + Math.random() * 0.2);

  let raf = 0;
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    ctx.clearRect(0, 0, W, H);
    // The head.
    const hx = x0 + (x1 - x0) * t;
    const hy = y0 + (y1 - y0) * t;
    // Trail length grows then shrinks.
    const tailLen = Math.sin(Math.min(1, t * 1.4) * Math.PI) * 0.35;
    const tx = hx - (x1 - x0) * tailLen;
    const ty = hy - (y1 - y0) * tailLen;
    const grad = ctx.createLinearGradient(tx, ty, hx, hy);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    // Head glow.
    const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 8);
    halo.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(hx, hy, 8, 0, Math.PI * 2);
    ctx.fill();

    if (t < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, W, H);
      onDone?.();
    }
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
