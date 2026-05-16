import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Button, Card, Pill } from '../components/UI.jsx';

function Stat({ label, value, suffix, to }) {
  const inner = (
    <Card className="p-6 h-full transition-colors hover:bg-sunken">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="font-display text-5xl tabular-nums">{value}</div>
        {suffix && <div className="text-muted text-sm">{suffix}</div>}
      </div>
    </Card>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function fmtRelative(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 15) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function GettingStarted({ hasPeople, hasAds }) {
  const steps = [
    {
      done: hasPeople,
      title: 'Add someone',
      hint: 'Create a person in People — their UID can be linked later for the user dashboard.',
      cta: { to: '/people', label: 'Open People' },
    },
    {
      done: hasAds,
      title: 'Add a video',
      hint: 'Drop a video URL into the playlist so the display has something to show.',
      cta: { to: '/playlist', label: 'Open playlist' },
    },
    {
      done: false,
      title: 'Run a test',
      hint: 'Open the display, then hit "Test" on a person to see the greeting live.',
      cta: { to: '/people', label: 'Test a person' },
    },
  ];

  return (
    <Card className="mb-10 p-6">
      <div className="text-xs uppercase tracking-[0.18em] text-muted mb-4">Get started</div>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex items-start gap-4">
            <div
              className={`mt-0.5 h-6 w-6 rounded-full grid place-items-center text-xs flex-shrink-0 ${
                s.done ? 'bg-sage text-white' : 'bg-sunken text-muted'
              }`}
            >
              {s.done ? '✓' : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${s.done ? 'text-muted line-through' : ''}`}>
                {s.title}
              </div>
              <div className="text-sm text-muted mt-0.5">{s.hint}</div>
            </div>
            <Link to={s.cta.to}>
              <Button variant="outline">{s.cta.label}</Button>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function refresh() {
    try {
      const [ads, persons, queue, entries] = await Promise.all([
        api.listAds(),
        api.listPersons(),
        api.collabQueue(),
        api.recentEntrances(10),
      ]);
      setData({
        ads: ads.ads,
        persons: persons.persons,
        queue: queue.queue,
        entries: entries.entrances,
      });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, []);

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-10 py-12">
        <div className="rounded-lg border border-[#B85C38]/30 bg-[#B85C38]/5 px-4 py-3 text-sm text-[#B85C38]">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-5xl mx-auto px-10 py-12 text-muted text-sm">Loading…</div>;
  }

  const liveAds = data.ads.filter((a) => a.status === 'approved');
  const totalVisits = data.persons.reduce((acc, p) => acc + (p.entries ?? 0), 0);
  const lastVisit = data.entries[0]?.at ?? null;
  const showGettingStarted = data.persons.length === 0 || liveAds.length === 0;

  return (
    <div className="max-w-5xl mx-auto px-10 py-12">
      <header className="mb-10">
        <h1 className="font-display text-3xl">Overview</h1>
        <p className="text-muted mt-1">Today's display at a glance.</p>
      </header>

      {showGettingStarted && (
        <GettingStarted hasPeople={data.persons.length > 0} hasAds={data.ads.length > 0} />
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat label="On air" value={liveAds.length} suffix={`of ${data.ads.length}`} to="/playlist" />
        <Stat label="People" value={data.persons.length} to="/people" />
        <Stat label="Total visits" value={totalVisits} to="/activity" />
        <Stat label="Pending review" value={data.queue.length} to="/review" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <h2 className="font-medium">Live activity</h2>
            <Link to="/activity" className="text-sm text-sage hover:text-sage-deep">
              View all
            </Link>
          </div>
          {data.entries.length === 0 ? (
            <div className="p-10 text-center text-muted text-sm">
              No greetings yet.
              {data.persons.length > 0 && (
                <div className="mt-2">
                  <Link to="/people" className="text-sage hover:text-sage-deep">
                    Trigger a test from People →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {data.entries.slice(0, 8).map((e) => (
                <li key={e.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <span className="truncate">{e.name}</span>
                  <span className="text-muted text-xs">{fmtRelative(e.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="px-5 py-5 border-b border-line">
            <h2 className="font-medium">Playlist preview</h2>
            <p className="text-xs text-muted mt-1">
              {liveAds.length === 0 ? 'No ads on air' : `${liveAds.length} on air`}
            </p>
          </div>
          {liveAds.length === 0 ? (
            <div className="p-10 text-center text-muted text-sm">
              <Link to="/playlist" className="text-sage hover:text-sage-deep">
                Add a video →
              </Link>
            </div>
          ) : (
            <ol className="divide-y divide-line">
              {liveAds.slice(0, 6).map((ad, i) => (
                <li key={ad.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-5 text-muted tabular-nums text-sm">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{ad.title}</div>
                  </div>
                  {ad.source === 'collaboration' && <Pill tone="sage">collab</Pill>}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </section>

      <p className="text-xs text-muted mt-8 text-center">
        Last greeting {lastVisit ? fmtRelative(lastVisit) : '—'} · refreshes every 8s
      </p>
    </div>
  );
}
