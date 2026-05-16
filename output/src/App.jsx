import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { preloadModels, startRecognition } from './recognition.js';
import {
  animateShootingStar,
  BIRTHDAY_PALETTE,
  birthdayMatchesToday,
  drawConstellation,
  drawSilhouette,
  greetingEyebrow,
  milestoneFor,
  normalizeStars,
  paletteForHour,
} from './greetingFx.js';

const POLL_MS = Number(import.meta.env.VITE_POLL_MS ?? 1500);
const PLAYLIST_REFRESH_MS = 30_000;
const PROFILES_REFRESH_MS = 60_000;
const GREETING_HOLD_MS = 7800;

// A casually-tilted photo card. Floats in beside the greeting text.
function Polaroid({ src, caption, dateStamp }) {
  if (!src) return null;
  return (
    <div className="polaroid-in" style={{ willChange: 'transform' }}>
      <div
        className="bg-[#f5f1e7] p-3 pb-9 rounded-[2px]"
        style={{
          boxShadow:
            '0 30px 60px -12px rgba(0,0,0,0.6), 0 12px 24px -6px rgba(0,0,0,0.45)',
        }}
      >
        <div className="w-64 h-72 md:w-72 md:h-80 overflow-hidden bg-black/80">
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            style={{ filter: 'contrast(1.03) saturate(0.96)' }}
          />
        </div>
        <div className="mt-3 text-center text-neutral-700">
          <div
            className="font-display text-lg leading-tight"
            style={{ letterSpacing: '0.01em' }}
          >
            {caption}
          </div>
          {dateStamp && (
            <div className="mt-0.5 text-[10px] uppercase text-neutral-500 tabular" style={{ letterSpacing: '0.28em' }}>
              {dateStamp}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// A number that smoothly counts from 0 → target over `duration`, with
// tabular-nums rendering so digits don't dance during the climb.
function CountUp({ value, duration = 1100, className = '', delay = 0 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof value !== 'number' || value <= 0) {
      setN(0);
      return;
    }
    let raf = 0;
    const start = performance.now() + delay;
    function tick(now) {
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay]);
  return <span className={`tabular ${className}`}>{n}</span>;
}

function Greeting({ event, camSourceRef, onDone }) {
  const [closing, setClosing] = useState(false);
  const portraitRef = useRef(null);
  const constellationRef = useRef(null);
  const starRef = useRef(null);
  const overlayRef = useRef(null);

  // Birthday wins over time-of-day for palette + eyebrow + greeting.
  const isBirthday = useMemo(() => {
    if (event.isBirthday) return true;
    return birthdayMatchesToday(event.birthday, event.at || Date.now());
  }, [event.isBirthday, event.birthday, event.at]);

  const { palette, eyebrow, title } = useMemo(() => {
    const h = new Date(event.at || Date.now()).getHours();
    return {
      palette: isBirthday ? BIRTHDAY_PALETTE : paletteForHour(h),
      eyebrow: greetingEyebrow(h, { isBirthday }),
      title: isBirthday
        ? `Happy birthday, ${event.name}.`
        : event.greeting || `Welcome, ${event.name}.`,
    };
  }, [event.at, event.name, event.greeting, isBirthday]);

  // Server-authoritative sky: admins can curate, so we always fetch fresh.
  // While the request is in-flight we render a one-star placeholder so the
  // constellation feels live, not empty.
  const [stars, setStars] = useState(() =>
    normalizeStars([], event.at || Date.now()),
  );
  useEffect(() => {
    if (!event.personId) {
      setStars(normalizeStars([], event.at || Date.now()));
      return;
    }
    let cancelled = false;
    api.stars(event.personId).then(
      ({ stars: serverStars }) => {
        if (cancelled) return;
        setStars(normalizeStars(serverStars, event.at || Date.now()));
      },
      () => {/* network blip — leave the placeholder */},
    );
    return () => {
      cancelled = true;
    };
  }, [event.personId, event.at]);

  const milestone = useMemo(
    () => milestoneFor({ entries: event.entries, streak: event.streak, isBirthday }),
    [event.entries, event.streak, isBirthday],
  );

  // ── Layer A: live silhouette portrait ─────────────────────────────────
  // Samples the camera each frame; falls back to the profile photo (or
  // skips quietly) if the camera isn't available.
  useEffect(() => {
    const canvas = portraitRef.current;
    if (!canvas) return;
    const { devicePixelRatio: dpr = 1 } = window;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    let raf = 0;
    let photoEl = null;

    function tick() {
      const live = camSourceRef?.current;
      const source =
        live && live.readyState >= 2 && live.videoWidth > 0 ? live : photoEl;
      if (source) drawSilhouette(canvas, source, { mirror: source === live });
      raf = requestAnimationFrame(tick);
    }

    if (event.photoUrl) {
      photoEl = new Image();
      photoEl.crossOrigin = 'anonymous';
      photoEl.src = event.photoUrl;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [event.photoUrl, camSourceRef]);

  // ── Layer B: personal constellation ───────────────────────────────────
  useEffect(() => {
    const canvas = constellationRef.current;
    if (!canvas) return;
    const { devicePixelRatio: dpr = 1 } = window;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    let raf = 0;
    let start = performance.now();
    function tick(now) {
      const t = (now - start) / 1000;
      const pulse = 1 + Math.sin(t * 2.2) * 0.08;
      drawConstellation(canvas, stars, { pulse, accent: palette.star });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stars, palette.star]);

  // ── Layer D: shooting star (milestones only) ──────────────────────────
  useEffect(() => {
    if (!milestone) return;
    const canvas = starRef.current;
    if (!canvas) return;
    const { devicePixelRatio: dpr = 1 } = window;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    const t = setTimeout(() => {
      animateShootingStar(canvas, { duration: 1700 });
    }, 2200);
    return () => clearTimeout(t);
  }, [milestone]);

  // Choreographed exit.
  useEffect(() => {
    const t = setTimeout(() => setClosing(true), GREETING_HOLD_MS - 700);
    const done = setTimeout(onDone, GREETING_HOLD_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(done);
    };
  }, [event, onDone]);

  const pastStars = stars.filter((s) => !s.ephemeral && s.at < (event.at || Date.now()));
  const lastVisitAt = pastStars.length ? pastStars[pastStars.length - 1].at : null;
  const visitsBefore = Math.max(0, (event.entries ?? stars.length) - 1);
  const showStreak = typeof event.streak === 'number' && event.streak > 1;
  const showEntries = typeof event.entries === 'number' && event.entries > 0;

  return (
    <div
      ref={overlayRef}
      className={
        (closing ? 'greet-exit ' : 'greet-enter ') +
        'absolute inset-0 z-30 overflow-hidden bg-black'
      }
    >
      {/* Time-of-day horizon — a single soft band */}
      <div
        className="horizon-glow pointer-events-none absolute inset-x-0 top-0 h-2/3"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${palette.tint} 0%, rgba(0,0,0,0) 65%)`,
        }}
      />

      {/* Layer A — silhouette portrait, breathing quietly behind the title */}
      <canvas
        ref={portraitRef}
        className="portrait-breathe pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* Layer D — the shooting star canvas (only renders on milestone) */}
      {milestone && (
        <canvas
          ref={starRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      )}

      {/* Layer C — data poetry. Two-column composition: polaroid + text,
          centered as a group. */}
      <div className="absolute inset-0 flex items-center justify-center gap-12 md:gap-20 px-12">
        {event.photoUrl && (
          <div className="hidden md:block flex-shrink-0">
            <Polaroid
              src={event.photoUrl}
              caption={event.name}
              dateStamp={new Date(event.at || Date.now())
                .toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
                .toUpperCase()}
            />
          </div>
        )}
        <div className="text-left max-w-[60vw]">
          <div
            className="eyebrow-in text-white uppercase text-xs md:text-sm mb-6"
            style={{ letterSpacing: '0.42em' }}
          >
            {eyebrow}
          </div>
          <h1
            className="title-in font-display text-6xl md:text-8xl font-medium tracking-tight leading-[0.98] text-white"
            style={{ textShadow: '0 2px 30px rgba(0,0,0,0.45)' }}
          >
            {title}
          </h1>

          {(showEntries || showStreak) && (
            <div className="stats-in mt-10 flex items-center gap-10 text-white/80 text-lg md:text-xl">
              {showEntries && (
                <span className="flex items-baseline gap-2">
                  <CountUp value={event.entries} delay={400} className="text-3xl md:text-4xl font-medium" />
                  <span className="opacity-70">
                    {event.entries === 1 ? 'visit' : 'visits'}
                  </span>
                </span>
              )}
              {showStreak && (
                <span className="flex items-baseline gap-2">
                  <CountUp value={event.streak} delay={650} className="text-3xl md:text-4xl font-medium" />
                  <span className="opacity-70">day streak</span>
                </span>
              )}
            </div>
          )}

          {milestone && (
            <div
              className="whisper-in mt-6 text-sm md:text-base uppercase"
              style={{ letterSpacing: '0.32em', color: palette.star }}
            >
              {milestone}
            </div>
          )}

          {!milestone && lastVisitAt && (
            <div className="whisper-in mt-6 text-white/40 text-xs md:text-sm">
              You were last here {timeAgo(lastVisitAt)}
            </div>
          )}
        </div>
      </div>

      {/* Layer B — the personal constellation, lower-left */}
      <div className="constellation-rise pointer-events-none absolute bottom-8 left-8 w-[280px] h-[160px]">
        <canvas ref={constellationRef} className="h-full w-full" />
        <div
          className="mt-2 text-[10px] uppercase text-white/50"
          style={{ letterSpacing: '0.3em' }}
        >
          Your sky · {stars.length} {stars.length === 1 ? 'star' : 'stars'}
        </div>
      </div>
    </div>
  );
}

function timeAgo(ms) {
  if (!ms) return 'recently';
  const diff = Date.now() - ms;
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just a moment ago';
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? '' : 's'} ago`;
  const y = Math.round(mo / 12);
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

function IdleSplash() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black">
      <img src="/icon.png" alt="" className="h-16 w-16 rounded-md opacity-40" />
    </div>
  );
}

function StartOverlay({ onStart, message, busy }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/60 backdrop-blur-sm">
      <div className="text-center max-w-md px-6">
        <img src="/icon.png" alt="" className="h-12 w-12 rounded-md opacity-80 mx-auto mb-6" />
        <p className="text-white/80 text-sm mb-6">{message}</p>
        <button
          onClick={onStart}
          disabled={busy}
          className="px-6 h-11 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-50"
        >
          {busy ? 'Starting…' : 'Enable camera'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [playlist, setPlaylist] = useState([]);
  const [index, setIndex] = useState(0);
  const [event, setEvent] = useState(null);
  const [recognition, setRecognition] = useState({ status: 'idle', message: '', profiles: 0 });

  const videoRef = useRef(null);
  const camRef = useRef(null);
  const recogRef = useRef(null);
  const sinceRef = useRef(Date.now());
  const errorCountRef = useRef(0);
  const profilesRef = useRef([]);

  // Load playlist on mount and refresh periodically
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { ads } = await api.playlist();
        if (cancelled) return;
        const list = Array.isArray(ads) ? ads.filter((a) => a.videoUrl) : [];
        setPlaylist(list);
        errorCountRef.current = 0;
        if (list.length === 0) {
          console.warn('[output] playlist is empty — add approved ads in /admin');
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[output] could not load playlist:', err);
          setPlaylist([]);
        }
      }
    }
    load();
    const id = setInterval(load, PLAYLIST_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Poll for greeting events (also fires when the kiosk itself recognizes)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const { event: ev } = await api.latestEvent(sinceRef.current);
        if (ev && ev.at > sinceRef.current) {
          sinceRef.current = ev.at;
          setEvent(ev);
        }
      } catch {
        /* keep trying */
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Pause video when greeting; resume when dismissed
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (event) v.pause();
    else v.play().catch(() => {});
  }, [event]);

  const advance = useCallback(() => {
    setIndex((i) => (playlist.length === 0 ? 0 : (i + 1) % playlist.length));
  }, [playlist.length]);

  const handleError = useCallback(
    (e) => {
      const current = playlist[index];
      console.warn('[output] video failed to load:', current?.videoUrl, e?.target?.error);
      errorCountRef.current += 1;
      if (playlist.length > 0 && errorCountRef.current < playlist.length * 2) advance();
    },
    [advance, index, playlist],
  );

  const handleLoaded = useCallback(() => {
    errorCountRef.current = 0;
  }, []);

  // ─────────────────────────────── face recognition
  const startCamera = useCallback(async () => {
    if (recogRef.current || recognition.status === 'starting') return;
    setRecognition((s) => ({ ...s, status: 'starting', message: '' }));
    try {
      const { profiles } = await api.profiles();
      profilesRef.current = profiles;
      if (!profiles || profiles.length === 0) {
        setRecognition({
          status: 'waiting',
          profiles: 0,
          message: 'No people with photos yet. Add someone in /admin to enable recognition.',
        });
        return;
      }
      const handle = await startRecognition({
        profiles,
        videoEl: camRef.current,
        onMatch: async (profile, { distance }) => {
          const fireAt = Date.now();
          console.log(`[recognition] match → ${profile.name} (d=${distance.toFixed(3)})`);

          // Fire the greeting locally NOW — don't wait for the network round-trip.
          setEvent({
            personId: profile.id,
            name: profile.name,
            greeting: profile.greeting || `Welcome, ${profile.name}.`,
            photoUrl: profile.photoUrl,
            birthday: profile.birthday ?? null,
            at: fireAt,
          });
          // Skip the polled mirror of this same event from the backend.
          sinceRef.current = fireAt + 60_000;

          try {
            const data = await api.detect(profile.id);
            // Patch streak + visit count in once the backend confirms.
            if (data) {
              setEvent((prev) => {
                if (!prev || prev.personId !== profile.id) return prev;
                const next = { ...prev };
                if (typeof data.streak === 'number') next.streak = data.streak;
                if (typeof data.entries === 'number') next.entries = data.entries;
                if (typeof data.isBirthday === 'boolean') next.isBirthday = data.isBirthday;
                if (data.birthday) next.birthday = data.birthday;
                return next;
              });
            }
          } catch (err) {
            console.warn('[recognition] detect POST failed:', err);
          }
        },
      });
      recogRef.current = handle;
      setRecognition({ status: 'running', profiles: handle.profileCount, message: '' });
    } catch (err) {
      console.warn('[recognition] failed:', err);
      const denied =
        err?.name === 'NotAllowedError' || err?.name === 'SecurityError';
      setRecognition({
        status: denied ? 'denied' : 'error',
        profiles: 0,
        message: denied
          ? 'Camera permission denied. Allow it in your browser to recognize people.'
          : err?.message || 'Could not start recognition.',
      });
    }
  }, [recognition.status]);

  // Warm up the face-api models in parallel with everything else, then auto-start.
  useEffect(() => {
    preloadModels().catch((err) => console.warn('[recognition] preload failed:', err));
    startCamera();
    return () => {
      recogRef.current?.stop?.();
      recogRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodically refresh known profiles. If the set changes meaningfully, restart.
  useEffect(() => {
    const id = setInterval(async () => {
      if (recognition.status !== 'running') return;
      try {
        const { profiles } = await api.profiles();
        const prev = profilesRef.current;
        const sig = (ps) =>
          ps.map((p) => `${p.id}:${p.photoUrl}`).sort().join('|');
        if (sig(profiles) !== sig(prev)) {
          console.log('[recognition] profiles changed — restarting');
          recogRef.current?.stop?.();
          recogRef.current = null;
          profilesRef.current = profiles;
          setRecognition({ status: 'idle', profiles: 0, message: '' });
          startCamera();
        }
      } catch {
        /* ignore */
      }
    }, PROFILES_REFRESH_MS);
    return () => clearInterval(id);
  }, [recognition.status, startCamera]);

  const current = playlist[index];

  const showStartOverlay =
    recognition.status === 'idle' ||
    recognition.status === 'denied' ||
    recognition.status === 'error' ||
    (recognition.status === 'waiting' && recognition.profiles === 0);

  const startMessage =
    recognition.status === 'denied' || recognition.status === 'error'
      ? recognition.message
      : recognition.status === 'waiting'
      ? recognition.message
      : 'Tap to enable the camera and start recognizing visitors.';

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white">
      {current ? (
        <video
          ref={videoRef}
          key={current.id}
          src={current.videoUrl}
          autoPlay
          muted
          playsInline
          onEnded={advance}
          onError={handleError}
          onLoadedData={handleLoaded}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <IdleSplash />
      )}

      {/* Camera element kept in the DOM (off-screen) so face recognition
          and the silhouette portrait can still sample frames — but no
          longer rendered as a visible preview. */}
      <video
        ref={camRef}
        muted
        playsInline
        autoPlay
        aria-hidden="true"
        className="pointer-events-none absolute opacity-0"
        style={{ width: 1, height: 1, left: -9999, top: -9999 }}
      />

      {showStartOverlay && (
        <StartOverlay
          onStart={startCamera}
          message={startMessage}
          busy={recognition.status === 'starting'}
        />
      )}

      {event && (
        <Greeting
          event={event}
          camSourceRef={camRef}
          onDone={() => {
            setEvent(null);
            sinceRef.current = Date.now();
          }}
        />
      )}
    </div>
  );
}
