import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
const MATCH_THRESHOLD = 0.55;       // L2 distance — lower is stricter
const DETECT_INTERVAL_MS = 250;     // detect loop cadence
const MATCH_COOLDOWN_MS = 30_000;
const CACHE_KEY = 'greetings.face-descriptors.v1';

let modelsLoaded = false;
let modelLoadPromise = null;

export function preloadModels() {
  if (modelLoadPromise) return modelLoadPromise;
  modelLoadPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]).then(() => {
    modelsLoaded = true;
  });
  return modelLoadPromise;
}

async function ensureModels() {
  if (modelsLoaded) return;
  await preloadModels();
}

// ─────────────────── descriptor caching (localStorage)
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* over-quota or disabled — silently ignore */
  }
}

function cacheKey(profile) {
  return `${profile.id}|${profile.photoUrl}`;
}

async function descriptorFor(photoUrl) {
  const img = await faceapi.fetchImage(photoUrl);
  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
}

async function buildLabeled(profiles) {
  const cache = readCache();
  let cacheDirty = false;

  const out = await Promise.all(
    profiles.map(async (p) => {
      const key = cacheKey(p);
      let descriptor = null;

      // Try cache first
      const cached = cache[key];
      if (cached && Array.isArray(cached) && cached.length === 128) {
        descriptor = new Float32Array(cached);
      } else {
        try {
          const d = await descriptorFor(p.photoUrl);
          if (d) {
            descriptor = d;
            cache[key] = Array.from(d);
            cacheDirty = true;
          } else {
            console.warn(`[recognition] no face found in photo for ${p.name}`);
          }
        } catch (err) {
          console.warn(`[recognition] descriptor failed for ${p.name}:`, err);
        }
      }

      if (!descriptor) return null;
      return new faceapi.LabeledFaceDescriptors(p.id, [descriptor]);
    }),
  );

  if (cacheDirty) {
    // Drop entries for profiles that are no longer present
    const live = new Set(profiles.map(cacheKey));
    Object.keys(cache).forEach((k) => {
      if (!live.has(k)) delete cache[k];
    });
    writeCache(cache);
  }

  return out.filter(Boolean);
}

// Starts the recognition loop. Returns { stop, profileCount } once running.
// onMatch is called with (profile, { distance }) — the full profile object so
// the caller can render the greeting instantly without waiting on the server.
export async function startRecognition({ profiles, videoEl, onMatch }) {
  await ensureModels();

  const labeled = await buildLabeled(profiles);
  if (labeled.length === 0) {
    throw new Error('No usable face descriptors. Make sure people have photos with a visible face.');
  }
  const matcher = new faceapi.FaceMatcher(labeled, MATCH_THRESHOLD);
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play();

  const cooldown = new Map();
  let running = true;
  // inputSize 608 is the largest TinyFaceDetector size — needed so faces that
  // are only a few dozen pixels tall (people across the room) still register.
  // scoreThreshold lowered to 0.4 because distant faces detect with less confidence.
  const detectorOpts = new faceapi.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.4 });

  (async function loop() {
    while (running) {
      try {
        const detections = await faceapi
          .detectAllFaces(videoEl, detectorOpts)
          .withFaceLandmarks()
          .withFaceDescriptors();

        for (const detection of detections) {
          const best = matcher.findBestMatch(detection.descriptor);
          if (best.label === 'unknown') continue;
          const personId = best.label;
          const now = Date.now();
          const last = cooldown.get(personId) ?? 0;
          if (now - last <= MATCH_COOLDOWN_MS) continue;
          cooldown.set(personId, now);
          const profile = profileById.get(personId);
          if (!profile) continue;
          try {
            await onMatch(profile, { distance: best.distance });
          } catch (err) {
            console.warn('[recognition] onMatch threw:', err);
          }
        }
      } catch (err) {
        if (running) console.warn('[recognition] detect error:', err);
      }
      await new Promise((r) => setTimeout(r, DETECT_INTERVAL_MS));
    }
  })();

  return {
    stop() {
      running = false;
      stream.getTracks().forEach((t) => t.stop());
      videoEl.srcObject = null;
    },
    profileCount: labeled.length,
  };
}
