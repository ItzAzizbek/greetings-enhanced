import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Card, EmptyState, Pill } from '../components/UI.jsx';

function fmtAbs(ts) {
  return new Date(ts).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtRelative(ts) {
  if (!ts) return '';
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

function groupByDay(entries) {
  const groups = new Map();
  for (const e of entries) {
    const key = new Date(e.at).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return Array.from(groups.entries()).map(([day, items]) => ({ day, items }));
}

export default function Activity() {
  const [entrances, setEntrances] = useState(null);
  const [error, setError] = useState(null);

  async function refresh() {
    try {
      const { entrances } = await api.recentEntrances(100);
      setEntrances(entrances);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  const groups = useMemo(() => groupByDay(entrances ?? []), [entrances]);
  const todayCount = useMemo(() => {
    if (!entrances) return 0;
    const today = new Date().toDateString();
    return entrances.filter((e) => new Date(e.at).toDateString() === today).length;
  }, [entrances]);

  return (
    <div className="max-w-4xl mx-auto px-10 py-12">
      <header className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl">Activity</h1>
          <p className="text-muted mt-1">Every greeting the display has given, newest first.</p>
        </div>
        <div className="text-right">
          <div className="font-display text-4xl tabular-nums leading-none">{todayCount}</div>
          <div className="text-xs text-muted uppercase tracking-[0.18em] mt-1">today</div>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-[#B85C38]/30 bg-[#B85C38]/5 px-4 py-3 text-sm text-[#B85C38]">
          {error}
        </div>
      )}

      {!entrances ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : entrances.length === 0 ? (
        <EmptyState
          title="No detections yet"
          hint="Trigger a test from the People page to see entries appear here in real time."
        />
      ) : (
        <Card>
          <ul>
            {groups.map((g) => (
              <li key={g.day} className="border-b border-line last:border-b-0">
                <div className="px-6 pt-5 pb-2 flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted">{g.day}</span>
                  <span className="text-xs text-muted">{g.items.length} greeting{g.items.length === 1 ? '' : 's'}</span>
                </div>
                <ul className="divide-y divide-line">
                  {g.items.map((e) => (
                    <li key={e.id} className="flex items-center gap-4 px-6 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{e.name}</div>
                        <div className="text-xs text-muted">{fmtAbs(e.at)}</div>
                      </div>
                      <Pill tone="sage">{fmtRelative(e.at)}</Pill>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
